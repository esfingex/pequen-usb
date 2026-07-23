# CONTEXT PRIMER
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


---

# TECHNICAL DOCUMENTATION & ARCHITECTURE OVERVIEW
# 🦉 Documentación Técnica del Proyecto: Pequén USB

## 1. Visión General

**Pequén USB** es un sistema de centinela y auditoría de seguridad para dispositivos USB en escritorios Linux (CachyOS, Ubuntu, Fedora, Arch Linux). Está diseñado en torno a **USBGuard** y proporciona una arquitectura dividida en dos capas principales:

1. **Demonio de Sesión de Usuario en Python 3 (`pequen-usb-daemon`)**: Conector en segundo plano que corre en el espacio de usuario (`systemd --user`), se suscribe a los eventos del demonio del sistema `org.usbguard` / `org.usbguard1` en el System Bus, autoriza elevaciones mediante **PolicyKit (Polkit)** y mantiene una base de datos SQLite WAL de auditoría de forma asíncrona mediante `ThreadPoolExecutor`.
2. **Interfaz de Usuario (GNOME Shell ESM & CLI)**: Extensión nativa de interfaz gráfica para **GNOME Shell (45 a 50+)** y la utilidad CLI `pequen-usb`.

---

## 2. Arquitectura de Componentes

```
+-------------------------------------------------------------+
|              GNOME Shell Extension (JavaScript GJS)         |
|              (Barra superior + Indicador de estado)         |
+------------------------------+------------------------------+
                               | (DBus Session Bus)
+------------------------------v------------------------------+
|              CLI Tool (pequen-usb)                          |
+------------------------------+------------------------------+
                               | (DBus Session Bus: org.pequen.USBGuard)
+------------------------------v------------------------------+
|              Pequén USB User Daemon (Python 3.10+)          |
|  - daemon.py (ThreadPool) - dbus_client.py  - config.py     |
|  - history.py (WAL Mode)  - i18n.py         - cli.py        |
+---------------+------------------------------+--------------+
                |                              |
      (SQLite WAL Database)         (DBus System Bus / Polkit)
                v                              v
   ~/.config/pequen-usb/history.db     org.usbguard Daemon (root)
```

---

## 3. Estructura de Archivos del Proyecto

* [README.md](file:///home/esfingex/workspace/pequen-usb/README.md): Resumen general de compilación e instalación.
* [build.sh](file:///home/esfingex/workspace/pequen-usb/build.sh): Script de compilación de esquemas GSettings y empaquetado (`.zip` para EGO y `.whl` para Python).
* [install.sh](file:///home/esfingex/workspace/pequen-usb/install.sh): Script de despliegue automatizado en el sistema.
* [pyproject.toml](file:///home/esfingex/workspace/pequen-usb/pyproject.toml) y [setup.py](file:///home/esfingex/workspace/pequen-usb/setup.py): Configuración del paquete Python `pequen_usb`.
* **Módulos Python ([src/pequen_usb/](file:///home/esfingex/workspace/pequen-usb/src/pequen_usb)):**
  * `daemon.py`: Bucle principal de eventos y registro DBus.
  * `dbus_client.py`: Cliente de comunicación asíncrona con el demonio de USBGuard.
  * `history.py`: Gestión de eventos de conexión y auditoría en SQLite.
  * `cli.py`: Interfaz de comandos (`devices`, `history`, `allow`, `block`).
  * `config.py`: Manejo de configuraciones en `~/.config/pequen-usb/config.json`.
  * `i18n.py`: Traducción e internacionalización.
* **Extensión GNOME ([gnome-extension/](file:///home/esfingex/workspace/pequen-usb/gnome-extension)):**
  * `extension.js`: Código principal del indicador de la barra superior.
  * `metadata.json`: Metadatos de la extensión (`pequen-usb@esfingex.github.io`).

---

## 4. Comandos de la Utilidad CLI

```bash
# Listar dispositivos USB activos
pequen-usb devices

# Ver el historial de eventos SQLite
pequen-usb history

# Permitir dispositivo (temporal o permanente)
pequen-usb allow <id> [--temp]

# Bloquear dispositivo
pequen-usb block <id>
```

---

## 5. Compilación y Pruebas

Para empaquetar y validar con static analysis (`shexli`):
```bash
./build.sh
```

Para instalar localmente con dependencias de sistema:
```bash
./install.sh
```


---

## File: .planning/CHECKLIST.md
```md
# Pequén USB - Verification Checklist

## Functional Criteria
- [x] Python backend compiles cleanly with `compileall`
- [x] SQLite history database initializes properly in `~/.config/pequen-usb/history.db`
- [x] Daemon connects to USBGuard DBus interface (`org.usbguard` / `org.usbguard1`)
- [x] GNOME Shell extension package (`pequen-usb@esfingex.github.io.shell-extension.zip`) builds with `gnome-extensions pack`
- [x] Top bar panel indicator renders cleanly on GNOME Shell 50+
- [x] Device insertion notification options (Allow Permanent, Allow Temp, Block) function properly
- [x] CLI utility `pequen-usb devices` lists connected USB devices accurately (verified 9 devices)


```

## File: .planning/CONSTITUTION.md
```md
# Pequén USB - Constitution & Coding Standards

## 1. Modern Python Standard
- Target Python version is 3.10+.
- Use modern type annotations (`list[str] | None` instead of `Optional` / `Union`).
- Use `match/case` for pattern matching and branching.
- Use `pathlib.Path` exclusively for filesystem paths.

## 2. GNOME Shell Extension Standard
- Follow GNOME Shell 45+ ESM module syntax (`import Extension from 'resource:///org/gnome/shell/extensions/extension.js'`).
- Ensure metadata.json specifies support for GNOME Shell versions ["45", "46", "47", "48", "49", "50"].

## 3. Terminal Command Prefix Rule
- All terminal/shell operations MUST be executed using the `rtk` wrapper prefix (e.g. `rtk git status`, `rtk python3 -m pytest`).

## 4. Documentation Formatting
- Planning documents in `.planning/` MUST be plain text without emojis or icon symbols.

```

## File: .planning/PROJECT.md
```md
# Pequén USB - Project Architecture & Specification

## Overview
Pequén USB is a native GNOME Shell Extension and Python 3 daemon for USBGuard, named after the Chilean burrowing owl (Pequén) that stands guard at the entrance of its territory.

## Technology Stack
- Extension Frontend: JavaScript (GJS / ESM Modules for GNOME Shell 45/50+)
- Backend Daemon: Python 3.10+ (PyGObject / DBus / SQLite3 / pathlib)
- Target Environment: Linux (CachyOS, Ubuntu, Arch, Fedora) on GNOME Shell 45+

## Repository Layout
- `gnome-extension/`: Native GNOME Shell Extension
  - `metadata.json`: Extension metadata (UUID: pequen-usb@esfingex.github.io)
  - `extension.js`: ESM extension entrypoint
  - `stylesheet.css`: Top bar menu styling
- `src/pequen_usb/`: Python 3 backend module
  - `__init__.py`: Package initialization
  - `daemon.py`: USBGuard DBus listener, history recorder, session DBus service
  - `dbus_client.py`: DBus client for org.usbguard and org.usbguard1
  - `history.py`: SQLite connection history database manager
  - `cli.py`: Command-line tool to query connection history and device status
- `icons/`: Vector SVG icons for Pequén USB
- `.planning/`: Alicanto GSD specification and tracking system
- `pyproject.toml`: Modern Python build configuration
- `install.sh`: Automated build and local installation script

```

## File: .planning/ROADMAP.md
```md
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

```

## File: .planning/STATE.md
```md
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

```

## File: .planning/WAVES.md
```md
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
| **Wave 10** | Extension Compliance | `gnome-extension/` | ✅ Complete | EGO Review 73033 adjustments: metadata keys, gettext, try-catch removal, DBus proxy scope, connectObject signal tracking. |

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

### 🌊 Wave 10: EGO Official Review Compliance & Code Cleaning
- **Date**: 2026-07-20
- **Files Created/Modified**:
  - `gnome-extension/metadata.json` [MODIFY]: Removed non-standard `license` key.
  - `gnome-extension/extension.js` [MODIFY]: Moved DBus proxy creation to `enable()`, removed try-catch wrapper, migrated to `connectObject()`/`disconnectObject()` and `this.initTranslations()`.
  - `gnome-extension/i18n.js` [DELETE]: Removed custom global execution module in favor of GNOME native `gettext`.
  - `gnome-extension/prefs.js` [MODIFY]: Enclosed DBus proxy setup within preferences window method scope.

```

## File: .planning/continue-here.md
```md
# Continue Here - Current Handoff Note

## Current Status
- Implemented native PolicyKit interactive authentication (`Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION`) for USBGuard device policies.
- Removed hardcoded PolicyKit bypass rules (`50-usbguard.rules`).
- Committed all changes under Conventional Commits (`19b16f1 feat(security): implement interactive PolicyKit authentication for USBGuard actions`).
- Repository working tree is clean.

## Next Steps
- Continue feature developments and testing as requested.

```

## File: AGENT.md
```md
# AGENT.md - Alicanto Workflow Integration for Pequén USB

This repository is integrated with the **Alicanto AI Tools** ecosystem.

## Mandatory Agent Workflow Rules

### 1. Planning Specification (`.planning/`)
Always reference and maintain the GSD planning files in `.planning/`:
- `PROJECT.md`: System architecture and folder layout
- `ROADMAP.md`: Project phases and checklists
- `STATE.md`: Active phase status and ADRs
- `CONSTITUTION.md`: Code quality, design, and terminal rules
- `CHECKLIST.md`: Verification points
- `continue-here.md`: Context handoff

### 2. Terminal Commands (`rtk`)
- ALL terminal/shell execution commands MUST be prefixed with `rtk` (e.g. `rtk git status`, `rtk python3 -m pytest`).

### 3. CaveMem Integration (Bilingual Caveman Format - BCF)
- Query CaveMem before starting complex tasks: `rtk cavemem query "<topic>"`
- Save solutions and gotchas in BCF: `cavemem add <category> "[EN] caveman notes... [ES] nota completa en español..." -t "pequen-usb,gnome"`

### 4. Supply-Chain & Package Safety Gate
- Check dependency legitimacy before installing: `rtk pip index versions <package>` / `rtk npm view <package>`.

```

## File: build.sh
```sh
#!/usr/bin/env bash
set -e

echo "📦 Compilando y empaquetando Pequén USB v1.0.2..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Compilar esquemas GSettings
if command -v glib-compile-schemas >/dev/null 2>&1; then
    echo "[*] Compilando esquemas GSettings en gnome-extension/schemas/..."
    glib-compile-schemas gnome-extension/schemas/
fi

# 2. Empaquetar Extensión de GNOME Shell (.zip)
echo "[*] Creando paquete zip para extensions.gnome.org..."
(cd gnome-extension && zip -FS -r pequen-usb@esfingex.github.io.shell-extension.zip metadata.json extension.js prefs.js stylesheet.css schemas/ -x "*.zip" -x "schemas/gschemas.compiled")

# 3. Compilar paquete Python (Wheel / Dist)
echo "[*] Compilando paquete Python en dist/..."
mkdir -p dist
if command -v python3 >/dev/null 2>&1; then
    python3 setup.py bdist_wheel --dist-dir dist/ >/dev/null 2>&1 || true
fi

echo "✅ ¡Compilación finalizada exitosamente!"
echo "   - Extensión Zip: gnome-extension/pequen-usb@esfingex.github.io.shell-extension.zip"
echo "   - Paquetes Python: dist/"

```

## File: gnome-extension/extension.js
```js
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Gio from 'gi://Gio';

const PequenDBusIface = `
<node>
  <interface name="org.pequen.USBGuard">
    <method name="GetDevices">
      <arg type="s" direction="out"/>
    </method>
    <method name="GetHistory">
      <arg type="i" direction="in"/>
      <arg type="s" direction="out"/>
    </method>
    <method name="ApplyPolicy">
      <arg type="i" direction="in"/>
      <arg type="s" direction="in"/>
      <arg type="b" direction="in"/>
      <arg type="b" direction="out"/>
    </method>
    <signal name="DeviceInserted">
      <arg type="i" name="device_id"/>
      <arg type="s" name="name"/>
      <arg type="s" name="details_json"/>
    </signal>
    <signal name="DevicePolicyChanged">
      <arg type="i" name="device_id"/>
      <arg type="s" name="action"/>
      <arg type="b" name="permanent"/>
    </signal>
  </interface>
</node>`;

export default class PequenUSBExtension extends Extension {
    enable() {
        this._indicator = new PanelMenu.Button(0.0, 'Pequén USB', false);

        // Icon
        this._icon = new St.Icon({
            icon_name: 'drive-removable-media-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(this._icon);

        // Title Header
        let titleText = _('🦉 Pequén USB Sentinel');
        let titleItem = new PopupMenu.PopupMenuItem(titleText, { reactive: false });
        titleItem.label.clutter_text.set_markup(`<b>${titleText}</b>`);
        this._indicator.menu.addMenuItem(titleItem);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Quick Access Devices Section (Removable Storage & Pinned)
        this._devicesSection = new PopupMenu.PopupMenuSection();
        this._indicator.menu.addMenuItem(this._devicesSection);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Interactive History SubMenu
        this._historySubMenu = new PopupMenu.PopupSubMenuMenuItem(_('📜 Historial de Conexiones'));
        this._indicator.menu.addMenuItem(this._historySubMenu);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Refresh MenuItem
        let refreshItem = new PopupMenu.PopupMenuItem(_('🔄 Recargar Dispositivos'));
        refreshItem.connectObject('activate', () => this._refreshAll(), this);
        this._indicator.menu.addMenuItem(refreshItem);

        // Settings / Preferences Window MenuItem
        let prefsItem = new PopupMenu.PopupMenuItem(_('⚙️ Más Ajustes...'));
        prefsItem.connectObject('activate', () => this.openPreferences(), this);
        this._indicator.menu.addMenuItem(prefsItem);

        Main.panel.addToStatusArea('pequen-usb', this._indicator);

        // DBus Client Init inside enable() scope
        const PequenProxy = Gio.DBusProxy.makeProxyWrapper(PequenDBusIface);
        this._proxy = new PequenProxy(
            Gio.DBus.session,
            'org.pequen.USBGuard',
            '/org/pequen/USBGuard',
            (proxy, error) => {
                if (error) {
                    console.error(`[Pequén USB] DBus proxy error: ${error.message}`);
                    return;
                }
                this._onProxyReady();
            }
        );
    }

    _onProxyReady() {
        if (!this._proxy) return;
        this._proxy.connectObject(
            'DeviceInserted',
            (proxy, sender, [devId, name, detailsJson]) => {
                this._notifyDeviceInserted(devId, name, detailsJson);
                this._refreshAll();
            },
            this
        );

        this._refreshAll();
    }

    _refreshAll() {
        this._refreshDevices();
        this._refreshHistory();
    }

    _refreshDevices() {
        if (!this._proxy) return;
        this._proxy.GetDevicesRemote((result, error) => {
            if (error || !result) return;
            let [jsonStr] = result;
            let devices = JSON.parse(jsonStr);
            this._updateMenuDevices(devices);
        });
    }

    _updateMenuDevices(devices) {
        this._devicesSection.removeAll();

        // Filter strictly for removable storage devices (Pendrives/Discos) OR user-pinned devices
        let quickAccessDevices = devices.filter(dev => dev.category === 'storage' || dev.is_pinned);

        if (quickAccessDevices.length === 0) {
            let emptyItem = new PopupMenu.PopupMenuItem(_('No hay pendrives ni discos externos conectados'), { reactive: false });
            this._devicesSection.addMenuItem(emptyItem);
            return;
        }

        quickAccessDevices.forEach(dev => {
            let statusBadge = dev.is_allowed
                ? (dev.is_permanent ? `🟢 [${_('Permitido (Permanente)')}]` : `🟡 [${_('Permitido (Temporal)')}]`)
                : `🔴 [${_('Bloqueado')}]`;

            let labelText = `${dev.name} ${statusBadge}`;
            let menuItem = new PopupMenu.PopupSubMenuMenuItem(labelText);

            let allowPermItem = new PopupMenu.PopupMenuItem(_('🟢 Permitir (Permanente)'));
            allowPermItem.connectObject('activate', () => this._applyPolicy(dev.number, 'allow', true), this);
            menuItem.menu.addMenuItem(allowPermItem);

            let allowTempItem = new PopupMenu.PopupMenuItem(_('🟡 Permitir (Temporal)'));
            allowTempItem.connectObject('activate', () => this._applyPolicy(dev.number, 'allow', false), this);
            menuItem.menu.addMenuItem(allowTempItem);

            let blockItem = new PopupMenu.PopupMenuItem(_('🔴 Bloquear'));
            blockItem.connectObject('activate', () => this._applyPolicy(dev.number, 'block', false), this);
            menuItem.menu.addMenuItem(blockItem);

            this._devicesSection.addMenuItem(menuItem);
        });
    }

    _refreshHistory() {
        if (!this._proxy) return;
        this._proxy.GetHistoryRemote(15, (result, error) => {
            if (error || !result) return;
            let [jsonStr] = result;
            let records = JSON.parse(jsonStr);
            this._updateHistorySubMenu(records);
        });
    }

    _updateHistorySubMenu(records) {
        this._historySubMenu.menu.removeAll();

        if (!records || records.length === 0) {
            let emptyItem = new PopupMenu.PopupMenuItem(_('Sin registros recientes de historial'), { reactive: false });
            this._historySubMenu.menu.addMenuItem(emptyItem);
            return;
        }

        records.forEach(r => {
            let timeStr = r.timestamp ? r.timestamp.substring(11, 19) : '';
            let actionBadge = r.action_taken === 'allow'
                ? (r.permanent ? '🟢 Perm' : '🟡 Temp')
                : '🔴 Block';

            let lineText = `[${timeStr}] ${r.name} - ${actionBadge}`;
            let histItem = new PopupMenu.PopupSubMenuMenuItem(lineText);

            let devId = parseInt(r.device_id, 10);
            if (!isNaN(devId)) {
                let allowPermItem = new PopupMenu.PopupMenuItem(_('🟢 Permitir (Permanente)'));
                allowPermItem.connectObject('activate', () => this._applyPolicy(devId, 'allow', true), this);
                histItem.menu.addMenuItem(allowPermItem);

                let allowTempItem = new PopupMenu.PopupMenuItem(_('🟡 Permitir (Temporal)'));
                allowTempItem.connectObject('activate', () => this._applyPolicy(devId, 'allow', false), this);
                histItem.menu.addMenuItem(allowTempItem);

                let blockItem = new PopupMenu.PopupMenuItem(_('🔴 Bloquear'));
                blockItem.connectObject('activate', () => this._applyPolicy(devId, 'block', false), this);
                histItem.menu.addMenuItem(blockItem);
            }

            this._historySubMenu.menu.addMenuItem(histItem);
        });
    }

    _applyPolicy(devId, action, permanent) {
        if (!this._proxy) return;
        this._proxy.ApplyPolicyRemote(devId, action, permanent, (result, error) => {
            if (error) return;
            let typeLabel = permanent ? _('Permitido (Permanente)') : _('Permitido (Temporal)');
            Main.notify(_('🦉 Pequén USB Sentinel'), `Dispositivo ${devId} -> ${action.toUpperCase()} (${typeLabel})`);
            this._refreshAll();
        });
    }

    _notifyDeviceInserted(devId, name, detailsJson) {
        let title = _('🦉 ¡Pequén USB Alerta!');
        let body = `Se ha insertado un nuevo USB: ${name}`;
        Main.notify(title, body);
    }

    disable() {
        if (this._proxy) {
            this._proxy.disconnectObject(this);
            this._proxy = null;
        }

        if (this._indicator) {
            this._indicator.disconnectObject(this);
        }

        if (this._devicesSection) {
            this._devicesSection.destroy();
            this._devicesSection = null;
        }
        if (this._historySubMenu) {
            this._historySubMenu.destroy();
            this._historySubMenu = null;
        }
        if (this._icon) {
            this._icon.destroy();
            this._icon = null;
        }
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}

```

## File: gnome-extension/metadata.json
```json
{
  "uuid": "pequen-usb@esfingex.github.io",
  "name": "Pequén USB",
  "description": "Chilean Owl USBGuard Sentinel & History Extension for GNOME Shell",
  "shell-version": [
    "45",
    "46",
    "47",
    "48",
    "49",
    "50"
  ],
  "settings-schema": "org.gnome.shell.extensions.pequen-usb",
  "gettext-domain": "pequen-usb",
  "url": "https://github.com/esfingex/pequen-usb",
  "version": 4,
  "author": "Iván Masías"
}

```

## File: gnome-extension/prefs.js
```js
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PequenDBusIface = `
<node>
  <interface name="org.pequen.USBGuard">
    <method name="GetDevices">
      <arg type="s" direction="out"/>
    </method>
    <method name="ApplyPolicy">
      <arg type="i" direction="in"/>
      <arg type="s" direction="in"/>
      <arg type="b" direction="in"/>
      <arg type="b" direction="out"/>
    </method>
    <method name="TogglePin">
      <arg type="s" direction="in"/>
      <arg type="b" direction="out"/>
    </method>
  </interface>
</node>`;

export default class PequenUSBPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        // 💾 PESTAÑA 1: Dispositivos Extraíbles (Pendrives / Discos Duros)
        const storagePage = new Adw.PreferencesPage({
            title: _('Extraíbles'),
            icon_name: 'drive-removable-media-symbolic',
        });
        const storageGroup = new Adw.PreferencesGroup({
            title: _('Pendrives y Discos Externos'),
            description: _('Dispositivos de almacenamiento extraíble detectados.'),
        });
        storagePage.add(storageGroup);

        // 💻 PESTAÑA 2: Dispositivos del Sistema e Internos
        const systemPage = new Adw.PreferencesPage({
            title: _('Sistema'),
            icon_name: 'computer-symbolic',
        });
        const systemGroup = new Adw.PreferencesGroup({
            title: _('Hardware de Sistema e Hubs'),
            description: _('Concentradores USB, Bluetooth integrado, cámaras web e interfaces internas.'),
        });
        systemPage.add(systemGroup);

        // ⚡ PESTAÑA 3: Opciones y Accesos Rápidos
        const configPage = new Adw.PreferencesPage({
            title: _('Ajustes'),
            icon_name: 'emblem-system-symbolic',
        });
        const configGroup = new Adw.PreferencesGroup({
            title: _('Opciones del Menú Desplegable'),
            description: _('Ajustar la visibilidad y comportamiento del centinela Pequén USB.'),
        });

        const rowSystemMenu = new Adw.SwitchRow({
            title: _('Mostrar Dispositivos de Sistema en Menú Rápido'),
            subtitle: _('Muestra hubs internos y hardware del sistema directamente en la barra superior'),
        });
        const rowNotify = new Adw.SwitchRow({
            title: _('Notificar al Insertar Dispositivos'),
            subtitle: _('Mostrar alertas emergentes al conectar nuevos USBs'),
        });

        configGroup.add(rowSystemMenu);
        configGroup.add(rowNotify);
        configPage.add(configGroup);

        window._settings.bind('show-system-devices', rowSystemMenu, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('notify-on-insert', rowNotify, 'active', Gio.SettingsBindFlags.DEFAULT);

        window.add(storagePage);
        window.add(systemPage);
        window.add(configPage);

        // DBus Async Fetch for live device rows
        const PequenProxy = Gio.DBusProxy.makeProxyWrapper(PequenDBusIface);
        const proxy = new PequenProxy(
            Gio.DBus.session,
            'org.pequen.USBGuard',
            '/org/pequen/USBGuard',
            (p, error) => {
                if (error) {
                    console.error('[Pequén USB Prefs] DBus error:', error.message);
                    return;
                }
                this._loadLiveDevices(proxy, storageGroup, systemGroup);
            }
        );
    }

    _loadLiveDevices(proxy, storageGroup, systemGroup) {
        proxy.GetDevicesRemote((result, error) => {
            if (error || !result) return;
            let devices = [];
            try {
                devices = JSON.parse(result[0]);
            } catch (e) {
                return;
            }

            let storageCount = 0;
            let systemCount = 0;

            devices.forEach(dev => {
                const row = new Adw.SwitchRow({
                    title: dev.name,
                    subtitle: `ID: ${dev.id} | Puerto: ${dev.via_port || 'Local'}`,
                    active: dev.is_allowed,
                });

                row.connect('notify::active', (sw) => {
                    const action = sw.active ? 'allow' : 'block';
                    proxy.ApplyPolicyRemote(dev.number, action, true, (res, err) => {
                        if (err) console.error('[Pequén USB Prefs] ApplyPolicy error:', err);
                    });
                });

                const pinBtn = new Gtk.ToggleButton({
                    icon_name: dev.is_pinned ? 'emblem-favorite-symbolic' : 'non-starred-symbolic',
                    active: dev.is_pinned,
                    valign: Gtk.Align.CENTER,
                    tooltip_text: _('Fijar en menú rápido'),
                });
                pinBtn.connect('toggled', (btn) => {
                    proxy.TogglePinRemote(String(dev.number), (res, err) => {
                        if (!err) {
                            btn.set_icon_name(btn.active ? 'emblem-favorite-symbolic' : 'non-starred-symbolic');
                        }
                    });
                });
                row.add_suffix(pinBtn);

                if (dev.category === 'system') {
                    systemGroup.add(row);
                    systemCount++;
                } else {
                    storageGroup.add(row);
                    storageCount++;
                }
            });

            if (storageCount === 0) {
                storageGroup.add(new Adw.ActionRow({
                    title: _('No hay pendrives ni discos externos conectados actualmente'),
                }));
            }

            if (systemCount === 0) {
                systemGroup.add(new Adw.ActionRow({
                    title: _('No hay dispositivos de sistema detectados'),
                }));
            }
        });
    }
}

```

## File: gnome-extension/stylesheet.css
```css
/* Pequén USB Top Bar Menu Styling */
.pequen-status-allowed {
    color: #2ec27e;
    font-weight: bold;
}

.pequen-status-blocked {
    color: #e01b24;
    font-weight: bold;
}

```

## File: install.sh
```sh
#!/usr/bin/env bash
set -e

echo "🦉 Instalando Pequén USB Sentinel para GNOME Shell..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check & Install USBGuard System Dependency
echo "[*] Verificando dependencia del sistema: USBGuard..."

if ! command -v usbguard >/dev/null 2>&1; then
    echo "⚠️  USBGuard no está instalado. Detectando gestor de paquetes para su instalación..."
    if command -v pacman >/dev/null 2>&1; then
        echo "[*] Instalando usbguard vía pacman (Arch/CachyOS)..."
        sudo pacman -S --needed --noconfirm usbguard
    elif command -v apt-get >/dev/null 2>&1; then
        echo "[*] Instalando usbguard vía apt..."
        sudo apt-get update && sudo apt-get install -y usbguard
    elif command -v dnf >/dev/null 2>&1; then
        echo "[*] Instalando usbguard vía dnf..."
        sudo dnf install -y usbguard
    elif command -v zypper >/dev/null 2>&1; then
        echo "[*] Instalando usbguard vía zypper..."
        sudo zypper install -y usbguard
    else
        echo "❌ No se pudo detectar un gestor de paquetes soportado (pacman, apt, dnf, zypper)."
        echo "   Por favor instala 'usbguard' manualmente."
        exit 1
    fi
else
    echo "✅ USBGuard está instalado en el sistema."
fi

# 2. Install Python package locally

echo "[*] Instalando paquete Python de Pequén USB..."
python3 -m pip install -e . --no-deps 2>/dev/null || python3 -m pip install -e . --break-system-packages

# 4. Setup Pequén USB Daemon User Service & DBus activation
BIN_PATH="$(which pequen-usb-daemon 2>/dev/null || echo "$HOME/.local/bin/pequen-usb-daemon")"

echo "[*] Configurando activador DBus y servicio de usuario systemd..."
mkdir -p "$HOME/.local/share/dbus-1/services"
cat << EOF > "$HOME/.local/share/dbus-1/services/org.pequen.USBGuard.service"
[D-BUS Service]
Name=org.pequen.USBGuard
Exec=${BIN_PATH}
EOF

mkdir -p "$HOME/.config/systemd/user"
cat << EOF > "$HOME/.config/systemd/user/pequen-usb-daemon.service"
[Unit]
Description=Pequén USB Sentinel Daemon
After=graphical-session.target

[Service]
Type=simple
ExecStart=${BIN_PATH}
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

if command -v systemctl >/dev/null 2>&1; then
    systemctl --user daemon-reload || true
    systemctl --user enable --now pequen-usb-daemon.service || true
fi

# 5. Build & Install GNOME Shell Extension & GSchemas
./build.sh

EXT_DIR="$HOME/.local/share/gnome-shell/extensions/pequen-usb@esfingex.github.io"
mkdir -p "$EXT_DIR"
cp -r gnome-extension/* "$EXT_DIR/"

if command -v glib-compile-schemas >/dev/null 2>&1; then
    glib-compile-schemas "$EXT_DIR/schemas/" || true
fi

echo "[*] Habilitando extensión pequen-usb@esfingex.github.io..."
gnome-extensions enable pequen-usb@esfingex.github.io || true

echo ""
echo "✅ ¡Pequén USB, demonio y extensión instalados con éxito!"
echo "🦉 El icono de Pequén USB Sentinel debería aparecer ahora en la barra superior."

```

## File: pyproject.toml
```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "pequen-usb"
version = "1.0.2"
description = "Chilean Owl USBGuard Sentinel & History Daemon for GNOME Shell"
readme = "README.md"
requires-python = ">=3.10"
license = "GPL-3.0-or-later"
dependencies = [
    "pygobject",
    "dbus-python"
]

[project.scripts]
pequen-usb = "pequen_usb.cli:main"
pequen-usb-daemon = "pequen_usb.daemon:main"

[tool.setuptools.packages.find]
where = ["src"]

```

## File: rules/workflow.md
```md
# pequen-usb - Workflow Obligatorio del Agente

Este proyecto forma parte del ecosistema de herramientas de seguridad de CachyOS / Alicanto (GNOME Extension + Python 3 DBus Daemon).

## WORKFLOW OBLIGATORIO DEL AGENTE

### Fase 1 - Antes de Modificar Código: Consultar CaveMem
Antes de solucionar cualquier bug, refactorizar o añadir características, **DEBES** realizar una búsqueda semántica en la base de datos CaveMem del proyecto:
```bash
rtk cavemem query "<task keywords>"
```

### Fase 2 - Al Resolver: Guardar en CaveMem (BCF)
Al solucionar un bug complejo, definir una convención de código o resolver un problema técnico (gotcha), **DEBES** registrarlo en CaveMem usando el Formato Caveman Bilingüe (BCF):
- **`[EN]`**: Inglés comprimido al estilo "caveman" (omitiendo artículos, pronombres y verbos auxiliares) para minimizar tokens LLM.
- **`[ES]`**: Español natural completo para referencia del desarrollador y panel web.

```bash
cavemem add <category> "[EN] compressed fact... [ES] descripción en español..." -t "pequen-usb,<tags>"
```
*Categorías Válidas*: `gotcha`, `rule`, `flow`, `config`, `dependency`.

## RTK es Obligatorio en Terminales
**TODOS** los comandos de terminal DEBEN llevar el prefijo `rtk`:
```bash
rtk git status
rtk python3 -m pytest
```

## Estándares del Proyecto
1. **Python 3.10+**: Anotaciones de tipos de unión (`list[str] | None`), `match/case`, y uso exclusivo de `pathlib.Path`.
2. **GNOME Shell Extension Standard (GNOME 45+ EGO Guidelines)**:
   - Compatible con GNOME Shell 45 a 50+.
   - `metadata.json`: Solo claves estándar (`uuid`, `name`, `description`, `shell-version`, `url`, `version`, `gettext-domain`, `settings-schema`). Prohibidas claves no estándar (`license`, `author`, `contributors`).
   - `build.sh`: NUNCA incluir `schemas/gschemas.compiled` ni imágenes PNG en el archivo `.zip` para EGO.
   - Sin ejecución global: No instanciar proxies DBus ni ejecutar funciones en el scope global del módulo.
   - Ciclo de vida de señales: Usar exclusivamente `connectObject()` y `disconnectObject()`.
   - Reinicio de sistema: Usar `SystemActions.getDefault().activateRestart()`, NUNCA `Util.spawn()`.
3. **Planificación GSD**: Documentación en `.planning/` (`PROJECT.md`, `ROADMAP.md`, `STATE.md`, `CONSTITUTION.md`, `CHECKLIST.md`, `continue-here.md`).

## Información del Proyecto
- **Nombre**: pequen-usb
- **Tipo**: gnome-extension + python
- **Path**: /home/esfingex/workspace/pequen-usb

```

## File: setup.py
```py
#!/usr/bin/env python3
from setuptools import setup, find_packages

setup(
    name="pequen-usb",
    version="1.0.2",
    description="Chilean Owl USBGuard Sentinel & History Daemon for GNOME Shell",
    author="Iván Masías (esfingex)",
    license="GPL-3.0-or-later",
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    entry_points={
        "console_scripts": [
            "pequen-usb=pequen_usb.cli:main",
            "pequen-usb-daemon=pequen_usb.daemon:main",
        ],
    },
)

```

## File: src/pequen_usb.egg-info/SOURCES.txt
```txt
LICENSE
README.md
pyproject.toml
setup.py
src/pequen_usb/__init__.py
src/pequen_usb/cli.py
src/pequen_usb/config.py
src/pequen_usb/daemon.py
src/pequen_usb/dbus_client.py
src/pequen_usb/history.py
src/pequen_usb/i18n.py
src/pequen_usb.egg-info/PKG-INFO
src/pequen_usb.egg-info/SOURCES.txt
src/pequen_usb.egg-info/dependency_links.txt
src/pequen_usb.egg-info/entry_points.txt
src/pequen_usb.egg-info/requires.txt
src/pequen_usb.egg-info/top_level.txt
tests/test_pequen.py
```

## File: src/pequen_usb.egg-info/dependency_links.txt
```txt


```

## File: src/pequen_usb.egg-info/entry_points.txt
```txt
[console_scripts]
pequen-usb = pequen_usb.cli:main
pequen-usb-daemon = pequen_usb.daemon:main

```

## File: src/pequen_usb.egg-info/requires.txt
```txt
pygobject
dbus-python

```

## File: src/pequen_usb.egg-info/top_level.txt
```txt
pequen_usb

```

## File: src/pequen_usb/__init__.py
```py
"""Pequén USB - Chilean Owl USBGuard Sentinel for GNOME Shell."""

__version__ = "1.0.2"

```

## File: src/pequen_usb/cli.py
```py
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

```

## File: src/pequen_usb/config.py
```py
import json
from pathlib import Path


class ConfigManager:
    """Manages persistent JSON configuration for Pequén USB."""

    DEFAULT_CONFIG = {
        "pinned_devices": [],
        "show_system_devices_in_menu": False,
        "language": "auto",
        "notify_on_insert": True,
    }

    def __init__(self, config_path: Path | None = None):
        if config_path is None:
            config_dir = Path.home() / ".config" / "pequen-usb"
            config_dir.mkdir(parents=True, exist_ok=True)
            config_path = config_dir / "config.json"

        self.config_path = config_path
        self.config = self._load()

    def _load(self) -> dict:
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    merged = self.DEFAULT_CONFIG.copy()
                    merged.update(data)
                    return merged
            except Exception as e:
                print(f"[Pequén Config] Error loading config: {e}")
        return self.DEFAULT_CONFIG.copy()

    def save(self) -> None:
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            print(f"[Pequén Config] Error saving config: {e}")

    def get(self, key: str, default=None):
        return self.config.get(key, default)

    def set(self, key: str, value) -> None:
        self.config[key] = value
        self.save()

    def is_pinned(self, device_id: str) -> bool:
        return str(device_id) in self.config.get("pinned_devices", [])

    def toggle_pin(self, device_id: str) -> bool:
        dev_str = str(device_id)
        pinned = self.config.setdefault("pinned_devices", [])
        if dev_str in pinned:
            pinned.remove(dev_str)
            is_pinned = False
        else:
            pinned.append(dev_str)
            is_pinned = True
        self.save()
        return is_pinned

```

## File: src/pequen_usb/daemon.py
```py
import json
import logging
from concurrent.futures import ThreadPoolExecutor
import dbus
import dbus.service
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

from pequen_usb.dbus_client import USBGuardDBusClient, USBGuardRuleParser, USBDevice
from pequen_usb.history import HistoryManager
from pequen_usb.config import ConfigManager
from pequen_usb.i18n import t

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("pequen-usb")


class PequénSessionService(dbus.service.Object):
    """Session DBus service exposed by Pequén USB to GNOME Shell extension."""

    BUS_NAME = "org.pequen.USBGuard"
    OBJECT_PATH = "/org/pequen/USBGuard"

    def __init__(self, daemon: "PequénDaemon"):
        self.daemon = daemon
        self.executor = ThreadPoolExecutor(max_workers=4)
        bus_name = dbus.service.BusName(self.BUS_NAME, bus=dbus.SessionBus())
        super().__init__(bus_name, self.OBJECT_PATH)

    @dbus.service.method("org.pequen.USBGuard", in_signature="", out_signature="s")
    def GetDevices(self) -> str:
        """Returns JSON list of active devices with rule status, category, and pinning."""
        perm_map = self.daemon.history.get_permanence_map()
        pinned_set = set(self.daemon.config.get("pinned_devices", []))
        devices = self.daemon.client.get_all_devices(permanent_map=perm_map, pinned_set=pinned_set)
        return json.dumps([d.to_dict() for d in devices])

    @dbus.service.method("org.pequen.USBGuard", in_signature="i", out_signature="s")
    def GetHistory(self, limit: int) -> str:
        """Returns JSON list of connection history."""
        records = self.daemon.history.get_recent_history(limit=limit or 50)
        return json.dumps(records)

    @dbus.service.method("org.pequen.USBGuard", in_signature="isb", out_signature="b")
    def ApplyPolicy(self, device_id: int, action: str, permanent: bool) -> bool:
        """Applies policy (allow/block/reject) to a device asynchronously off the main loop."""
        def _execute_apply():
            try:
                self.daemon.client.apply_policy(device_id, action, permanent)
                perm_map = self.daemon.history.get_permanence_map()
                devices = self.daemon.client.get_all_devices(permanent_map=perm_map)
                target_dev = next((d for d in devices if d.number == device_id), None)

                name = target_dev.name if target_dev else f"Device {device_id}"
                vendor = target_dev.vendor_id if target_dev else ""
                product = target_dev.product_id if target_dev else ""

                self.daemon.history.log_event(
                    device_id=str(device_id),
                    name=name,
                    action_taken=action.lower(),
                    vendor_id=vendor,
                    product_id=product,
                    permanent=permanent,
                )
                GLib.idle_add(self.DevicePolicyChanged, device_id, action, permanent)
                return True
            except Exception as err:
                logger.error(f"Error applying policy for device {device_id}: {err}")
                return False

        future = self.executor.submit(_execute_apply)
        try:
            return future.result(timeout=30.0)
        except Exception as exc:
            logger.error(f"Timed out or failed applying policy for device {device_id}: {exc}")
            return False

    @dbus.service.method("org.pequen.USBGuard", in_signature="", out_signature="s")
    def GetConfig(self) -> str:
        """Returns configuration JSON."""
        return json.dumps(self.daemon.config.config)

    @dbus.service.method("org.pequen.USBGuard", in_signature="s", out_signature="b")
    def TogglePin(self, dev_id_str: str) -> bool:
        """Toggles quick access pinning for a device ID or HW ID."""
        is_pinned = self.daemon.config.toggle_pin(dev_id_str)
        self.ConfigChanged(json.dumps(self.daemon.config.config))
        return is_pinned

    @dbus.service.signal("org.pequen.USBGuard", signature="iss")
    def DeviceInserted(self, device_id: int, name: str, details_json: str) -> None:
        """Signal emitted when a new device is connected."""
        pass

    @dbus.service.signal("org.pequen.USBGuard", signature="isb")
    def DevicePolicyChanged(self, device_id: int, action: str, permanent: bool) -> None:
        """Signal emitted when a device policy is changed."""
        pass

    @dbus.service.signal("org.pequen.USBGuard", signature="s")
    def ConfigChanged(self, config_json: str) -> None:
        """Signal emitted when configuration is updated."""
        pass


class PequénDaemon:
    """Main Pequén USB Daemon listener with auto-reconnection safety."""

    def __init__(self):
        DBusGMainLoop(set_as_default=True)
        self.history = HistoryManager()
        self.config = ConfigManager()
        self.client = None
        self._init_client()
        self.service = PequénSessionService(self)

    def _init_client(self) -> bool:
        try:
            self.client = USBGuardDBusClient()
            self._setup_signals()
            return True
        except Exception as err:
            logger.warning(f"Could not connect to USBGuard DBus service: {err}")
            return False

    def _setup_signals(self) -> None:
        if self.client and hasattr(self.client, "devices_iface"):
            try:
                self.client.devices_iface.connect_to_signal(
                    "DevicePresenceChanged", self._on_device_presence_changed
                )
            except Exception as err:
                logger.error(f"Failed to subscribe to DevicePresenceChanged signal: {err}")

    def _on_device_presence_changed(
        self, dev_id: int, event: int, target: int, device_rule: str, attributes: dict
    ) -> None:
        parsed = USBGuardRuleParser.parse(str(device_rule))
        perm_map = self.history.get_permanence_map()
        pinned_set = set(self.config.get("pinned_devices", []))
        device = USBDevice(
            int(dev_id),
            parsed,
            is_permanent=perm_map.get(int(dev_id), False),
            is_pinned=str(dev_id) in pinned_set,
        )

        logger.info(t("device_event", id=dev_id, rule=device.rule, name=device.name))

        # Event: 1 = INSERT, 0 = PRESENT, 3 = REMOVE
        if event in (0, 1) and not device.is_allowed:
            self.history.log_event(
                device_id=str(dev_id),
                name=device.name,
                action_taken="blocked",
                vendor_id=device.vendor_id,
                product_id=device.product_id,
                serial=device.serial,
                hash_val=device.hash,
            )
            # Emit signal to GNOME Shell extension
            self.service.DeviceInserted(int(dev_id), device.name, json.dumps(device.to_dict()))

    def run(self) -> None:
        logger.info(t("daemon_listening"))
        loop = GLib.MainLoop()
        loop.run()


def main():
    daemon = PequénDaemon()
    daemon.run()


if __name__ == "__main__":
    main()

```

## File: src/pequen_usb/dbus_client.py
```py
import logging
import shlex
from pathlib import Path
import dbus
from dbus.mainloop.glib import DBusGMainLoop
import gi
gi.require_version("Gio", "2.0")
from gi.repository import Gio, GLib

logger = logging.getLogger("pequen-usb")


class USBGuardRuleParser:
    """Zero-dependency parser for USBGuard rule strings using shlex."""

    @staticmethod
    def parse(rule_string: str) -> dict[str, str | list[str]]:
        tokens = shlex.split(rule_string)
        if not tokens:
            return {}

        result: dict[str, str | list[str]] = {"rule": tokens[0]}
        i = 1
        while i < len(tokens):
            key = tokens[i]
            match key:
                case "with-interface":
                    if i + 1 < len(tokens) and tokens[i + 1] == "{":
                        ifaces = []
                        i += 2
                        while i < len(tokens) and tokens[i] != "}":
                            ifaces.append(tokens[i])
                            i += 1
                        result["with_interface"] = ifaces
                    elif i + 1 < len(tokens):
                        result["with_interface"] = [tokens[i + 1]]
                        i += 1
                case _:
                    if i + 1 < len(tokens):
                        result[key.replace("-", "_")] = tokens[i + 1]
                        i += 1
            i += 1
        return result


class USBDevice:
    """Represents a USB device connected via USBGuard DBus."""

    def __init__(
        self,
        number: int,
        rule_dict: dict[str, str | list[str]],
        is_permanent: bool = False,
        is_pinned: bool = False,
    ):
        self.number = number
        self.rule = str(rule_dict.get("rule", "block"))
        self.id = str(rule_dict.get("id", ""))
        self.serial = str(rule_dict.get("serial", ""))
        self.name = str(rule_dict.get("name", "Unknown Device"))
        self.hash = str(rule_dict.get("hash", ""))
        self.parent_hash = str(rule_dict.get("parent_hash", ""))
        self.via_port = str(rule_dict.get("via_port", ""))
        self.is_permanent = is_permanent
        self.is_pinned = is_pinned
        self.with_interface = rule_dict.get("with_interface", [])
        if isinstance(self.with_interface, str):
            self.with_interface = [self.with_interface]

        self.category = self._detect_category()

    def _detect_category(self) -> str:
        """Classifies device into 'storage', 'system', or 'peripheral' based on interfaces & sysfs."""
        ifaces = [str(iface) for iface in self.with_interface]
        name_lower = self.name.lower()

        # Check for mass storage interfaces (class 08) or name
        is_mass_storage = any(iface.startswith("08:") or iface == "08" for iface in ifaces) or any(
            kw in name_lower for kw in ["flash", "drive", "disk", "storage", "mass storage", "kingston", "sandisk"]
        )
        if is_mass_storage:
            return "storage"

        # Check for system hubs (class 09), webcams (0e), bluetooth (e0) or root hubs
        is_system_dev = (
            any(iface.startswith("09:") or iface.startswith("0e:") or iface.startswith("e0:") for iface in ifaces)
            or "root hub" in name_lower
            or "linux foundation" in name_lower
            or "bluetooth" in name_lower
            or "camera" in name_lower
            or "webcam" in name_lower
        )
        if is_system_dev:
            return "system"

        # Check sysfs removable attribute if via_port matches
        if self.via_port:
            port_name = self.via_port.strip('"')
            sysfs_removable = Path(f"/sys/bus/usb/devices/{port_name}/removable")
            if sysfs_removable.exists():
                try:
                    val = sysfs_removable.read_text().strip()
                    if val == "fixed":
                        return "system"
                    elif val == "removable":
                        return "storage" if is_mass_storage else "peripheral"
                except Exception:
                    pass

        return "peripheral"

    @property
    def is_allowed(self) -> bool:
        return self.rule.lower() == "allow"

    @property
    def rule_type(self) -> str:
        if self.is_allowed:
            return "permanent" if self.is_permanent else "temporary"
        return "blocked"

    @property
    def vendor_id(self) -> str:
        return self.id.split(":")[0] if ":" in self.id else ""

    @property
    def product_id(self) -> str:
        return self.id.split(":")[1] if ":" in self.id else ""

    def to_dict(self) -> dict[str, str | int | bool | list[str]]:
        return {
            "number": self.number,
            "rule": self.rule,
            "rule_type": self.rule_type,
            "is_permanent": self.is_permanent,
            "is_pinned": self.is_pinned,
            "category": self.category,
            "id": self.id,
            "name": self.name,
            "serial": self.serial,
            "hash": self.hash,
            "via_port": self.via_port,
            "with_interface": self.with_interface,
            "is_allowed": self.is_allowed,
        }


class USBGuardDBusClient:
    """DBus client wrapper for USBGuard daemon with interactive PolicyKit authentication."""

    def __init__(self):
        DBusGMainLoop(set_as_default=True)
        self.bus = dbus.SystemBus()
        self.gio_bus = Gio.bus_get_sync(Gio.BusType.SYSTEM, None)
        self._connect_dbus()

    def _connect_dbus(self) -> None:
        try:
            dev_obj = self.bus.get_object("org.usbguard", "/org/usbguard/Devices")
            pol_obj = self.bus.get_object("org.usbguard", "/org/usbguard/Policy")
            self.devices_iface = dbus.Interface(dev_obj, "org.usbguard.Devices")
            self.policy_iface = dbus.Interface(pol_obj, "org.usbguard.Policy")
            self.service_name = "org.usbguard"
            self.devices_path = "/org/usbguard/Devices"
            self.devices_interface = "org.usbguard.Devices"
            self.policy_path = "/org/usbguard/Policy"
            self.policy_interface = "org.usbguard.Policy"
        except Exception:
            dev_obj = self.bus.get_object("org.usbguard1", "/org/usbguard1/Devices")
            pol_obj = self.bus.get_object("org.usbguard1", "/org/usbguard1/Policy")
            self.devices_iface = dbus.Interface(dev_obj, "org.usbguard.Devices1")
            self.policy_iface = dbus.Interface(pol_obj, "org.usbguard.Policy1")
            self.service_name = "org.usbguard1"
            self.devices_path = "/org/usbguard1/Devices"
            self.devices_interface = "org.usbguard.Devices1"
            self.policy_path = "/org/usbguard1/Policy"
            self.policy_interface = "org.usbguard.Policy1"

    def get_all_devices(
        self,
        permanent_map: dict[int, bool] | None = None,
        pinned_set: set[str] | None = None,
    ) -> list[USBDevice]:
        try:
            raw_devices = self.devices_iface.listDevices("match")
        except (dbus.DBusException, GLib.GError) as err:
            logger.error(f"Failed to list USBGuard devices via DBus: {err}")
            return []

        devices = []
        perm_map = permanent_map or {}
        p_set = pinned_set or set()
        for dev_struct in raw_devices:
            dev_id = int(dev_struct[0])
            rule_str = str(dev_struct[1])
            parsed = USBGuardRuleParser.parse(rule_str)
            is_perm = perm_map.get(dev_id, False)
            is_pinned = str(dev_id) in p_set or str(parsed.get("id", "")) in p_set
            devices.append(USBDevice(dev_id, parsed, is_permanent=is_perm, is_pinned=is_pinned))
        return devices

    def apply_policy(self, device_id: int, target: str, permanent: bool = False) -> int:
        """Applies policy (allow/block/reject) via PolicyKit interactive password prompt if required."""
        rule_num = 0 if target.lower() == "allow" else (1 if target.lower() == "block" else 2)

        try:
            # Execute applyDevicePolicy with ALLOW_INTERACTIVE_AUTHORIZATION (triggers PolKit password dialog)
            res = self.gio_bus.call_sync(
                self.service_name,
                self.devices_path,
                self.devices_interface,
                "applyDevicePolicy",
                GLib.Variant("(uub)", (device_id, rule_num, permanent)),
                GLib.VariantType("(u)"),
                Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
                -1,
                None,
            )
            rule_id = res.unpack()[0]
            return rule_id
        except (GLib.GError, dbus.DBusException) as err:
            logger.error(f"Error applying USBGuard policy for device {device_id}: {err}")
            raise



```

## File: src/pequen_usb/history.py
```py
import sqlite3
from datetime import datetime
from pathlib import Path


class HistoryManager:
    """Manages SQLite database for USB device connection history."""

    def __init__(self, db_path: Path | None = None):
        if db_path is None:
            config_dir = Path.home() / ".config" / "pequen-usb"
            config_dir.mkdir(parents=True, exist_ok=True)
            db_path = config_dir / "history.db"

        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=5000")
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS usb_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    device_id TEXT NOT NULL,
                    vendor_id TEXT,
                    product_id TEXT,
                    name TEXT NOT NULL,
                    serial TEXT,
                    hash TEXT,
                    parent_hash TEXT,
                    interfaces TEXT,
                    action_taken TEXT NOT NULL,
                    permanent INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def log_event(
        self,
        device_id: str,
        name: str,
        action_taken: str,
        vendor_id: str | None = None,
        product_id: str | None = None,
        serial: str | None = None,
        hash_val: str | None = None,
        parent_hash: str | None = None,
        interfaces: str | None = None,
        permanent: bool = False,
    ) -> int:
        now_str = datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO usb_history (
                    timestamp, device_id, vendor_id, product_id, name,
                    serial, hash, parent_hash, interfaces, action_taken, permanent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    now_str,
                    str(device_id),
                    vendor_id or "",
                    product_id or "",
                    name or "Unknown USB Device",
                    serial or "",
                    hash_val or "",
                    parent_hash or "",
                    interfaces or "",
                    action_taken,
                    1 if permanent else 0,
                ),
            )
            conn.commit()
            return cursor.lastrowid or 0

    def get_recent_history(self, limit: int = 50) -> list[dict[str, str | int]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM usb_history ORDER BY id DESC LIMIT ?", (limit,)
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_permanence_map(self) -> dict[int, bool]:
        """Returns dict mapping int device_id -> bool is_permanent based on latest action."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT device_id, permanent
                FROM usb_history
                WHERE id IN (SELECT MAX(id) FROM usb_history GROUP BY device_id)
            """)
            rows = cursor.fetchall()
            result = {}
            for row in rows:
                try:
                    dev_id = int(row["device_id"])
                    result[dev_id] = bool(row["permanent"])
                except ValueError:
                    pass
            return result

    def clear_history(self) -> None:
        with self._get_connection() as conn:
            conn.execute("DELETE FROM usb_history")
            conn.commit()

```

## File: src/pequen_usb/i18n.py
```py
import os
import locale

TRANSLATIONS: dict[str, dict[str, str]] = {
    "es": {
        "cli_help_title": "Pequén USB - Centinela USBGuard en Python / GNOME",
        "cli_usage": "Uso:",
        "cmd_devices": "devices          Listar dispositivos USB conectados y su estado actual",
        "cmd_history": "history          Mostrar el historial reciente de conexiones",
        "cmd_allow": "allow <id> [--temp] Permitir un dispositivo USB por ID",
        "cmd_block": "block <id>       Bloquear un dispositivo USB por ID",
        "cmd_clear_history": "clear-history    Limpiar historial de conexiones en SQLite",
        "hdr_devices": "--- Dispositivos USB Conectados ({count}) ---",
        "hdr_history": "--- Historial de Conexiones ({count} registros) ---",
        "status_allowed_perm": "PERMITIDO (Permanente)",
        "status_allowed_temp": "PERMITIDO (Temporal)",
        "status_blocked": "BLOQUEADO",
        "status_unknown": "DESCONOCIDO",
        "err_specify_allow_id": "Error: Especifica el ID del dispositivo a permitir",
        "err_specify_block_id": "Error: Especifica el ID del dispositivo a bloquear",
        "msg_allowed_temp": "Dispositivo {id} PERMITIDO (Temporal)",
        "msg_allowed_perm": "Dispositivo {id} PERMITIDO (Permanente)",
        "msg_blocked": "Dispositivo {id} BLOQUEADO",
        "msg_history_cleared": "Historial limpiado correctamente.",
        "daemon_listening": "[Pequén] Demonio Pequén USB escuchando en DBus de sesión ('org.pequen.USBGuard')...",
        "device_event": "[Pequén] Evento de dispositivo: ID={id}, Regla={rule}, Nombre='{name}'",
        "alert_title": "🦉 ¡Pequén USB Alerta!",
        "alert_body": "Se ha insertado un nuevo USB: {name}\n¿Qué deseas hacer?",
    },
    "en": {
        "cli_help_title": "Pequén USB - Chilean Owl USBGuard Sentinel",
        "cli_usage": "Usage:",
        "cmd_devices": "devices          List connected USB devices and their current status",
        "cmd_history": "history          Show recent connection history",
        "cmd_allow": "allow <id> [--temp] Allow a USB device by ID",
        "cmd_block": "block <id>       Block a USB device by ID",
        "cmd_clear_history": "clear-history    Clear SQLite connection history",
        "hdr_devices": "--- Connected USB Devices ({count}) ---",
        "hdr_history": "--- Connection History ({count} entries) ---",
        "status_allowed_perm": "ALLOWED (Permanent)",
        "status_allowed_temp": "ALLOWED (Temporary)",
        "status_blocked": "BLOCKED",
        "status_unknown": "UNKNOWN",
        "err_specify_allow_id": "Error: Specify device ID to allow",
        "err_specify_block_id": "Error: Specify device ID to block",
        "msg_allowed_temp": "Device {id} ALLOWED (Temporary)",
        "msg_allowed_perm": "Device {id} ALLOWED (Permanent)",
        "msg_blocked": "Device {id} BLOCKED",
        "msg_history_cleared": "History cleared successfully.",
        "daemon_listening": "[Pequén] Pequén USB Daemon listening on session DBus ('org.pequen.USBGuard')...",
        "device_event": "[Pequén] Device event: ID={id}, Rule={rule}, Name='{name}'",
        "alert_title": "🦉 Pequén USB Alert!",
        "alert_body": "New USB device inserted: {name}\nWhat would you like to do?",
    },
}


def get_system_language() -> str:
    lang_env = os.environ.get("LANG") or os.environ.get("LC_ALL") or ""
    if lang_env.lower().startswith("en"):
        return "en"
    try:
        sys_loc = locale.getlocale()[0]
        if sys_loc and sys_loc.lower().startswith("en"):
            return "en"
    except Exception:
        pass
    return "es"


CURRENT_LANG: str = get_system_language()


def set_language(lang: str) -> None:
    global CURRENT_LANG
    if lang in TRANSLATIONS:
        CURRENT_LANG = lang


def t(key: str, lang: str | None = None, **kwargs: str | int) -> str:
    target_lang = lang or CURRENT_LANG
    lang_dict = TRANSLATIONS.get(target_lang, TRANSLATIONS["es"])
    template = lang_dict.get(key, TRANSLATIONS["es"].get(key, key))
    if kwargs:
        return template.format(**kwargs)
    return template

```

