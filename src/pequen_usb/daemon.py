import json
import logging
from concurrent.futures import ThreadPoolExecutor
import dbus
import dbus.service
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

from pequen_usb.dbus_client import USBGuardDBusClient, USBGuardRuleParser, USBDevice
from pequen_usb.history import HistoryManager
from pequen_usb.config import ConfigManager
from pequen_usb.i18n import t

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("pequen-usb")


class PequénSessionService(dbus.service.Object):
    """Session DBus service exposed by Pequén USB to GNOME Shell extension."""

    BUS_NAME = "org.pequen.USBGuard"
    OBJECT_PATH = "/org/pequen/USBGuard"

    def __init__(self, daemon: "PequénDaemon"):
        self.daemon = daemon
        self.executor = ThreadPoolExecutor(max_workers=4)
        bus_name = dbus.service.BusName(self.BUS_NAME, bus=dbus.SessionBus())
        super().__init__(bus_name, self.OBJECT_PATH)

    @dbus.service.method("org.pequen.USBGuard", in_signature="", out_signature="s")
    def GetDevices(self) -> str:
        """Returns JSON list of active devices with rule status, category, and pinning."""
        perm_map = self.daemon.history.get_permanence_map()
        pinned_set = set(self.daemon.config.get("pinned_devices", []))
        devices = self.daemon.client.get_all_devices(permanent_map=perm_map, pinned_set=pinned_set)
        return json.dumps([d.to_dict() for d in devices])

    @dbus.service.method("org.pequen.USBGuard", in_signature="i", out_signature="s")
    def GetHistory(self, limit: int) -> str:
        """Returns JSON list of connection history."""
        records = self.daemon.history.get_recent_history(limit=limit or 50)
        return json.dumps(records)

    @dbus.service.method("org.pequen.USBGuard", in_signature="isb", out_signature="b")
    def ApplyPolicy(self, device_id: int, action: str, permanent: bool) -> bool:
        """Applies policy (allow/block/reject) to a device asynchronously off the main loop."""
        def _execute_apply():
            try:
                self.daemon.client.apply_policy(device_id, action, permanent)
                perm_map = self.daemon.history.get_permanence_map()
                devices = self.daemon.client.get_all_devices(permanent_map=perm_map)
                target_dev = next((d for d in devices if d.number == device_id), None)

                name = target_dev.name if target_dev else f"Device {device_id}"
                vendor = target_dev.vendor_id if target_dev else ""
                product = target_dev.product_id if target_dev else ""

                self.daemon.history.log_event(
                    device_id=str(device_id),
                    name=name,
                    action_taken=action.lower(),
                    vendor_id=vendor,
                    product_id=product,
                    permanent=permanent,
                )
                GLib.idle_add(self.DevicePolicyChanged, device_id, action, permanent)
                return True
            except Exception as err:
                logger.error(f"Error applying policy for device {device_id}: {err}")
                return False

        future = self.executor.submit(_execute_apply)
        try:
            return future.result(timeout=30.0)
        except Exception as exc:
            logger.error(f"Timed out or failed applying policy for device {device_id}: {exc}")
            return False

    @dbus.service.method("org.pequen.USBGuard", in_signature="", out_signature="s")
    def GetConfig(self) -> str:
        """Returns configuration JSON."""
        return json.dumps(self.daemon.config.config)

    @dbus.service.method("org.pequen.USBGuard", in_signature="s", out_signature="b")
    def TogglePin(self, dev_id_str: str) -> bool:
        """Toggles quick access pinning for a device ID or HW ID."""
        is_pinned = self.daemon.config.toggle_pin(dev_id_str)
        self.ConfigChanged(json.dumps(self.daemon.config.config))
        return is_pinned

    @dbus.service.signal("org.pequen.USBGuard", signature="iss")
    def DeviceInserted(self, device_id: int, name: str, details_json: str) -> None:
        """Signal emitted when a new device is connected."""
        pass

    @dbus.service.signal("org.pequen.USBGuard", signature="isb")
    def DevicePolicyChanged(self, device_id: int, action: str, permanent: bool) -> None:
        """Signal emitted when a device policy is changed."""
        pass

    @dbus.service.signal("org.pequen.USBGuard", signature="s")
    def ConfigChanged(self, config_json: str) -> None:
        """Signal emitted when configuration is updated."""
        pass


class PequénDaemon:
    """Main Pequén USB Daemon listener with auto-reconnection safety."""

    def __init__(self):
        DBusGMainLoop(set_as_default=True)
        self.history = HistoryManager()
        self.config = ConfigManager()
        self.client = None
        self._init_client()
        self.service = PequénSessionService(self)

    def _init_client(self) -> bool:
        try:
            self.client = USBGuardDBusClient()
            self._setup_signals()
            return True
        except Exception as err:
            logger.warning(f"Could not connect to USBGuard DBus service: {err}")
            return False

    def _setup_signals(self) -> None:
        if self.client and hasattr(self.client, "devices_iface"):
            try:
                self.client.devices_iface.connect_to_signal(
                    "DevicePresenceChanged", self._on_device_presence_changed
                )
            except Exception as err:
                logger.error(f"Failed to subscribe to DevicePresenceChanged signal: {err}")

    def _on_device_presence_changed(
        self, dev_id: int, event: int, target: int, device_rule: str, attributes: dict
    ) -> None:
        parsed = USBGuardRuleParser.parse(str(device_rule))
        perm_map = self.history.get_permanence_map()
        pinned_set = set(self.config.get("pinned_devices", []))
        device = USBDevice(
            int(dev_id),
            parsed,
            is_permanent=perm_map.get(int(dev_id), False),
            is_pinned=str(dev_id) in pinned_set,
        )

        logger.info(t("device_event", id=dev_id, rule=device.rule, name=device.name))

        # Event: 1 = INSERT, 0 = PRESENT, 3 = REMOVE
        if event in (0, 1) and not device.is_allowed:
            self.history.log_event(
                device_id=str(dev_id),
                name=device.name,
                action_taken="blocked",
                vendor_id=device.vendor_id,
                product_id=device.product_id,
                serial=device.serial,
                hash_val=device.hash,
            )
            # Emit signal to GNOME Shell extension
            self.service.DeviceInserted(int(dev_id), device.name, json.dumps(device.to_dict()))

    def run(self) -> None:
        logger.info(t("daemon_listening"))
        loop = GLib.MainLoop()
        loop.run()


def main():
    daemon = PequénDaemon()
    daemon.run()


if __name__ == "__main__":
    main()
