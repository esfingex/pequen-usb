import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

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
    <method name="TogglePin">
      <arg type="s" direction="in"/>
      <arg type="b" direction="out"/>
    </method>
  </interface>
</node>`;

export default class PequenUSBPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        // 💾 PESTAÑA 1: Dispositivos Extraíbles (Pendrives / Discos Duros)
        const storagePage = new Adw.PreferencesPage({
            title: _('Extraíbles'),
            icon_name: 'drive-removable-media-symbolic',
        });
        const storageGroup = new Adw.PreferencesGroup({
            title: _('Pendrives y Discos Externos'),
            description: _('Dispositivos de almacenamiento extraíble detectados.'),
        });
        storagePage.add(storageGroup);

        // 💻 PESTAÑA 2: Dispositivos del Sistema e Internos
        const systemPage = new Adw.PreferencesPage({
            title: _('Sistema'),
            icon_name: 'computer-symbolic',
        });
        const systemGroup = new Adw.PreferencesGroup({
            title: _('Hardware de Sistema e Hubs'),
            description: _('Concentradores USB, Bluetooth integrado, cámaras web e interfaces internas.'),
        });
        systemPage.add(systemGroup);

        // ⚡ PESTAÑA 3: Opciones y Accesos Rápidos
        const configPage = new Adw.PreferencesPage({
            title: _('Ajustes'),
            icon_name: 'emblem-system-symbolic',
        });
        const configGroup = new Adw.PreferencesGroup({
            title: _('Opciones del Menú Desplegable'),
            description: _('Ajustar la visibilidad y comportamiento del centinela Pequén USB.'),
        });

        const rowSystemMenu = new Adw.SwitchRow({
            title: _('Mostrar Dispositivos de Sistema en Menú Rápido'),
            subtitle: _('Muestra hubs internos y hardware del sistema directamente en la barra superior'),
        });
        const rowNotify = new Adw.SwitchRow({
            title: _('Notificar al Insertar Dispositivos'),
            subtitle: _('Mostrar alertas emergentes al conectar nuevos USBs'),
        });

        configGroup.add(rowSystemMenu);
        configGroup.add(rowNotify);
        configPage.add(configGroup);

        window._settings.bind('show-system-devices', rowSystemMenu, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('notify-on-insert', rowNotify, 'active', Gio.SettingsBindFlags.DEFAULT);

        window.add(storagePage);
        window.add(systemPage);
        window.add(configPage);

        // DBus Async Fetch for live device rows
        const PequenProxy = Gio.DBusProxy.makeProxyWrapper(PequenDBusIface);
        const proxy = new PequenProxy(
            Gio.DBus.session,
            'org.pequen.USBGuard',
            '/org/pequen/USBGuard',
            (p, error) => {
                if (error) {
                    console.error('[Pequén USB Prefs] DBus error:', error.message);
                    return;
                }
                this._loadLiveDevices(proxy, storageGroup, systemGroup);
            }
        );
    }

    _loadLiveDevices(proxy, storageGroup, systemGroup) {
        proxy.GetDevicesRemote((result, error) => {
            if (error || !result) return;
            let devices = [];
            try {
                devices = JSON.parse(result[0]);
            } catch (e) {
                return;
            }

            let storageCount = 0;
            let systemCount = 0;

            devices.forEach(dev => {
                const row = new Adw.SwitchRow({
                    title: dev.name,
                    subtitle: `ID: ${dev.id} | Puerto: ${dev.via_port || 'Local'}`,
                    active: dev.is_allowed,
                });

                row.connect('notify::active', (sw) => {
                    const action = sw.active ? 'allow' : 'block';
                    proxy.ApplyPolicyRemote(dev.number, action, true, (res, err) => {
                        if (err) console.error('[Pequén USB Prefs] ApplyPolicy error:', err);
                    });
                });

                const pinBtn = new Gtk.ToggleButton({
                    icon_name: dev.is_pinned ? 'emblem-favorite-symbolic' : 'non-starred-symbolic',
                    active: dev.is_pinned,
                    valign: Gtk.Align.CENTER,
                    tooltip_text: _('Fijar en menú rápido'),
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
                storageGroup.add(new Adw.ActionRow({
                    title: _('No hay pendrives ni discos externos conectados actualmente'),
                }));
            }

            if (systemCount === 0) {
                systemGroup.add(new Adw.ActionRow({
                    title: _('No hay dispositivos de sistema detectados'),
                }));
            }
        });
    }
}
