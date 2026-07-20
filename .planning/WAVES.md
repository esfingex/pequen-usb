# Pequén USB - Wave Version Control & Release Logs

This document maintains the persistent version history and specification logs for all development waves created in Pequén USB.

---

## 🌊 Wave Summary Matrix

| Wave | Component | Target | Status | Description |
|---|---|---|---|---|
| **Wave 1** | Core Backend | `src/pequen_usb/` | ✅ Complete | Multi-language engine (`i18n.py`), rule permanence detection, enriched DBus payloads. |
| **Wave 2** | CLI Interface | `src/pequen_usb/cli.py` | ✅ Complete | Localized CLI output, `--lang` flag, formatted device/history tables. |
| **Wave 3** | GNOME Extension UI | `gnome-extension/` | ✅ Complete | `i18n.js`, active rule status badges (🟢/🟡/🔴), interactive history submenus. |
| **Wave 4** | Build & Verification | `install.sh`, `tests/` | ✅ Complete | Unit tests suite (`test_pequen.py`), local wheel installation. |
| **Wave 5** | Installer & Systemd | `install.sh` | ✅ Complete | `pacman`/`apt`/`dnf` package installation check & `usbguard.service` systemd enablement. |
| **Wave 6** | Planning & Docs | `.planning/` | ✅ Complete | Text version control log (`WAVES.md`), ADR-004 architecture sync. |

---

## 📋 Wave Details & History

### 🌊 Wave 1: Core i18n Engine & Extended DBus Data Model
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `src/pequen_usb/i18n.py` [NEW]: System locale auto-detection and translation dictionaries (Spanish/English).
  - `src/pequen_usb/dbus_client.py` [MODIFY]: Added `is_permanent` property and `rule_type` ("permanent", "temporary", "blocked").
  - `src/pequen_usb/history.py` [MODIFY]: Added `get_permanence_map()` to query latest rule permanence from DB.
  - `src/pequen_usb/daemon.py` [MODIFY]: Exposed `rule_type` in DBus `GetDevices()` and localized logger.

### 🌊 Wave 2: CLI Multi-language & Enhanced History Views
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `src/pequen_usb/cli.py` [MODIFY]: Added `--lang es|en` override, localized status output: `🟢 PERMITIDO (Permanente)`, `🟡 PERMITIDO (Temporal)`, `🔴 BLOQUEADO`.

### 🌊 Wave 3: GNOME Extension i18n & Interactive History UI
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `gnome-extension/i18n.js` [NEW]: GJS ES-Module locale detector and dictionary resolver.
  - `gnome-extension/extension.js` [MODIFY]:
    - Added status badges to connected USB devices menu.
    - Replaced transient popup notification with interactive `PopupSubMenuMenuItem` history menu allowing direct policy changes.

### 🌊 Wave 4: Installer Update & System Integration Verification
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `install.sh` [MODIFY]: Package `i18n.js` into GNOME extension folder.
  - `tests/test_pequen.py` [NEW]: Automated test suite covering parser, i18n, DBus model, and HistoryManager.

### 🌊 Wave 5: System Dependency Installation & Service Activation
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `install.sh` [MODIFY]: Auto-detect `pacman` (Arch/CachyOS), `apt`, `dnf`, `zypper` to install `usbguard` if missing. Auto-enable `usbguard.service` via systemd.

### 🌊 Wave 6: Persistent Wave Versioning & Architecture Sync
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `.planning/WAVES.md` [NEW]: Text file tracking all development waves and releases.
  - `.planning/STATE.md` [MODIFY]: Recorded ADR-004 (Alicanto GSD planning framework vs SQLite 3 history DB).
  - `.planning/ROADMAP.md` [MODIFY]: Updated roadmap tasks to reflect Waves 1-6 completion.
