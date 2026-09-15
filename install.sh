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

# 1.5. Configurar permisos IPC y servicios systemd de USBGuard
echo "[*] Configurando permisos IPC y servicios de USBGuard..."
CONF_FILE="/etc/usbguard/usbguard-daemon.conf"
if [ -f "$CONF_FILE" ]; then
    TARGET_USER="${SUDO_USER:-$USER}"
    if ! sudo grep -q "IPCAllowedUsers=.*$TARGET_USER" "$CONF_FILE" 2>/dev/null; then
        if sudo grep -q "^IPCAllowedUsers=" "$CONF_FILE"; then
            sudo sed -i "/^IPCAllowedUsers=/ s/$/ $TARGET_USER/" "$CONF_FILE"
        else
            echo "IPCAllowedUsers=root $TARGET_USER" | sudo tee -a "$CONF_FILE" >/dev/null
        fi
        echo "✅ Usuario $TARGET_USER agregado a IPCAllowedUsers en $CONF_FILE."
    else
        echo "✅ Permisos IPC ya configurados para $TARGET_USER en USBGuard."
    fi
fi

if command -v systemctl >/dev/null 2>&1; then
    echo "[*] Habilitando y reiniciando usbguard.service y usbguard-dbus.service..."
    sudo systemctl enable --now usbguard.service usbguard-dbus.service 2>/dev/null || true
    sudo systemctl restart usbguard.service usbguard-dbus.service 2>/dev/null || true
fi

# 1.6. Regla sudoers para remonte automático de USB sin contraseña
echo "[*] Configurando regla sudoers para remonte automático de USB..."
SUDOERS_FILE="/etc/sudoers.d/pequen-usb"
MOUNT_BIN="$(which mount)"
TARGET_USER="${SUDO_USER:-$USER}"
SUDOERS_LINE="$TARGET_USER ALL=(ALL) NOPASSWD: $MOUNT_BIN -o remount*"
if ! sudo grep -qF "$TARGET_USER" "$SUDOERS_FILE" 2>/dev/null; then
    echo "$SUDOERS_LINE" | sudo tee "$SUDOERS_FILE" >/dev/null
    sudo chmod 440 "$SUDOERS_FILE"
    echo "✅ Regla sudoers creada en $SUDOERS_FILE"
else
    echo "✅ Regla sudoers ya existe para $TARGET_USER"
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
