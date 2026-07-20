import os
import locale

TRANSLATIONS: dict[str, dict[str, str]] = {
    "es": {
        "cli_help_title": "Pequén USB - Centinela USBGuard en Python / GNOME",
        "cli_usage": "Uso:",
        "cmd_devices": "devices          Listar dispositivos USB conectados y su estado actual",
        "cmd_history": "history          Mostrar el historial reciente de conexiones",
        "cmd_allow": "allow <id> [--temp] Permitir un dispositivo USB por ID",
        "cmd_block": "block <id>       Bloquear un dispositivo USB por ID",
        "cmd_clear_history": "clear-history    Limpiar historial de conexiones en SQLite",
        "hdr_devices": "--- Dispositivos USB Conectados ({count}) ---",
        "hdr_history": "--- Historial de Conexiones ({count} registros) ---",
        "status_allowed_perm": "PERMITIDO (Permanente)",
        "status_allowed_temp": "PERMITIDO (Temporal)",
        "status_blocked": "BLOQUEADO",
        "status_unknown": "DESCONOCIDO",
        "err_specify_allow_id": "Error: Especifica el ID del dispositivo a permitir",
        "err_specify_block_id": "Error: Especifica el ID del dispositivo a bloquear",
        "msg_allowed_temp": "Dispositivo {id} PERMITIDO (Temporal)",
        "msg_allowed_perm": "Dispositivo {id} PERMITIDO (Permanente)",
        "msg_blocked": "Dispositivo {id} BLOQUEADO",
        "msg_history_cleared": "Historial limpiado correctamente.",
        "daemon_listening": "[Pequén] Demonio Pequén USB escuchando en DBus de sesión ('org.pequen.USBGuard')...",
        "device_event": "[Pequén] Evento de dispositivo: ID={id}, Regla={rule}, Nombre='{name}'",
        "alert_title": "🦉 ¡Pequén USB Alerta!",
        "alert_body": "Se ha insertado un nuevo USB: {name}\n¿Qué deseas hacer?",
    },
    "en": {
        "cli_help_title": "Pequén USB - Chilean Owl USBGuard Sentinel",
        "cli_usage": "Usage:",
        "cmd_devices": "devices          List connected USB devices and their current status",
        "cmd_history": "history          Show recent connection history",
        "cmd_allow": "allow <id> [--temp] Allow a USB device by ID",
        "cmd_block": "block <id>       Block a USB device by ID",
        "cmd_clear_history": "clear-history    Clear SQLite connection history",
        "hdr_devices": "--- Connected USB Devices ({count}) ---",
        "hdr_history": "--- Connection History ({count} entries) ---",
        "status_allowed_perm": "ALLOWED (Permanent)",
        "status_allowed_temp": "ALLOWED (Temporary)",
        "status_blocked": "BLOCKED",
        "status_unknown": "UNKNOWN",
        "err_specify_allow_id": "Error: Specify device ID to allow",
        "err_specify_block_id": "Error: Specify device ID to block",
        "msg_allowed_temp": "Device {id} ALLOWED (Temporary)",
        "msg_allowed_perm": "Device {id} ALLOWED (Permanent)",
        "msg_blocked": "Device {id} BLOCKED",
        "msg_history_cleared": "History cleared successfully.",
        "daemon_listening": "[Pequén] Pequén USB Daemon listening on session DBus ('org.pequen.USBGuard')...",
        "device_event": "[Pequén] Device event: ID={id}, Rule={rule}, Name='{name}'",
        "alert_title": "🦉 Pequén USB Alert!",
        "alert_body": "New USB device inserted: {name}\nWhat would you like to do?",
    },
}


def get_system_language() -> str:
    lang_env = os.environ.get("LANG") or os.environ.get("LC_ALL") or ""
    if lang_env.lower().startswith("en"):
        return "en"
    try:
        sys_loc, _ = locale.getdefaultlocale()
        if sys_loc and sys_loc.lower().startswith("en"):
            return "en"
    except Exception:
        pass
    return "es"


CURRENT_LANG: str = get_system_language()


def set_language(lang: str) -> None:
    global CURRENT_LANG
    if lang in TRANSLATIONS:
        CURRENT_LANG = lang


def t(key: str, lang: str | None = None, **kwargs: str | int) -> str:
    target_lang = lang or CURRENT_LANG
    lang_dict = TRANSLATIONS.get(target_lang, TRANSLATIONS["es"])
    template = lang_dict.get(key, TRANSLATIONS["es"].get(key, key))
    if kwargs:
        return template.format(**kwargs)
    return template
