import shlex
import dbus
from dbus.mainloop.glib import DBusGMainLoop


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

    def __init__(self, number: int, rule_dict: dict[str, str | list[str]]):
        self.number = number
        self.rule = str(rule_dict.get("rule", "block"))
        self.id = str(rule_dict.get("id", ""))
        self.serial = str(rule_dict.get("serial", ""))
        self.name = str(rule_dict.get("name", "Unknown Device"))
        self.hash = str(rule_dict.get("hash", ""))
        self.parent_hash = str(rule_dict.get("parent_hash", ""))
        self.via_port = str(rule_dict.get("via_port", ""))
        self.with_interface = rule_dict.get("with_interface", [])
        if isinstance(self.with_interface, str):
            self.with_interface = [self.with_interface]

    @property
    def is_allowed(self) -> bool:
        return self.rule.lower() == "allow"

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
            "id": self.id,
            "name": self.name,
            "serial": self.serial,
            "hash": self.hash,
            "via_port": self.via_port,
            "with_interface": self.with_interface,
            "is_allowed": self.is_allowed,
        }


class USBGuardDBusClient:
    """DBus client wrapper for USBGuard daemon."""

    def __init__(self):
        DBusGMainLoop(set_as_default=True)
        self.bus = dbus.SystemBus()
        self._connect_dbus()

    def _connect_dbus(self) -> None:
        try:
            dev_obj = self.bus.get_object("org.usbguard", "/org/usbguard/Devices")
            pol_obj = self.bus.get_object("org.usbguard", "/org/usbguard/Policy")
            self.devices_iface = dbus.Interface(dev_obj, "org.usbguard.Devices")
            self.policy_iface = dbus.Interface(pol_obj, "org.usbguard.Policy")
        except Exception:
            dev_obj = self.bus.get_object("org.usbguard1", "/org/usbguard1/Devices")
            pol_obj = self.bus.get_object("org.usbguard1", "/org/usbguard1/Policy")
            self.devices_iface = dbus.Interface(dev_obj, "org.usbguard.Devices1")
            self.policy_iface = dbus.Interface(pol_obj, "org.usbguard.Policy1")

    def get_all_devices(self) -> list[USBDevice]:
        raw_devices = self.devices_iface.listDevices("match")
        devices = []
        for dev_struct in raw_devices:
            dev_id = int(dev_struct[0])
            rule_str = str(dev_struct[1])
            parsed = USBGuardRuleParser.parse(rule_str)
            devices.append(USBDevice(dev_id, parsed))
        return devices

    def apply_policy(self, device_id: int, target: str, permanent: bool = False) -> int:
        # Target: 0 = ALLOW, 1 = BLOCK, 2 = REJECT
        rule_num = 0 if target.lower() == "allow" else (1 if target.lower() == "block" else 2)
        return int(self.devices_iface.applyDevicePolicy(device_id, rule_num, permanent))
