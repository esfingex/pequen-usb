import sys
from pequen_usb.dbus_client import USBGuardDBusClient
from pequen_usb.history import HistoryManager
from pequen_usb.i18n import t, set_language


def print_help():
    print(f"""
{t('cli_help_title')}

{t('cli_usage')}
  pequen-usb {t('cmd_devices')}
  pequen-usb {t('cmd_history')}
  pequen-usb {t('cmd_allow')}
  pequen-usb {t('cmd_block')}
  pequen-usb {t('cmd_clear_history')}

Flags:
  --lang es|en    Force language selection (Seleccionar idioma)
""")


def main():
    args = sys.argv[1:]

    # Parse --lang flag if present
    if "--lang" in args:
        idx = args.index("--lang")
        if idx + 1 < len(args):
            set_language(args[idx + 1])
            del args[idx : idx + 2]

    if not args:
        print_help()
        return

    cmd = args[0]
    match cmd:
        case "devices":
            history = HistoryManager()
            perm_map = history.get_permanence_map()
            client = USBGuardDBusClient()
            devices = client.get_all_devices(permanent_map=perm_map)

            print(f"\n{t('hdr_devices', count=len(devices))}")
            for dev in devices:
                if dev.is_allowed:
                    status = t("status_allowed_perm") if dev.is_permanent else t("status_allowed_temp")
                    badge = "🟢" if dev.is_permanent else "🟡"
                else:
                    status = t("status_blocked")
                    badge = "🔴"

                print(f"{badge} [{dev.number}] {status:<24} | ID: {dev.id:<10} | {dev.name} ({dev.via_port})")
            print()

        case "history":
            history = HistoryManager()
            records = history.get_recent_history(limit=25)
            print(f"\n{t('hdr_history', count=len(records))}")
            for r in records:
                perm_str = f" ({t('status_allowed_perm')})" if r["permanent"] else f" ({t('status_allowed_temp')})" if r["action_taken"] == "allow" else ""
                print(f"[{r['timestamp'][:19]}] ID:{r['device_id']:<3} | {r['name']} -> {r['action_taken'].upper()}{perm_str}")
            print()

        case "allow":
            if len(args) < 2:
                print(t("err_specify_allow_id"))
                return
            try:
                dev_id = int(args[1])
            except ValueError:
                print(t("err_specify_allow_id"))
                return

            temp = "--temp" in args
            client = USBGuardDBusClient()
            client.apply_policy(dev_id, "allow", permanent=not temp)
            msg_key = "msg_allowed_temp" if temp else "msg_allowed_perm"
            print(t(msg_key, id=dev_id))

        case "block":
            if len(args) < 2:
                print(t("err_specify_block_id"))
                return
            try:
                dev_id = int(args[1])
            except ValueError:
                print(t("err_specify_block_id"))
                return

            client = USBGuardDBusClient()
            client.apply_policy(dev_id, "block", permanent=False)
            print(t("msg_blocked", id=dev_id))

        case "clear-history":
            history = HistoryManager()
            history.clear_history()
            print(t("msg_history_cleared"))

        case _:
            print_help()


if __name__ == "__main__":
    main()
