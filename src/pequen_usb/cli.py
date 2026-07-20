import sys
from pequen_usb.dbus_client import USBGuardDBusClient
from pequen_usb.history import HistoryManager


def print_help():
    print("""
Pequén USB - Chilean Owl USBGuard Sentinel CLI

Usage:
  pequen-usb devices          List connected USB devices and their current status
  pequen-usb history          Show recent connection history
  pequen-usb allow <id> [--temp] Allow a USB device by ID
  pequen-usb block <id>       Block a USB device by ID
  pequen-usb clear-history    Clear SQLite connection history
""")


def main():
    if len(sys.argv) < 2:
        print_help()
        return

    cmd = sys.argv[1]
    match cmd:
        case "devices":
            client = USBGuardDBusClient()
            devices = client.get_all_devices()
            print(f"\n--- Connected USB Devices ({len(devices)}) ---")
            for dev in devices:
                status = "ALLOWED" if dev.is_allowed else "BLOCKED"
                print(f"[{dev.number}] {status} - ID: {dev.id} - {dev.name} ({dev.via_port})")
            print()
        case "history":
            history = HistoryManager()
            records = history.get_recent_history(limit=25)
            print(f"\n--- Connection History ({len(records)} entries) ---")
            for r in records:
                perm = " (Permanent)" if r["permanent"] else ""
                print(f"[{r['timestamp']}] ID:{r['device_id']} - {r['name']} -> {r['action_taken'].upper()}{perm}")
            print()
        case "allow":
            if len(sys.argv) < 3:
                print("Error: Specify device ID to allow")
                return
            dev_id = int(sys.argv[2])
            temp = "--temp" in sys.argv
            client = USBGuardDBusClient()
            client.apply_policy(dev_id, "allow", permanent=not temp)
            print(f"Device {dev_id} ALLOWED ({'Temporary' if temp else 'Permanent'})")
        case "block":
            if len(sys.argv) < 3:
                print("Error: Specify device ID to block")
                return
            dev_id = int(sys.argv[2])
            client = USBGuardDBusClient()
            client.apply_policy(dev_id, "block", permanent=False)
            print(f"Device {dev_id} BLOCKED")
        case "clear-history":
            history = HistoryManager()
            history.clear_history()
            print("History cleared.")
        case _:
            print_help()


if __name__ == "__main__":
    main()
