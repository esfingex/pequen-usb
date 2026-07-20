import shlex
from pathlib import Path
import dbus
from dbus.mainloop.glib import DBusGMainLoop
import gi
gi.require_version("Gio", "2.0")
from gi.repository import Gio, GLib


class USBGuardRuleParser:
    """Zero-dependency parser for USBGuard rule strings using shlex."""

    @staticmethod
    def parse(rule_string: str) -> dict[str, str | list[str]]:
        tokens = shlex.split(rule_string)
        if not tokens:
            return {}

        result: dict[str, str | list[str]] = {"rule": tokens[0]}
        i = 1
        while i < len(tokens):
            key = tokens[i]
            match key:
                case "with-interface":
                    if i + 1 < len(tokens) and tokens[i + 1] == "{":
                        ifaces = []
                        i += 2
                        while i < len(tokens) and tokens[i] != "}":
                            ifaces.append(tokens[i])
                            i += 1
                        result["with_interface"] = ifaces
                    elif i + 1 < len(tokens):
                        result["with_interface"] = [tokens[i + 1]]
                        i += 1
                case _:
                    if i + 1 < len(tokens):
                        result[key.replace("-", "_")] = tokens[i + 1]
                        i += 1
            i += 1
        return result


class USBDevice:
    """Represents a USB device connected via USBGuard DBus."""

    def __init__(
        self,
        number: int,
        rule_dict: dict[str, str | list[str]],
        is_permanent: bool = False,
        is_pinned: bool = False,
    ):
        self.number = number
        self.rule = str(rule_dict.get("rule", "block"))
        self.id = str(rule_dict.get("id", ""))
        self.serial = str(rule_dict.get("serial", ""))
        self.name = str(rule_dict.get("name", "Unknown Device"))
        self.hash = str(rule_dict.get("hash", ""))
        self.parent_hash = str(rule_dict.get("parent_hash", ""))
        self.via_port = str(rule_dict.get("via_port", ""))
        self.is_permanent = is_permanent
        self.is_pinned = is_pinned
        self.with_interface = rule_dict.get("with_interface", [])
        if isinstance(self.with_interface, str):
            self.with_interface = [self.with_interface]

        self.category = self._detect_category()

    def _detect_category(self) -> str:
        """Classifies device into 'storage', 'system', or 'peripheral' based on interfaces & sysfs."""
        ifaces = [str(iface) for iface in self.with_interface]
        name_lower = self.name.lower()

        # Check for mass storage interfaces (class 08) or name
        is_mass_storage = any(iface.startswith("08:") or iface == "08" for iface in ifaces) or any(
            kw in name_lower for kw in ["flash", "drive", "disk", "storage", "mass storage", "kingston", "sandisk"]
        )
        if is_mass_storage:
            return "storage"

        # Check for system hubs (class 09), webcams (0e), bluetooth (e0) or root hubs
        is_system_dev = (
            any(iface.startswith("09:") or iface.startswith("0e:") or iface.startswith("e0:") for iface in ifaces)
            or "root hub" in name_lower
            or "linux foundation" in name_lower
            or "bluetooth" in name_lower
            or "camera" in name_lower
            or "webcam" in name_lower
        )
        if is_system_dev:
            return "system"

        # Check sysfs removable attribute if via_port matches
        if self.via_port:
            port_name = self.via_port.strip('"')
            sysfs_removable = Path(f"/sys/bus/usb/devices/{port_name}/removable")
            if sysfs_removable.exists():
                try:
                    val = sysfs_removable.read_text().strip()
                    if val == "fixed":
                        return "system"
                    elif val == "removable":
                        return "storage" if is_mass_storage else "peripheral"
                except Exception:
                    pass

        return "peripheral"

    @property
    def is_allowed(self) -> bool:
        return self.rule.lower() == "allow"

    @property
    def rule_type(self) -> str:
        if self.is_allowed:
            return "permanent" if self.is_permanent else "temporary"
        return "blocked"

    @property
    def vendor_id(self) -> str:
        return self.id.split(":")[0] if ":" in self.id else ""

    @property
    def product_id(self) -> str:
        return self.id.split(":")[1] if ":" in self.id else ""

    def to_dict(self) -> dict[str, str | int | bool | list[str]]:
        return {
            "number": self.number,
            "rule": self.rule,
            "rule_type": self.rule_type,
            "is_permanent": self.is_permanent,
            "is_pinned": self.is_pinned,
            "category": self.category,
            "id": self.id,
            "name": self.name,
            "serial": self.serial,
            "hash": self.hash,
            "via_port": self.via_port,
            "with_interface": self.with_interface,
            "is_allowed": self.is_allowed,
        }


class USBGuardDBusClient:
    """DBus client wrapper for USBGuard daemon with interactive PolicyKit authentication."""

    def __init__(self):
        DBusGMainLoop(set_as_default=True)
        self.bus = dbus.SystemBus()
        self.gio_bus = Gio.bus_get_sync(Gio.BusType.SYSTEM, None)
        self._connect_dbus()

    def _connect_dbus(self) -> None:
        try:
            dev_obj = self.bus.get_object("org.usbguard", "/org/usbguard/Devices")
            pol_obj = self.bus.get_object("org.usbguard", "/org/usbguard/Policy")
            self.devices_iface = dbus.Interface(dev_obj, "org.usbguard.Devices")
            self.policy_iface = dbus.Interface(pol_obj, "org.usbguard.Policy")
            self.service_name = "org.usbguard"
            self.devices_path = "/org/usbguard/Devices"
            self.devices_interface = "org.usbguard.Devices"
            self.policy_path = "/org/usbguard/Policy"
            self.policy_interface = "org.usbguard.Policy"
        except Exception:
            dev_obj = self.bus.get_object("org.usbguard1", "/org/usbguard1/Devices")
            pol_obj = self.bus.get_object("org.usbguard1", "/org/usbguard1/Policy")
            self.devices_iface = dbus.Interface(dev_obj, "org.usbguard.Devices1")
            self.policy_iface = dbus.Interface(pol_obj, "org.usbguard.Policy1")
            self.service_name = "org.usbguard1"
            self.devices_path = "/org/usbguard1/Devices"
            self.devices_interface = "org.usbguard.Devices1"
            self.policy_path = "/org/usbguard1/Policy"
            self.policy_interface = "org.usbguard.Policy1"

    def get_all_devices(
        self,
        permanent_map: dict[int, bool] | None = None,
        pinned_set: set[str] | None = None,
    ) -> list[USBDevice]:
        raw_devices = self.devices_iface.listDevices("match")
        devices = []
        perm_map = permanent_map or {}
        p_set = pinned_set or set()
        for dev_struct in raw_devices:
            dev_id = int(dev_struct[0])
            rule_str = str(dev_struct[1])
            parsed = USBGuardRuleParser.parse(rule_str)
            is_perm = perm_map.get(dev_id, False)
            is_pinned = str(dev_id) in p_set or str(parsed.get("id", "")) in p_set
            devices.append(USBDevice(dev_id, parsed, is_permanent=is_perm, is_pinned=is_pinned))
        return devices

    def apply_policy(self, device_id: int, target: str, permanent: bool = False) -> int:
        """Applies policy (allow/block/reject) via PolicyKit interactive password prompt if required."""
        rule_num = 0 if target.lower() == "allow" else (1 if target.lower() == "block" else 2)

        # Execute applyDevicePolicy with ALLOW_INTERACTIVE_AUTHORIZATION (triggers GNOME PolKit password dialog)
        res = self.gio_bus.call_sync(
            self.service_name,
            self.devices_path,
            self.devices_interface,
            "applyDevicePolicy",
            GLib.Variant("(uub)", (device_id, rule_num, permanent)),
            GLib.VariantType("(u)"),
            Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
            -1,
            None,
        )
        rule_id = res.unpack()[0]

        if permanent and target.lower() == "allow":
            try:
                devices = self.get_all_devices()
                target_dev = next((d for d in devices if d.number == device_id), None)
                if target_dev:
                    rule_str = f'allow id {target_dev.id} serial "{target_dev.serial}" name "{target_dev.name}" hash "{target_dev.hash}"'
                    self.gio_bus.call_sync(
                        self.service_name,
                        self.policy_path,
                        self.policy_interface,
                        "appendRule",
                        GLib.Variant("(sub)", (rule_str, 0, True)),
                        GLib.VariantType("(u)"),
                        Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
                        -1,
                        None,
                    )
            except Exception as append_err:
                print(f"[Pequén] Notice: appendRule interactive attempt: {append_err}")

        return rule_id


