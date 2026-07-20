import json
import dbus
import dbus.service
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

from pequen_usb.dbus_client import USBGuardDBusClient, USBGuardRuleParser, USBDevice
from pequen_usb.history import HistoryManager
from pequen_usb.i18n import t


class PequénSessionService(dbus.service.Object):
    """Session DBus service exposed by Pequén USB to GNOME Shell extension."""

    BUS_NAME = "org.pequen.USBGuard"
    OBJECT_PATH = "/org/pequen/USBGuard"

    def __init__(self, daemon: "PequénDaemon"):
        self.daemon = daemon
        bus_name = dbus.service.BusName(self.BUS_NAME, bus=dbus.SessionBus())
        super().__init__(bus_name, self.OBJECT_PATH)

    @dbus.service.method("org.pequen.USBGuard", in_signature="", out_signature="s")
    def GetDevices(self) -> str:
        """Returns JSON list of active devices with rule status and permanence."""
        perm_map = self.daemon.history.get_permanence_map()
        devices = self.daemon.client.get_all_devices(permanent_map=perm_map)
        return json.dumps([d.to_dict() for d in devices])

    @dbus.service.method("org.pequen.USBGuard", in_signature="i", out_signature="s")
    def GetHistory(self, limit: int) -> str:
        """Returns JSON list of connection history."""
        records = self.daemon.history.get_recent_history(limit=limit or 50)
        return json.dumps(records)

    @dbus.service.method("org.pequen.USBGuard", in_signature="isb", out_signature="b")
    def ApplyPolicy(self, device_id: int, action: str, permanent: bool) -> bool:
        """Applies policy (allow/block/reject) to a device."""
        try:
            self.daemon.client.apply_policy(device_id, action, permanent)
            # Find device info for logging
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
            self.DevicePolicyChanged(device_id, action, permanent)
            return True
        except Exception as err:
            print(f"Error applying policy: {err}")
            return False

    @dbus.service.signal("org.pequen.USBGuard", signature="iss")
    def DeviceInserted(self, device_id: int, name: str, details_json: str) -> None:
        """Signal emitted when a new device is connected."""
        pass

    @dbus.service.signal("org.pequen.USBGuard", signature="isb")
    def DevicePolicyChanged(self, device_id: int, action: str, permanent: bool) -> None:
        """Signal emitted when a device policy is changed."""
        pass


class PequénDaemon:
    """Main Pequén USB Daemon listener."""

    def __init__(self):
        DBusGMainLoop(set_as_default=True)
        self.history = HistoryManager()
        self.client = USBGuardDBusClient()
        self.service = PequénSessionService(self)
        self._setup_signals()

    def _setup_signals(self) -> None:
        self.client.devices_iface.connect_to_signal(
            "DevicePresenceChanged", self._on_device_presence_changed
        )

    def _on_device_presence_changed(
        self, dev_id: int, event: int, target: int, device_rule: str, attributes: dict
    ) -> None:
        parsed = USBGuardRuleParser.parse(str(device_rule))
        perm_map = self.history.get_permanence_map()
        device = USBDevice(int(dev_id), parsed, is_permanent=perm_map.get(int(dev_id), False))

        print(t("device_event", id=dev_id, rule=device.rule, name=device.name))

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
        print(t("daemon_listening"))
        loop = GLib.MainLoop()
        loop.run()


def main():
    daemon = PequénDaemon()
    daemon.run()


if __name__ == "__main__":
    main()
