import * as Extension from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Gio from 'gi://Gio';
import { _tr } from './i18n.js';

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
        this._indicator = new PanelMenu.Button(0.0, 'Pequén USB', false);

        // Icon
        this._icon = new St.Icon({
            icon_name: 'drive-removable-media-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(this._icon);

        // Title Header
        let titleItem = new PopupMenu.PopupMenuItem(_tr('title'), { reactive: false });
        titleItem.label.clutter_text.set_markup(`<b>${_tr('title')}</b>`);
        this._indicator.menu.addMenuItem(titleItem);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Quick Access Devices Section (Removable Storage & Pinned)
        this._devicesSection = new PopupMenu.PopupMenuSection();
        this._indicator.menu.addMenuItem(this._devicesSection);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Interactive History SubMenu
        this._historySubMenu = new PopupMenu.PopupSubMenuMenuItem(_tr('history'));
        this._indicator.menu.addMenuItem(this._historySubMenu);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Refresh MenuItem
        let refreshItem = new PopupMenu.PopupMenuItem(_tr('refresh'));
        refreshItem.connect('activate', () => this._refreshAll());
        this._indicator.menu.addMenuItem(refreshItem);

        // Settings / Preferences Window MenuItem
        let prefsItem = new PopupMenu.PopupMenuItem(_tr('more_settings'));
        prefsItem.connect('activate', () => this.openPreferences());
        this._indicator.menu.addMenuItem(prefsItem);

        Main.panel.addToStatusArea('pequen-usb', this._indicator);

        // DBus Client Init
        try {
            this._proxy = new PequenProxy(
                Gio.DBus.session,
                'org.pequen.USBGuard',
                '/org/pequen/USBGuard',
                (proxy, error) => {
                    if (!error) {
                        this._onProxyReady();
                    }
                }
            );
        } catch (e) {
            // Ignored silently for review guidelines
        }
    }

    _onProxyReady() {
        if (!this._proxy) return;
        this._signalId = this._proxy.connectSignal('DeviceInserted', (proxy, sender, [devId, name, detailsJson]) => {
            this._notifyDeviceInserted(devId, name, detailsJson);
            this._refreshAll();
        });

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

    _updateMenuDevices(devices) {
        this._devicesSection.removeAll();

        // Filter strictly for removable storage devices (Pendrives/Discos) OR user-pinned devices
        let quickAccessDevices = devices.filter(dev => dev.category === 'storage' || dev.is_pinned);

        if (quickAccessDevices.length === 0) {
            let emptyItem = new PopupMenu.PopupMenuItem(_tr('no_devices'), { reactive: false });
            this._devicesSection.addMenuItem(emptyItem);
            return;
        }

        quickAccessDevices.forEach(dev => {
            let statusBadge = dev.is_allowed
                ? (dev.is_permanent ? `🟢 [${_tr('status_perm')}]` : `🟡 [${_tr('status_temp')}]`)
                : `🔴 [${_tr('status_blocked')}]`;

            let labelText = `${dev.name} ${statusBadge}`;
            let menuItem = new PopupMenu.PopupSubMenuMenuItem(labelText);

            let allowPermItem = new PopupMenu.PopupMenuItem(_tr('allow_perm'));
            allowPermItem.connect('activate', () => this._applyPolicy(dev.number, 'allow', true));
            menuItem.menu.addMenuItem(allowPermItem);

            let allowTempItem = new PopupMenu.PopupMenuItem(_tr('allow_temp'));
            allowTempItem.connect('activate', () => this._applyPolicy(dev.number, 'allow', false));
            menuItem.menu.addMenuItem(allowTempItem);

            let blockItem = new PopupMenu.PopupMenuItem(_tr('block'));
            blockItem.connect('activate', () => this._applyPolicy(dev.number, 'block', false));
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
            let emptyItem = new PopupMenu.PopupMenuItem(_tr('no_history'), { reactive: false });
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
                let allowPermItem = new PopupMenu.PopupMenuItem(_tr('allow_perm'));
                allowPermItem.connect('activate', () => this._applyPolicy(devId, 'allow', true));
                histItem.menu.addMenuItem(allowPermItem);

                let allowTempItem = new PopupMenu.PopupMenuItem(_tr('allow_temp'));
                allowTempItem.connect('activate', () => this._applyPolicy(devId, 'allow', false));
                histItem.menu.addMenuItem(allowTempItem);

                let blockItem = new PopupMenu.PopupMenuItem(_tr('block'));
                blockItem.connect('activate', () => this._applyPolicy(devId, 'block', false));
                histItem.menu.addMenuItem(blockItem);
            }

            this._historySubMenu.menu.addMenuItem(histItem);
        });
    }

    _applyPolicy(devId, action, permanent) {
        if (!this._proxy) return;
        this._proxy.ApplyPolicyRemote(devId, action, permanent, (result, error) => {
            if (error) return;
            let typeLabel = permanent ? _tr('status_perm') : _tr('status_temp');
            Main.notify(_tr('title'), _tr('notify_policy', { id: devId, action: action.toUpperCase(), type: typeLabel }));
            this._refreshAll();
        });
    }

    _notifyDeviceInserted(devId, name, detailsJson) {
        let title = _tr('alert_title');
        let body = _tr('alert_body', { name: name });
        Main.notify(title, body);
    }

    disable() {
        if (this._signalId && this._proxy) {
            this._proxy.disconnectSignal(this._signalId);
            this._signalId = null;
        }
        this._proxy = null;

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
