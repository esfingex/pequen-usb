# 🦉 Pequén USB - Chilean Owl USBGuard Sentinel for GNOME Shell

Pequén USB es una extensión nativa para **GNOME Shell 45/50+** y demonio en **Python 3** para el monitoreo, control de permisos e historial de dispositivos USB con **USBGuard**.

Inspirado en el **Pequén** (el búho minero chileno *Athene cunicularia* que vigila la entrada de su refugio), este proyecto actúa como un centinela en la barra superior de tu escritorio Linux.

---

## 🚀 Instalación Rápida

Ejecuta el script de instalación automática:

```bash
chmod +x install.sh
./install.sh
```

O instala la extensión y el demonio manualmente:

```bash
# 1. Instalar paquete de Python en modo editable
pip install -e .

# 2. Empaquetar e instalar la extensión de GNOME Shell
cd gnome-extension
gnome-extensions pack --extra-source=stylesheet.css --force
gnome-extensions install pequen-usb@esfingex.github.io.shell-extension.zip --force
gnome-extensions enable pequen-usb@esfingex.github.io
```

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
- **Persistencia**: Base de datos SQLite en `~/.config/pequen-usb/history.db`.

---

## 📜 Licencia

Este proyecto está liberado bajo la licencia pública **GNU General Public License v3.0 (GPL-3.0)**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

