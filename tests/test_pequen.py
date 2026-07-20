import unittest
from pathlib import Path
import tempfile

from pequen_usb.i18n import t, set_language
from pequen_usb.dbus_client import USBGuardRuleParser, USBDevice
from pequen_usb.history import HistoryManager


class TestPequenUSB(unittest.TestCase):

    def test_rule_parser(self):
        rule_str = 'allow id 046d:c52b serial "123456" name "Logitech Receiver" with-interface { 03:01:01 03:01:02 }'
        parsed = USBGuardRuleParser.parse(rule_str)
        self.assertEqual(parsed["rule"], "allow")
        self.assertEqual(parsed["id"], "046d:c52b")
        self.assertEqual(parsed["name"], "Logitech Receiver")
        self.assertEqual(parsed["with_interface"], ["03:01:01", "03:01:02"])

    def test_usb_device_model(self):
        rule_dict = {"rule": "allow", "id": "046d:c52b", "name": "USB Mouse"}
        dev_perm = USBDevice(1, rule_dict, is_permanent=True)
        self.assertTrue(dev_perm.is_allowed)
        self.assertTrue(dev_perm.is_permanent)
        self.assertEqual(dev_perm.rule_type, "permanent")

        dev_temp = USBDevice(2, rule_dict, is_permanent=False)
        self.assertTrue(dev_temp.is_allowed)
        self.assertFalse(dev_temp.is_permanent)
        self.assertEqual(dev_temp.rule_type, "temporary")

    def test_i18n_translations(self):
        set_language("es")
        self.assertEqual(t("status_blocked"), "BLOQUEADO")

        set_language("en")
        self.assertEqual(t("status_blocked"), "BLOCKED")
        self.assertEqual(t("status_allowed_perm"), "ALLOWED (Permanent)")

        # Format substitution
        self.assertEqual(t("hdr_devices", count=5), "--- Connected USB Devices (5) ---")

    def test_history_manager(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_history.db"
            history = HistoryManager(db_path=db_path)

            history.log_event(
                device_id="10",
                name="Flash Drive",
                action_taken="allow",
                permanent=True
            )

            records = history.get_recent_history(limit=5)
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0]["name"], "Flash Drive")
            self.assertEqual(records[0]["permanent"], 1)

            perm_map = history.get_permanence_map()
            self.assertEqual(perm_map.get(10), True)


if __name__ == "__main__":
    unittest.main()
