# Pequén USB - Verification Checklist

## Functional Criteria
- [x] Python backend compiles cleanly with `compileall`
- [x] SQLite history database initializes properly in `~/.config/pequen-usb/history.db`
- [x] Daemon connects to USBGuard DBus interface (`org.usbguard` / `org.usbguard1`)
- [x] GNOME Shell extension package (`pequen-usb@esfingex.github.io.shell-extension.zip`) builds with `gnome-extensions pack`
- [x] Top bar panel indicator renders cleanly on GNOME Shell 50+
- [x] Device insertion notification options (Allow Permanent, Allow Temp, Block) function properly
- [x] CLI utility `pequen-usb devices` lists connected USB devices accurately (verified 9 devices)

