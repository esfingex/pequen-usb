# Pequén USB - Project Roadmap

## Roadmap Overview

### Phase 1.0: Core Architecture & Baseline Implementation (Waves 1 - 4)
- Goal: Establish Pequén USB repository, Python backend, GNOME Shell extension, i18n, and interactive UI.
- Checklist:
  - [x] Create directory layout and `.planning` specification files
  - [x] Implement Python 3 DBus client (`dbus_client.py`)
  - [x] Implement SQLite history manager (`history.py`)
  - [x] Implement Python 3 daemon service (`daemon.py`)
  - [x] Implement GNOME Shell ESM extension (`extension.js` & `metadata.json`)
  - [x] Implement i18n support in Python (`i18n.py`) and GJS (`i18n.js`)
  - [x] Implement interactive history menu & status badges (🟢/🟡/🔴)
  - [x] Automated unit test suite (`tests/test_pequen.py`)

### Phase 1.1: System Integration & Package Management (Waves 5 - 6)
- Goal: Ensure system-level dependency installation, systemd service management, and persistent Wave tracking.
- Checklist:
  - [x] Auto-install `usbguard` via system package manager (`pacman`, `apt`, `dnf`, `zypper`)
  - [x] Enable and start `usbguard.service` systemd daemon automatically
  - [x] Maintain textual Wave version logs in `.planning/WAVES.md`
