import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { _tr } from './i18n.js';

const PequenDBusIface = `
<node>
  <interface name="org.pequen.USBGuard">
    <method name="GetDevices">
      <arg type="s" direction="out"/>
    </method>
    <method name="ApplyPolicy">
      <arg type="i" direction="in"/>
      <arg type="s" direction="in"/>
      <arg type="b" direction="in"/>
      <arg type="b" direction="out"/>
    </method>
    <method name="GetConfig">
      <arg type="s" direction="out"/>
    </method>
    <method name="TogglePin">
      <arg type="s" direction="in"/>
      <arg type="b" direction="out"/>
    </method>
  </interface>
</node>`;

const PequenProxy = Gio.DBusProxy.makeProxyWrapper(PequenDBusIface);

export default class PequenUSBPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._proxy = new PequenProxy(
            Gio.DBus.session,
            'org.pequen.USBGuard',
            '/org/pequen/USBGuard',
            (proxy, error) => {
                if (error) {
                    console.error('[Pequén USB Prefs] DBus error:', error.message);
                    return;
                }
                this._buildUI(window, proxy);
            }
        );
    }

    _buildUI(window, proxy) {
        proxy.GetDevicesRemote((result, error) => {
            let devices = [];
            if (!error && result) {
                try {
                    devices = JSON.parse(result[0]);
                } catch (e) {
                    console.error('[Pequén USB Prefs] JSON parse error:', e);
                }
            }

            // 💾 PESTAÑA 1: Dispositivos Extraíbles (Pendrives / Discos Duros)
            let storagePage = new Adw.PreferencesPage({
                title: _tr('tab_storage', {}, 'Extraíbles'),
                icon_name: 'drive-removable-media-symbolic',
            });
            let storageGroup = new Adw.PreferencesGroup({
                title: _tr('group_storage_title', {}, 'Pendrives y Discos Externos'),
                description: _tr('group_storage_desc', {}, 'Dispositivos de almacenamiento detectados. Puedes activar/desactivar el acceso rápidamente.'),
            });
            storagePage.add(storageGroup);

            // 💻 PESTAÑA 2: Dispositivos del Sistema e Internos
            let systemPage = new Adw.PreferencesPage({
                title: _tr('tab_system', {}, 'Sistema'),
                icon_name: 'computer-symbolic',
            });
            let systemGroup = new Adw.PreferencesGroup({
                title: _tr('group_system_title', {}, 'Hubs Internos y Hardware de Sistema'),
                description: _tr('group_system_desc', {}, 'Concentradores USB, Bluetooth integrado, cámaras web e interfaces internas.'),
            });
            systemPage.add(systemGroup);

            // ⚡ PESTAÑA 3: Accesos Rápidos y Configuración
            let configPage = new Adw.PreferencesPage({
                title: _tr('tab_quick_access', {}, 'Accesos Rápidos'),
                icon_name: 'emblem-favorite-symbolic',
            });
            let configGroup = new Adw.PreferencesGroup({
                title: _tr('group_quick_title', {}, 'Configuración del Menú de Barra Superior'),
                description: _tr('group_quick_desc', {}, 'Elige qué dispositivos aparecen fijados directamente en el menú rápido desplegable.'),
            });
            configPage.add(configGroup);

            let storageCount = 0;
            let systemCount = 0;

            devices.forEach(dev => {
                let row = new Adw.ActionRow({
                    title: `${dev.name}`,
                    subtitle: `ID: ${dev.id} | Puerto: ${dev.via_port || 'Local'}`,
                });

                // Toggle Policy Switch (Allow/Block)
                let policySwitch = new Gtk.Switch({
                    active: dev.is_allowed,
                    valign: Gtk.Align.CENTER,
                });
                policySwitch.connect('state-set', (sw, state) => {
                    let action = state ? 'allow' : 'block';
                    proxy.ApplyPolicyRemote(dev.number, action, true, (res, err) => {
                        if (err) console.error('[Pequén USB Prefs] ApplyPolicy error:', err);
                    });
                    return false;
                });
                row.add_suffix(policySwitch);

                // Pin / Unpin Quick Access Toggle Button
                let pinBtn = new Gtk.ToggleButton({
                    icon_name: dev.is_pinned ? 'emblem-favorite-symbolic' : 'non-starred-symbolic',
                    active: dev.is_pinned,
                    valign: Gtk.Align.CENTER,
                    tooltip_text: _tr('tooltip_pin', {}, 'Fijar en menú rápido'),
                });
                pinBtn.connect('toggled', (btn) => {
                    proxy.TogglePinRemote(String(dev.number), (res, err) => {
                        if (!err) {
                            btn.set_icon_name(btn.active ? 'emblem-favorite-symbolic' : 'non-starred-symbolic');
                        }
                    });
                });
                row.add_suffix(pinBtn);

                if (dev.category === 'system') {
                    systemGroup.add(row);
                    systemCount++;
                } else {
                    storageGroup.add(row);
                    storageCount++;
                }
            });

            if (storageCount === 0) {
                let emptyRow = new Adw.ActionRow({
                    title: _tr('no_storage_devs', {}, 'No hay pendrives ni discos externos conectados actualmente'),
                });
                storageGroup.add(emptyRow);
            }

            if (systemCount === 0) {
                let emptyRow = new Adw.ActionRow({
                    title: _tr('no_system_devs', {}, 'No hay dispositivos de sistema detectados'),
                });
                systemGroup.add(emptyRow);
            }

            window.add(storagePage);
            window.add(systemPage);
            window.add(configPage);
        });
    }
}
