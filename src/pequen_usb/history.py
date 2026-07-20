import sqlite3
from datetime import datetime
from pathlib import Path


class HistoryManager:
    """Manages SQLite database for USB device connection history."""

    def __init__(self, db_path: Path | None = None):
        if db_path is None:
            config_dir = Path.home() / ".config" / "pequen-usb"
            config_dir.mkdir(parents=True, exist_ok=True)
            db_path = config_dir / "history.db"

        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS usb_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    device_id TEXT NOT NULL,
                    vendor_id TEXT,
                    product_id TEXT,
                    name TEXT NOT NULL,
                    serial TEXT,
                    hash TEXT,
                    parent_hash TEXT,
                    interfaces TEXT,
                    action_taken TEXT NOT NULL,
                    permanent INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def log_event(
        self,
        device_id: str,
        name: str,
        action_taken: str,
        vendor_id: str | None = None,
        product_id: str | None = None,
        serial: str | None = None,
        hash_val: str | None = None,
        parent_hash: str | None = None,
        interfaces: str | None = None,
        permanent: bool = False,
    ) -> int:
        now_str = datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO usb_history (
                    timestamp, device_id, vendor_id, product_id, name,
                    serial, hash, parent_hash, interfaces, action_taken, permanent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    now_str,
                    str(device_id),
                    vendor_id or "",
                    product_id or "",
                    name or "Unknown USB Device",
                    serial or "",
                    hash_val or "",
                    parent_hash or "",
                    interfaces or "",
                    action_taken,
                    1 if permanent else 0,
                ),
            )
            conn.commit()
            return cursor.lastrowid or 0

    def get_recent_history(self, limit: int = 50) -> list[dict[str, str | int]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM usb_history ORDER BY id DESC LIMIT ?", (limit,)
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_permanence_map(self) -> dict[int, bool]:
        """Returns dict mapping int device_id -> bool is_permanent based on latest action."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT device_id, permanent
                FROM usb_history
                WHERE id IN (SELECT MAX(id) FROM usb_history GROUP BY device_id)
            """)
            rows = cursor.fetchall()
            result = {}
            for row in rows:
                try:
                    dev_id = int(row["device_id"])
                    result[dev_id] = bool(row["permanent"])
                except ValueError:
                    pass
            return result

    def clear_history(self) -> None:
        with self._get_connection() as conn:
            conn.execute("DELETE FROM usb_history")
            conn.commit()
