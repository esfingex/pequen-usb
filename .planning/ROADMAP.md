# Pequén USB - Project Roadmap

## Roadmap Overview

### Phase 1.0: Development Environment & Architecture
- Goal: Establish Pequén USB repository, Alicanto planning tools, Python 3 backend, and GNOME Shell ESM extension layout.
- Checklist:
  - [x] Create directory layout and .planning specification files
  - [x] Implement Python 3 DBus client (dbus_client.py)
  - [x] Implement SQLite history manager (history.py)
  - [x] Implement Python 3 daemon service (daemon.py)
  - [x] Implement GNOME Shell ESM extension (extension.js & metadata.json)
  - [x] Create SVG icon for Pequén USB
  - [x] Create automated installer script (install.sh)

### Phase 1.1: Functional Testing & Verification
- Goal: Test local extension installation, DBus communication, and top bar notification popups.
- Checklist:
  - [ ] Run automated syntax compilation check
  - [ ] Test GNOME Shell extension installation via gnome-extensions pack
  - [ ] Verify USB insertion detection and notification actions
