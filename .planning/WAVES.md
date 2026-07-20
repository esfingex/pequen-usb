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
| **Wave 7** | Categorization Engine | `src/pequen_usb/` | ✅ Complete | Sysfs inspector for `storage`, `system`, and `peripheral` categorization & `config.py` JSON manager. |
| **Wave 8** | GTK4 Preferences UI | `gnome-extension/prefs.js` | ✅ Complete | Libadwaita preferences window with Extraíbles, Sistema, and Accesos Rápidos tabbed pages. |
| **Wave 9** | Sober Top Bar Menu | `gnome-extension/extension.js` | ✅ Complete | Clean top bar popup for storage & pinned devices + **⚙️ Más Ajustes...** button. |

---

## 📋 Wave Details & History

### 🌊 Wave 7: Device Categorization & Config Persistence Engine
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `src/pequen_usb/config.py` [NEW]: Persistent configuration manager (`~/.config/pequen-usb/config.json`).
  - `src/pequen_usb/dbus_client.py` [MODIFY]: Sysfs inspector parsing `/sys/bus/usb/devices/` to classify devices into `storage`, `system`, or `peripheral`.
  - `src/pequen_usb/daemon.py` [MODIFY]: Added DBus methods `GetConfig()`, `TogglePin()`, and `ConfigChanged` signal.

### 🌊 Wave 8: GTK4 Preferences Window (`prefs.js`)
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `gnome-extension/prefs.js` [NEW]: Libadwaita / GTK4 preference window with tabbed pages for Removable Storage, System Devices, and Quick Access Pinning.
  - `gnome-extension/schemas/` [NEW]: Added compiled GSettings schema for extension settings.

### 🌊 Wave 9: Sober Panel Menu & Quick Access Pinning
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `gnome-extension/extension.js` [MODIFY]: Filtered top bar menu to display only pendrives/storage devices or pinned items for a clean, sober view. Added **⚙️ Más Ajustes...** launcher.
  - `install.sh` [MODIFY]: Added gschema compilation and installation.
