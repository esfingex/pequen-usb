# 🦉 Pequén USB - Chilean Owl USBGuard Sentinel for GNOME Shell

[![Get it on GNOME Extensions](https://img.shields.io/badge/Get%20it%20on-GNOME%20Extensions-4a86e8?style=for-the-badge&logo=gnome&logoColor=white)](https://extensions.gnome.org/extension/pequen-usb@esfingex.github.io)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](LICENSE)

Pequén USB es una extensión nativa para **GNOME Shell 45/50+** y demonio en **Python 3 (v1.0.2)** para el monitoreo, control de permisos e historial de dispositivos USB con **USBGuard**.

Inspirado en el **Pequén** (el búho minero chileno *Athene cunicularia* que vigila la entrada de su refugio), este proyecto actúa como un centinela en la barra superior de tu escritorio Linux.

---

## 📦 Compilación y Empaquetado (`build.sh`)

Para compilar los esquemas GSettings, empaquetar la extensión para `extensions.gnome.org` y generar la distribución Python (`dist/`) sin modificar el sistema:

```bash
chmod +x build.sh
./build.sh
```

**Artefactos generados:**
* **Extensión GNOME (zip para EGO):** `gnome-extension/pequen-usb@esfingex.github.io.shell-extension.zip` (Revisado y verificado con `shexli`: 0 advertencias/errores).
* **Paquete Python Wheel:** `dist/pequen_usb-1.0.2-py3-none-any.whl`

---

## 🚀 Instalación y Despliegue Local (`install.sh`)

Para compilar, instalar dependencias de sistema (`usbguard`), registrar el demonio DBus/systemd y habilitar la extensión localmente:

```bash
chmod +x install.sh
./install.sh
```

---

## 🔢 Estructura de Versiones

* **Python Daemon & CLI Package**: `v1.0.2` (definida en `pyproject.toml` y `setup.py`).
* **GNOME Shell Extension**: Versión de revisión `2` (definida en `gnome-extension/metadata.json`).

---

## 🛠️ Uso del CLI `pequen-usb`

```bash
# Ver dispositivos USB conectados actualmente
pequen-usb devices

# Ver el historial de conexiones registrado en SQLite
pequen-usb history

# Permitir un dispositivo temporal o permanentemente
pequen-usb allow 5 --temp
pequen-usb allow 5

# Bloquear un dispositivo
pequen-usb block 5
```

---

## 🏛️ Arquitectura

- **Front-end**: Extensión nativa de GNOME Shell ESM (JavaScript GJS).
- **Back-end**: Servicio demonio en Python 3.10+ (`pequen-usb-daemon`) conectado a DBus (`org.usbguard` / `org.usbguard1`).
- **Persistencia**: Base de datos SQLite en `~/.config/pequen-usb/history.db` y configuración en `~/.config/pequen-usb/config.json`.

---

## 📜 Licencia

Este proyecto está liberado bajo la licencia pública **GNU General Public License v3.0 (GPL-3.0)**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
