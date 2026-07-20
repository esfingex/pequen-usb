# Pequén USB - Project State & Architecture Decision Records (ADRs)

## Current Status
- Active Phase: Waves 1.0 - 6.0 Complete
- Blockers: None
- Next Step: Ready for production deployment and user testing.

## Architecture Decision Records (ADRs)
- ADR-001: Separation of concerns between GNOME Shell ESM Extension (GJS UI) and Pequén Python 3 Daemon (DBus / SQLite History).
- ADR-002: Zero-dependency Python 3 implementation using pathlib, sqlite3, shlex, and dbus-python.
- ADR-003: SQLite history database stored under ~/.config/pequen-usb/history.db for device event history.
- ADR-004: Differentiation between Alicanto GSD specification framework (`.planning/` files) and runtime SQLite 3 connection history database (`history.db`).
- ADR-005: System package manager auto-detection (`pacman`, `apt`, `dnf`, `zypper`) in `install.sh` for `usbguard` system dependency.
