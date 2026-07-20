# Pequén USB - Project State & Architecture Decision Records (ADRs)

## Current Status
- Active Phase: Phase 1.0 (Initial Development & Implementation)
- Blockers: None
- Next Step: Build Python 3 backend modules and GNOME Shell 50+ extension files.

## Architecture Decision Records (ADRs)
- ADR-001: Separation of concerns between GNOME Shell ESM Extension (GJS UI) and Pequén Python 3 Daemon (DBus / SQLite History).
- ADR-002: Zero-dependency Python 3 implementation using pathlib, sqlite3, shlex, and dbus-python.
- ADR-003: SQLite history database stored under ~/.config/pequen-usb/history.db.
