#!/usr/bin/env bash
set -e

echo "🦉 Instalando Pequén USB Sentinel para GNOME Shell..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Install Python package locally
echo "[*] Instalando paquete Python de Pequén USB..."
python3 -m pip install -e . --no-deps 2>/dev/null || python3 -m pip install -e . --break-system-packages

# 2. Build & Install GNOME Shell Extension
echo "[*] Empaquetando extensión de GNOME Shell..."
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/pequen-usb@esfingex.github.io"
mkdir -p "$EXT_DIR"
cp gnome-extension/* "$EXT_DIR/"

echo "[*] Habilitando extensión pequen-usb@esfingex.github.io..."
gnome-extensions enable pequen-usb@esfingex.github.io || true

echo "✅ ¡Pequén USB instalado con éxito!"
echo "👉 Puedes iniciar el demonio con: pequen-usb-daemon"
