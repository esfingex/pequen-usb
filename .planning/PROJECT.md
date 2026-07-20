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
