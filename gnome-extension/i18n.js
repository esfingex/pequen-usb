import GLib from 'gi://GLib';

const TRANSLATIONS = {
    es: {
        title: '🦉 Pequén USB Sentinel',
        connected_devices: 'Dispositivos USB Conectados',
        no_devices: 'No hay pendrives ni discos externos conectados',
        history: '📜 Historial de Conexiones',
        no_history: 'Sin registros recientes de historial',
        refresh: '🔄 Recargar Dispositivos',
        allow_perm: '🟢 Permitir (Permanente)',
        allow_temp: '🟡 Permitir (Temporal)',
        block: '🔴 Bloquear',
        status_perm: 'Permitido (Permanente)',
        status_temp: 'Permitido (Temporal)',
        status_blocked: 'Bloqueado',
        alert_title: '🦉 ¡Pequén USB Alerta!',
        alert_body: 'Se ha insertado un nuevo USB: {name}',
        notify_policy: 'Dispositivo {id} -> {action} ({type})',
        more_settings: '⚙️ Más Ajustes...',
        tab_storage: 'Extraíbles',
        tab_system: 'Sistema',
        tab_quick_access: 'Accesos Rápidos',
        group_storage_title: 'Pendrives y Discos Externos',
        group_storage_desc: 'Dispositivos de almacenamiento detectados. Puedes activar/desactivar el acceso rápidamente.',
        group_system_title: 'Hubs Internos y Hardware de Sistema',
        group_system_desc: 'Concentradores USB, Bluetooth integrado, cámaras web e interfaces internas.',
        group_quick_title: 'Configuración del Menú de Barra Superior',
        group_quick_desc: 'Elige qué dispositivos aparecen fijados directamente en el menú rápido desplegable.',
        no_storage_devs: 'No hay pendrives ni discos externos conectados actualmente',
        no_system_devs: 'No hay dispositivos de sistema detectados',
        tooltip_pin: 'Fijar en menú rápido',
    },
    en: {
        title: '🦉 Pequén USB Sentinel',
        connected_devices: 'Connected USB Devices',
        no_devices: 'No removable USB drives connected',
        history: '📜 Connection History',
        no_history: 'No recent history records',
        refresh: '🔄 Reload Devices',
        allow_perm: '🟢 Allow (Permanent)',
        allow_temp: '🟡 Allow (Temporary)',
        block: '🔴 Block',
        status_perm: 'Allowed (Permanent)',
        status_temp: 'Allowed (Temporary)',
        status_blocked: 'Blocked',
        alert_title: '🦉 Pequén USB Alert!',
        alert_body: 'New USB device inserted: {name}',
        notify_policy: 'Device {id} -> {action} ({type})',
        more_settings: '⚙️ More Settings...',
        tab_storage: 'Removable',
        tab_system: 'System',
        tab_quick_access: 'Quick Access',
        group_storage_title: 'Pendrives & External Disks',
        group_storage_desc: 'Detected removable storage devices. Toggle access status quickly.',
        group_system_title: 'Internal Hubs & System Hardware',
        group_system_desc: 'Root USB hubs, integrated Bluetooth, webcams, and internal motherboard interfaces.',
        group_quick_title: 'Top Bar Menu Configuration',
        group_quick_desc: 'Choose which devices are pinned directly to the quick access top bar menu.',
        no_storage_devs: 'No removable drives currently connected',
        no_system_devs: 'No system devices detected',
        tooltip_pin: 'Pin to quick menu',
    }
};

export function getSystemLanguage() {
    try {
        const languages = GLib.get_language_names();
        for (let lang of languages) {
            if (lang.toLowerCase().startsWith('en')) {
                return 'en';
            }
        }
    } catch (e) {
        console.error('[Pequén USB i18n] Error getting language names:', e);
    }
    return 'es';
}

const currentLang = getSystemLanguage();

export function _tr(key, vars = {}, fallback = '') {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
    let template = dict[key] || TRANSLATIONS.es[key] || fallback || key;
    for (const [k, v] of Object.entries(vars)) {
        template = template.replace(`{${k}}`, v);
    }
    return template;
}
