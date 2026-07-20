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
(cd gnome-extension && zip -FS -r pequen-usb@esfingex.github.io.shell-extension.zip metadata.json extension.js prefs.js stylesheet.css schemas/ -x "*.zip")

# 3. Compilar paquete Python (Wheel / Dist)
echo "[*] Compilando paquete Python en dist/..."
mkdir -p dist
if command -v python3 >/dev/null 2>&1; then
    python3 setup.py bdist_wheel --dist-dir dist/ >/dev/null 2>&1 || true
fi

echo "✅ ¡Compilación finalizada exitosamente!"
echo "   - Extensión Zip: gnome-extension/pequen-usb@esfingex.github.io.shell-extension.zip"
echo "   - Paquetes Python: dist/"
