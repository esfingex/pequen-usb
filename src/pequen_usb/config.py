import json
from pathlib import Path


class ConfigManager:
    """Manages persistent JSON configuration for Pequén USB."""

    DEFAULT_CONFIG = {
        "pinned_devices": [],
        "show_system_devices_in_menu": False,
        "language": "auto",
        "notify_on_insert": True,
    }

    def __init__(self, config_path: Path | None = None):
        if config_path is None:
            config_dir = Path.home() / ".config" / "pequen-usb"
            config_dir.mkdir(parents=True, exist_ok=True)
            config_path = config_dir / "config.json"

        self.config_path = config_path
        self.config = self._load()

    def _load(self) -> dict:
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    merged = self.DEFAULT_CONFIG.copy()
                    merged.update(data)
                    return merged
            except Exception as e:
                print(f"[Pequén Config] Error loading config: {e}")
        return self.DEFAULT_CONFIG.copy()

    def save(self) -> None:
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            print(f"[Pequén Config] Error saving config: {e}")

    def get(self, key: str, default=None):
        return self.config.get(key, default)

    def set(self, key: str, value) -> None:
        self.config[key] = value
        self.save()

    def is_pinned(self, device_id: str) -> bool:
        return str(device_id) in self.config.get("pinned_devices", [])

    def toggle_pin(self, device_id: str) -> bool:
        dev_str = str(device_id)
        pinned = self.config.setdefault("pinned_devices", [])
        if dev_str in pinned:
            pinned.remove(dev_str)
            is_pinned = False
        else:
            pinned.append(dev_str)
            is_pinned = True
        self.save()
        return is_pinned
