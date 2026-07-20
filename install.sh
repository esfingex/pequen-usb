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
echo "[*] Empaquetando extensión de GNOME Shell..."
(cd gnome-extension && zip -FS -r pequen-usb@esfingex.github.io.shell-extension.zip metadata.json extension.js prefs.js stylesheet.css schemas/ -x "*.zip")

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
