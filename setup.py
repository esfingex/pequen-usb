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
