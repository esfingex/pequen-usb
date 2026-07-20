import * as Extension from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Gio from 'gi://Gio';

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

const PequenProxy = Gio.DBusProxy.makeProxyWrapper(PequenDBusIface);

export default class PequenUSBExtension extends Extension.Extension {
    enable() {
        console.log('[Pequén USB] Enabling GNOME Shell Extension...');
        this._indicator = new PanelMenu.Button(0.0, 'Pequén USB', false);

        // Icon
        this._icon = new St.Icon({
            icon_name: 'drive-removable-media-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(this._icon);

        // Top bar menu title
        let titleItem = new PopupMenu.PopupMenuItem('🦉 Pequén USB Sentinel', { reactive: false });
        titleItem.label.clutter_text.set_markup('<b>🦉 Pequén USB Sentinel</b>');
        this._indicator.menu.addMenuItem(titleItem);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Devices Section
        this._devicesSection = new PopupMenu.PopupMenuSection();
        this._indicator.menu.addMenuItem(this._devicesSection);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // History MenuItem
        let historyItem = new PopupMenu.PopupMenuItem('📜 Historial Reciente');
        historyItem.connect('activate', () => this._showHistoryDialog());
        this._indicator.menu.addMenuItem(historyItem);

        // Refresh MenuItem
        let refreshItem = new PopupMenu.PopupMenuItem('🔄 Recargar Dispositivos');
        refreshItem.connect('activate', () => this._refreshDevices());
        this._indicator.menu.addMenuItem(refreshItem);

        Main.panel.addToStatusArea('pequen-usb', this._indicator);

        // DBus Client Init
        try {
            this._proxy = new PequenProxy(
                Gio.DBus.session,
                'org.pequen.USBGuard',
                '/org/pequen/USBGuard',
                (proxy, error) => {
                    if (error) {
                        console.error('[Pequén USB] DBus connection error:', error.message);
                        return;
                    }
                    this._onProxyReady();
                }
            );
        } catch (e) {
            console.error('[Pequén USB] Proxy error:', e);
        }
    }

    _onProxyReady() {
        this._signalId = this._proxy.connectSignal('DeviceInserted', (proxy, sender, [devId, name, detailsJson]) => {
            this._notifyDeviceInserted(devId, name, detailsJson);
            this._refreshDevices();
        });

        this._refreshDevices();
    }

    _refreshDevices() {
        if (!this._proxy) return;
        this._proxy.GetDevicesRemote((result, error) => {
            if (error) {
                console.error('[Pequén USB] Error fetching devices:', error.message);
                return;
            }
            let [jsonStr] = result;
            let devices = JSON.parse(jsonStr);
            this._updateMenuDevices(devices);
        });
    }

    _updateMenuDevices(devices) {
        this._devicesSection.removeAll();

        if (devices.length === 0) {
            let emptyItem = new PopupMenu.PopupMenuItem('No hay dispositivos USB conectados', { reactive: false });
            this._devicesSection.addMenuItem(emptyItem);
            return;
        }

        devices.forEach(dev => {
            let statusIcon = dev.is_allowed ? '🟢' : '🔴';
            let labelText = `${statusIcon} ${dev.name} [${dev.id}]`;
            let menuItem = new PopupMenu.PopupSubMenuMenuItem(labelText);

            let allowPermItem = new PopupMenu.PopupMenuItem('🟢 Permitir Permanente');
            allowPermItem.connect('activate', () => this._applyPolicy(dev.number, 'allow', true));
            menuItem.menu.addMenuItem(allowPermItem);

            let allowTempItem = new PopupMenu.PopupMenuItem('🟡 Permitir Temporal');
            allowTempItem.connect('activate', () => this._applyPolicy(dev.number, 'allow', false));
            menuItem.menu.addMenuItem(allowTempItem);

            let blockItem = new PopupMenu.PopupMenuItem('🔴 Bloquear');
            blockItem.connect('activate', () => this._applyPolicy(dev.number, 'block', false));
            menuItem.menu.addMenuItem(blockItem);

            this._devicesSection.addMenuItem(menuItem);
        });
    }

    _applyPolicy(devId, action, permanent) {
        if (!this._proxy) return;
        this._proxy.ApplyPolicyRemote(devId, action, permanent, (result, error) => {
            if (error) {
                console.error('[Pequén USB] Error applying policy:', error.message);
                return;
            }
            Main.notify('Pequén USB Sentinel', `Dispositivo ${devId} -> ${action.toUpperCase()} (${permanent ? 'Permanente' : 'Temporal'})`);
            this._refreshDevices();
        });
    }

    _notifyDeviceInserted(devId, name, detailsJson) {
        let title = '🦉 ¡Pequén USB Alerta!';
        let body = `Se ha insertado un nuevo USB: ${name}\n¿Qué deseas hacer?`;
        Main.notify(title, body);
    }

    _showHistoryDialog() {
        if (!this._proxy) return;
        this._proxy.GetHistoryRemote(15, (result, error) => {
            if (error) return;
            let [jsonStr] = result;
            let records = JSON.parse(jsonStr);
            let historyText = records.map(r => `• ${r.timestamp.substring(11,19)} - ${r.name}: ${r.action_taken.toUpperCase()}`).join('\n');
            Main.notify('📜 Historial Pequén USB', historyText || 'Sin registros recientes');
        });
    }

    disable() {
        console.log('[Pequén USB] Disabling GNOME Shell Extension...');
        if (this._signalId && this._proxy) {
            this._proxy.disconnectSignal(this._signalId);
        }
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
