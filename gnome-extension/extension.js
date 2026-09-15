import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const PequenDBusIface = `
<node>
  <interface name="org.pequen.USBGuard">
    <method name="GetDevices">
      <arg type="s" direction="out"/>
    </method>
    <method name="GetHistory">
      <arg type="i" direction="in"/>
      <arg type="s" direction="out"/>
    </method>
    <method name="ApplyPolicy">
      <arg type="i" direction="in"/>
      <arg type="s" direction="in"/>
      <arg type="b" direction="in"/>
      <arg type="b" direction="out"/>
    </method>
    <method name="RemountReadWrite">
      <arg type="s" direction="in"/>
      <arg type="b" direction="out"/>
      <arg type="s" direction="out"/>
    </method>
    <method name="UnmountDevice">
      <arg type="s" direction="in"/>
      <arg type="b" direction="out"/>
      <arg type="s" direction="out"/>
    </method>
    <signal name="DeviceInserted">
      <arg type="i" name="device_id"/>
      <arg type="s" name="name"/>
      <arg type="s" name="details_json"/>
    </signal>
    <signal name="DevicePolicyChanged">
      <arg type="i" name="device_id"/>
      <arg type="s" name="action"/>
      <arg type="b" name="permanent"/>
    </signal>
  </interface>
</node>`;

export default class PequenUSBExtension extends Extension {
    enable() {
        this._indicator = new PanelMenu.Button(0.0, 'Pequén USB', false);

        // Icon
        this._icon = new St.Icon({
            icon_name: 'drive-removable-media-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(this._icon);

        // Title Header
        let titleText = _('🦉 Pequén USB Sentinel');
        let titleItem = new PopupMenu.PopupMenuItem(titleText, { reactive: false });
        titleItem.label.clutter_text.set_markup(`<b>${titleText}</b>`);
        this._indicator.menu.addMenuItem(titleItem);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Quick Access Devices Section (Removable Storage & Pinned)
        this._devicesSection = new PopupMenu.PopupMenuSection();
        this._indicator.menu.addMenuItem(this._devicesSection);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Interactive History SubMenu
        this._historySubMenu = new PopupMenu.PopupSubMenuMenuItem(_('📜 Historial de Conexiones'));
        this._indicator.menu.addMenuItem(this._historySubMenu);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Refresh MenuItem
        let refreshItem = new PopupMenu.PopupMenuItem(_('🔄 Recargar Dispositivos'));
        refreshItem.connectObject('activate', () => this._refreshAll(), this);
        this._indicator.menu.addMenuItem(refreshItem);

        // Settings / Preferences Window MenuItem
        let prefsItem = new PopupMenu.PopupMenuItem(_('⚙️ Más Ajustes...'));
        prefsItem.connectObject('activate', () => this.openPreferences(), this);
        this._indicator.menu.addMenuItem(prefsItem);

        Main.panel.addToStatusArea('pequen-usb', this._indicator);

        // DBus Client Init inside enable() scope
        const PequenProxy = Gio.DBusProxy.makeProxyWrapper(PequenDBusIface);
        this._proxy = new PequenProxy(
            Gio.DBus.session,
            'org.pequen.USBGuard',
            '/org/pequen/USBGuard',
            (proxy, error) => {
                if (error) {
                    console.error(`[Pequén USB] DBus proxy error: ${error.message}`);
                    return;
                }
                this._onProxyReady();
            }
        );
    }

    _onProxyReady() {
        if (!this._proxy) return;
        this._proxy.connectObject(
            'DeviceInserted',
            (proxy, sender, [devId, name, detailsJson]) => {
                this._notifyDeviceInserted(devId, name, detailsJson);
                this._refreshAll();
            },
            this
        );

        this._refreshAll();
    }

    _refreshAll() {
        this._refreshDevices();
        this._refreshHistory();
    }

    _refreshDevices() {
        if (!this._proxy) return;
        this._proxy.GetDevicesRemote((result, error) => {
            if (error || !result) return;
            let [jsonStr] = result;
            let devices = JSON.parse(jsonStr);
            this._updateMenuDevices(devices);
        });
    }

    _mountBadge(dev) {
        if (!dev.is_mounted) return '⏏️';
        return dev.is_read_only ? '🔒' : '🔓';
    }

    _mountLabel(dev) {
        if (!dev.is_mounted) return _('No montado');
        return dev.is_read_only ? _('Solo lectura') : _('Lectura/Escritura');
    }

    _updateMenuDevices(devices) {
        this._devicesSection.removeAll();

        let quickAccessDevices = devices.filter(dev => dev.category === 'storage' || dev.is_pinned);

        if (quickAccessDevices.length === 0) {
            let emptyItem = new PopupMenu.PopupMenuItem(_('No hay pendrives ni discos externos conectados'), { reactive: false });
            this._devicesSection.addMenuItem(emptyItem);
            return;
        }

        quickAccessDevices.forEach(dev => {
            // USBGuard permission badge
            let permBadge = dev.is_allowed
                ? (dev.is_permanent ? `🟢` : `🟡`)
                : `🔴`;

            // Mount status badge
            let mntBadge = this._mountBadge(dev);

            let labelText = `${permBadge} ${mntBadge}  ${dev.name}`;
            let menuItem = new PopupMenu.PopupSubMenuMenuItem(labelText);

            // --- Mount status line (non-reactive info) ---
            let mountStatusText = dev.is_allowed
                ? `   ${_('Montaje')}: ${this._mountLabel(dev)}`
                : `   ${_('Bloqueado por USBGuard')}`;
            let mountStatusItem = new PopupMenu.PopupMenuItem(mountStatusText, { reactive: false });
            mountStatusItem.label.clutter_text.set_markup(
                `<small><i>${mountStatusText.trim()}</i></small>`
            );
            menuItem.menu.addMenuItem(mountStatusItem);

            menuItem.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // --- Open in Files (Nautilus) ---
            if (dev.is_mounted && dev.mount_point) {
                let openItem = new PopupMenu.PopupMenuItem(_('📂 Abrir en Archivos'));
                openItem.connectObject('activate', () => {
                    try {
                        GLib.spawn_command_line_async(`xdg-open "${dev.mount_point}"`);
                    } catch (e) {
                        console.error(`[Pequén USB] Error opening file manager: ${e}`);
                    }
                }, this);
                menuItem.menu.addMenuItem(openItem);
            }

            // --- Remount as RW ---
            if (dev.is_mounted && dev.is_read_only && dev.mount_point) {
                let remountItem = new PopupMenu.PopupMenuItem(_('🔓 Remontar como Lectura/Escritura'));
                remountItem.connectObject('activate', () => {
                    this._remountReadWrite(dev);
                }, this);
                menuItem.menu.addMenuItem(remountItem);
            }

            // --- Unmount ---
            if (dev.is_mounted && dev.mount_point) {
                let unmountItem = new PopupMenu.PopupMenuItem(_('⏏️ Desmontar'));
                unmountItem.connectObject('activate', () => {
                    this._unmountDevice(dev);
                }, this);
                menuItem.menu.addMenuItem(unmountItem);
            }

            menuItem.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // --- USBGuard policy actions ---
            let allowPermItem = new PopupMenu.PopupMenuItem(_('🟢 Permitir (Permanente)'));
            allowPermItem.connectObject('activate', () => this._applyPolicy(dev.number, 'allow', true), this);
            menuItem.menu.addMenuItem(allowPermItem);

            let allowTempItem = new PopupMenu.PopupMenuItem(_('🟡 Permitir (Temporal)'));
            allowTempItem.connectObject('activate', () => this._applyPolicy(dev.number, 'allow', false), this);
            menuItem.menu.addMenuItem(allowTempItem);

            let blockItem = new PopupMenu.PopupMenuItem(_('🔴 Bloquear'));
            blockItem.connectObject('activate', () => this._applyPolicy(dev.number, 'block', false), this);
            menuItem.menu.addMenuItem(blockItem);

            this._devicesSection.addMenuItem(menuItem);
        });
    }

    _refreshHistory() {
        if (!this._proxy) return;
        this._proxy.GetHistoryRemote(15, (result, error) => {
            if (error || !result) return;
            let [jsonStr] = result;
            let records = JSON.parse(jsonStr);
            this._updateHistorySubMenu(records);
        });
    }

    _updateHistorySubMenu(records) {
        this._historySubMenu.menu.removeAll();

        if (!records || records.length === 0) {
            let emptyItem = new PopupMenu.PopupMenuItem(_('Sin registros recientes de historial'), { reactive: false });
            this._historySubMenu.menu.addMenuItem(emptyItem);
            return;
        }

        records.forEach(r => {
            let timeStr = r.timestamp ? r.timestamp.substring(11, 19) : '';
            let actionBadge = r.action_taken === 'allow'
                ? (r.permanent ? '🟢 Perm' : '🟡 Temp')
                : '🔴 Block';

            let lineText = `[${timeStr}] ${r.name} - ${actionBadge}`;
            let histItem = new PopupMenu.PopupSubMenuMenuItem(lineText);

            let devId = parseInt(r.device_id, 10);
            if (!isNaN(devId)) {
                let allowPermItem = new PopupMenu.PopupMenuItem(_('🟢 Permitir (Permanente)'));
                allowPermItem.connectObject('activate', () => this._applyPolicy(devId, 'allow', true), this);
                histItem.menu.addMenuItem(allowPermItem);

                let allowTempItem = new PopupMenu.PopupMenuItem(_('🟡 Permitir (Temporal)'));
                allowTempItem.connectObject('activate', () => this._applyPolicy(devId, 'allow', false), this);
                histItem.menu.addMenuItem(allowTempItem);

                let blockItem = new PopupMenu.PopupMenuItem(_('🔴 Bloquear'));
                blockItem.connectObject('activate', () => this._applyPolicy(devId, 'block', false), this);
                histItem.menu.addMenuItem(blockItem);
            }

            this._historySubMenu.menu.addMenuItem(histItem);
        });
    }

    _applyPolicy(devId, action, permanent) {
        if (!this._proxy) return;
        this._proxy.ApplyPolicyRemote(devId, action, permanent, (result, error) => {
            if (error) return;
            let typeLabel = permanent ? _('Permitido (Permanente)') : _('Permitido (Temporal)');
            Main.notify(_('🦉 Pequén USB Sentinel'), `Dispositivo ${devId} -> ${action.toUpperCase()} (${typeLabel})`);
            this._refreshAll();
        });
    }

    _remountReadWrite(dev) {
        if (!this._proxy) return;
        this._proxy.RemountReadWriteRemote(dev.mount_point, (result, error) => {
            if (error) {
                Main.notify(_('🦉 Pequén USB'), `Error al remontar: ${error.message}`);
                return;
            }
            let [success, msg] = result;
            if (success) {
                Main.notify(_('🦉 Pequén USB'), `✅ ${dev.name} remontado en Lectura/Escritura`);
            } else {
                Main.notify(_('🦉 Pequén USB'), `⚠️ No se pudo remontar: ${msg}`);
            }
            this._refreshAll();
        });
    }

    _unmountDevice(dev) {
        if (!this._proxy) return;
        this._proxy.UnmountDeviceRemote(dev.mount_point, (result, error) => {
            if (error) {
                Main.notify(_('🦉 Pequén USB'), `Error al desmontar: ${error.message}`);
                return;
            }
            let [success, msg] = result;
            if (success) {
                Main.notify(_('🦉 Pequén USB'), `✅ ${dev.name} desmontado correctamente`);
            } else {
                Main.notify(_('🦉 Pequén USB'), `⚠️ No se pudo desmontar: ${msg}`);
            }
            this._refreshAll();
        });
    }

    _notifyDeviceInserted(devId, name, _detailsJson) {
        let title = _('🦉 ¡Pequén USB Alerta!');
        let body = `Se ha insertado un nuevo USB: ${name}`;
        Main.notify(title, body);
    }

    disable() {
        if (this._proxy) {
            this._proxy.disconnectObject(this);
            this._proxy = null;
        }

        if (this._indicator) {
            this._indicator.disconnectObject(this);
        }

        if (this._devicesSection) {
            this._devicesSection.destroy();
            this._devicesSection = null;
        }
        if (this._historySubMenu) {
            this._historySubMenu.destroy();
            this._historySubMenu = null;
        }
        if (this._icon) {
            this._icon.destroy();
            this._icon = null;
        }
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
