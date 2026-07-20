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

# 2. Check & Enable systemd service for USBGuard
if command -v systemctl >/dev/null 2>&1; then
    if ! systemctl is-active --quiet usbguard.service; then
        echo "[*] Habilitando e iniciando el servicio systemd usbguard..."
        sudo systemctl enable --now usbguard.service || true
    else
        echo "✅ El servicio usbguard.service ya está activo."
    fi
fi

# 3. Install Python package locally
echo "[*] Instalando paquete Python de Pequén USB..."
python3 -m pip install -e . --no-deps 2>/dev/null || python3 -m pip install -e . --break-system-packages

# 4. Build & Install GNOME Shell Extension
echo "[*] Empaquetando extensión de GNOME Shell..."
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/pequen-usb@esfingex.github.io"
mkdir -p "$EXT_DIR"
cp gnome-extension/* "$EXT_DIR/"

echo "[*] Habilitando extensión pequen-usb@esfingex.github.io..."
gnome-extensions enable pequen-usb@esfingex.github.io || true

echo ""
echo "✅ ¡Pequén USB e dependencias instaladas con éxito!"
echo "👉 Puedes iniciar el demonio con: pequen-usb-daemon"
