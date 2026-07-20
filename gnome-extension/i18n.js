import GLib from 'gi://GLib';

const TRANSLATIONS = {
    es: {
        title: '🦉 Pequén USB Sentinel',
        connected_devices: 'Dispositivos USB Conectados',
        no_devices: 'No hay dispositivos USB conectados',
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
    },
    en: {
        title: '🦉 Pequén USB Sentinel',
        connected_devices: 'Connected USB Devices',
        no_devices: 'No USB devices connected',
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

export function _tr(key, vars = {}) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
    let template = dict[key] || TRANSLATIONS.es[key] || key;
    for (const [k, v] of Object.entries(vars)) {
        template = template.replace(`{${k}}`, v);
    }
    return template;
}
