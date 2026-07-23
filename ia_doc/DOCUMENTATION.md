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
