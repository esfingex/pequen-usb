# PROJECT CONTEXT PRIMER — PEQUÉN USB

## Identity
- **Project**: Pequén USB
- **Domain**: Linux Desktop Security / USBGuard Sentinel for GNOME Shell & CLI
- **Entry Points**: `src/pequen_usb/daemon.py`, `src/pequen_usb/cli.py`, `gnome-extension/extension.js`

## Architecture Map (Mental Model)
- `src/pequen_usb/` → Demonio de Sesión de Usuario (Session Bus `org.pequen.USBGuard`) en Python 3, persistencia SQLite WAL, cliente USBGuard (System Bus con autorización Polkit) y CLI.
- `gnome-extension/` → Extensión nativa de GNOME Shell 45-50+ en JavaScript GJS ESM.
- `tests/` → Pruebas unitarias de integración del demonio y base de datos.

## Conventions & Gotchas (Tribal Knowledge)
- **Architecture Model**: `pequen-usb-daemon` es un **User Session Daemon** (`systemd --user`). NUNCA corre como `root`. La elevación de privilegios sobre USBGuard se delega a **PolicyKit (Polkit)** mediante `ALLOW_INTERACTIVE_AUTHORIZATION`.
- **SQLite WAL Mode**: La base de datos `~/.config/pequen-usb/history.db` usa `PRAGMA journal_mode=WAL` y `busy_timeout=5000` para garantizar concurrencia fluida sin bloqueos.
- **GNOME Shell Compliance**: La extensión debe ser válida según la herramienta `shexli` sin advertencias.

## Current Task
> **Goal**: Mantener documentación actualizada e ingesta de contexto para asistentes IA.
