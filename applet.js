/*
 * This file is part of estus-power@hhiruko.
 *
 * estus-power@hhiruko is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 2 of the License.
 *
 * This file incorporates code from the Cinnamon Project (https://github.com/linuxmint/cinnamon)
 * licensed under the GNU GPL v2.0.
 *
 * @hhiruko, 2025
 */

const Applet = imports.ui.applet;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Interfaces = imports.misc.interfaces
const Lang = imports.lang;
const St = imports.gi.St;
const Tooltips = imports.ui.tooltips;
const UPowerGlib = imports.gi.UPowerGlib;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Settings = imports.ui.settings;
const GLib = imports.gi.GLib;

const BrightnessBusName = "org.cinnamon.SettingsDaemon.Power.Screen";
const KeyboardBusName = "org.cinnamon.SettingsDaemon.Power.Keyboard";

const CSD_BACKLIGHT_NOT_SUPPORTED_CODE = 1;

const PANEL_EDIT_MODE_KEY = "panel-edit-mode";

const BATTERY_PNG_PATHS = {
    empty: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-empty.png",
    low: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-low.png",
    medium: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-medium.png",
    full: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-full.png",
    charging_empty: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-charging-empty.png",
    charging_low: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-charging-low.png",
    charging_medium: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-charging-medium.png",
    charging_full: GLib.get_home_dir() + "/.local/share/cinnamon/applets/estus-power@hhiruko/icons/battery-charging-full.png",
};

const {
    DeviceKind: UPDeviceKind,
    DeviceLevel: UPDeviceLevel,
    DeviceState: UPDeviceState,
    Device: UPDevice
} = UPowerGlib

const POWER_PROFILES = {
    "power-saver": _("Power Saver"),
    "balanced": _("Balanced"),
    "performance": _("Performance")
};

function deviceLevelToString(level) {
    switch (level) {
        case UPDeviceLevel.FULL:
            return _("Battery full");
        case UPDeviceLevel.HIGH:
            return _("Battery almost full");
        case UPDeviceLevel.NORMAL:
            return _("Battery good");
        case UPDeviceLevel.LOW:
            return _("Low battery");
        case UPDeviceLevel.CRITICAL:
            return _("Critically low battery");
        default:
            return _("Unknown");
    }
}

function deviceKindToString(kind) {
    switch (kind) {
        case UPDeviceKind.LINE_POWER:
            return _("AC adapter");
        case UPDeviceKind.BATTERY:
            return _("Laptop battery");
        case UPDeviceKind.UPS:
            return _("UPS");
        case UPDeviceKind.MONITOR:
            return _("Monitor");
        case UPDeviceKind.MOUSE:
            return _("Mouse");
        case UPDeviceKind.KEYBOARD:
            return _("Keyboard");
        case UPDeviceKind.PDA:
            return _("PDA");
        case UPDeviceKind.PHONE:
            return _("Cell phone");
        case UPDeviceKind.MEDIA_PLAYER:
            return _("Media player");
        case UPDeviceKind.TABLET:
            return _("Tablet");
        case UPDeviceKind.COMPUTER:
            return _("Computer");
        case UPDeviceKind.GAMING_INPUT:
            return _("Gaming input");
        case UPDeviceKind.PEN:
            return _("Pen");
        case UPDeviceKind.TOUCHPAD:
            return _("Touchpad");
        case UPDeviceKind.MODEM:
            return _("Modem");
        case UPDeviceKind.NETWORK:
            return _("Network");
        case UPDeviceKind.HEADSET:
            return _("Headset");
        case UPDeviceKind.SPEAKERS:
            return _("Speakers");
        case UPDeviceKind.HEADPHONES:
            return _("Headphones");
        case UPDeviceKind.VIDEO:
            return _("Video");
        case UPDeviceKind.OTHER_AUDIO:
            return _("Audio device");
        case UPDeviceKind.REMOTE_CONTROL:
            return _("Remote control");
        case UPDeviceKind.PRINTER:
            return _("Printer");
        case UPDeviceKind.SCANNER:
            return _("Scanner");
        case UPDeviceKind.CAMERA:
            return _("Camera");
        case UPDeviceKind.WEARABLE:
            return _("Wearable");
        case UPDeviceKind.TOY:
            return _("Toy");
        case UPDeviceKind.BLUETOOTH_GENERIC:
            return _("Bluetooth device");
        default: {
            try {
                return UPDevice.kind_to_string(kind).replaceAll("-", " ").capitalize();
            } catch {
                return _("Unknown");
            }
        }
    }
}

function deviceKindToIcon(kind, icon, percentage, state) {
    if (kind === UPDeviceKind.BATTERY) {
        let isCharging = state === UPDeviceState.CHARGING || state === UPDeviceState.FULLY_CHARGED;
        let prefix = isCharging ? "charging_" : "";
        
        if (percentage <= 10) {
            return BATTERY_PNG_PATHS[prefix + "empty"];
        } else if (percentage <= 30) {
            return BATTERY_PNG_PATHS[prefix + "low"];
        } else if (percentage <= 70) {
            return BATTERY_PNG_PATHS[prefix + "medium"];
        } else {
            return BATTERY_PNG_PATHS[prefix + "full"];
        }
    }
    
    // Return original icons for non-battery devices
    switch (kind) {
        case UPDeviceKind.MONITOR:
            return ("video-display");
        case UPDeviceKind.MOUSE:
            return ("input-mouse");
        case UPDeviceKind.KEYBOARD:
            return ("input-keyboard");
        case UPDeviceKind.PHONE:
        case UPDeviceKind.MEDIA_PLAYER:
            return ("phone-apple-iphone");
        case UPDeviceKind.TABLET:
            return ("input-tablet");
        case UPDeviceKind.COMPUTER:
            return ("computer");
        case UPDeviceKind.GAMING_INPUT:
            return ("input-gaming");
        case UPDeviceKind.TOUCHPAD:
            return ("input-touchpad");
        case UPDeviceKind.HEADSET:
            return ("audio-headset");
        case UPDeviceKind.SPEAKERS:
            return ("audio-speakers");
        case UPDeviceKind.HEADPHONES:
            return ("audio-headphones");
        case UPDeviceKind.PRINTER:
            return ("printer");
        case UPDeviceKind.SCANNER:
            return ("scanner");
        case UPDeviceKind.CAMERA:
            return ("camera-photo");
        default:
            if (icon) {
                return icon;
            }
            else {
                return ("battery-full");
            }
    }
}

function reportsPreciseLevels(battery_level) {
    return battery_level == UPDeviceLevel.NONE;
}

class DeviceItem extends PopupMenu.PopupBaseMenuItem {
    constructor(device, status, aliases) {
        super({ reactive: false });

        let [device_id, vendor, model, device_kind, icon, percentage, state, battery_level, time] = device;

        this._box = new St.BoxLayout({ style_class: 'popup-device-menu-item' });
        this._vbox = new St.BoxLayout({ style_class: 'popup-device-menu-item', vertical: true });

        let description = deviceKindToString(device_kind);
        if (vendor != "" || model != "") {
            description = "%s %s".format(vendor, model);
        }

        for (let i = 0; i < aliases.length; ++i) {
            let alias = aliases[i];
            try {
                let parts = alias.split(':=');
                if (parts[0] == device_id) {
                    description = parts[1];
                }
            }
            catch (e) {
                // ignore malformed aliases
                global.logError(alias);
            }
        }

        let statusLabel = null;

        if (battery_level == UPDeviceLevel.NONE) {
            this.label = new St.Label({ text: "%s %d%%".format(description, Math.round(percentage)) });
            statusLabel = new St.Label({ text: "%s".format(status), style_class: 'popup-inactive-menu-item' });
        } else {
            this.label = new St.Label({ text: "%s".format(description) });
            statusLabel = new St.Label({ text: "%s".format(deviceLevelToString(battery_level)), style_class: 'popup-inactive-menu-item' });
        }

        let device_icon = deviceKindToIcon(device_kind, icon, percentage, state);
        this._icon = new St.Icon({ 
            gicon: Gio.icon_new_for_string(device_icon), 
            icon_size: 16,
            icon_type: device_kind === UPDeviceKind.BATTERY ? St.IconType.FULLCOLOR : St.IconType.SYMBOLIC 
        });

        this._box.add_actor(this._icon);
        this._box.add_actor(this.label);

        this._vbox.add_actor(this._box);
        this._vbox.add_actor(statusLabel);

        this.addActor(this._vbox);
    }
}

class BrightnessSlider extends PopupMenu.PopupSliderMenuItem {
    constructor(applet, label, icon, busName, minimum_value) {
        super(0);
        this.actor.hide();

        this._applet = applet;
        this._seeking = false;
        this._minimum_value = minimum_value;
        this._step = .05;

        this.connect("drag-begin", Lang.bind(this, function () {
            this._seeking = true;
        }));
        this.connect("drag-end", Lang.bind(this, function () {
            this._seeking = false;
        }));

        this.icon = new St.Icon({ icon_name: icon, icon_type: St.IconType.SYMBOLIC, icon_size: 16 });
        this.removeActor(this._slider);
        this.addActor(this.icon, { span: 0 });
        this.addActor(this._slider, { span: -1, expand: true });

        this.label = label;
        this.tooltipText = label;
        this.tooltip = new Tooltips.Tooltip(this.actor, this.tooltipText);

        Interfaces.getDBusProxyAsync(busName, Lang.bind(this, function (proxy, error) {
            this._proxy = proxy;
            this._proxy.GetPercentageRemote(Lang.bind(this, this._dbusAcquired));
        }));
    }

    _dbusAcquired(b, error) {
        if (error)
            return;

        try {
            this._proxy.GetStepRemote((step, error) => {
                if (error != null) {
                    if (error.code != CSD_BACKLIGHT_NOT_SUPPORTED_CODE) {
                        global.logError(`Could not get backlight step for ${busName}: ${error.message}`);
                        return;
                    } else {
                        this._step = .05;
                    }
                }
                this._step = (step / 100);
            });
        } catch (e) {
            this._step = .05;
        }

        this._updateBrightnessLabel(b);
        this.setValue(b / 100);
        this.connect("value-changed", Lang.bind(this, this._sliderChanged));

        this.actor.show();

        this._proxy.connectSignal('Changed', Lang.bind(this, this._getBrightness));
        this._applet.menu.connect("open-state-changed", Lang.bind(this, this._getBrightnessForcedUpdate));
    }

    _sliderChanged(slider, value) {
        if (value < this._minimum_value) {
            value = this._minimum_value;
        }

        let i = this._minimum_value;
        let v = value;
        let step = this._step;

        while (i < 1.0) {
            if (v > (i + step)) {
                i = i + step;
                continue;
            }

            if (((i + step) - v) < (v - i)) {
                v = i + step;
            } else {
                v = i;
            }

            break;
        }

        this.setValue(v);

        this._setBrightness(Math.min(100, Math.round(v * 100)));
    }

    _getBrightness() {
        if (!this._seeking)
            this._getBrightnessForcedUpdate();
    }

    _getBrightnessForcedUpdate() {
        this._proxy.GetPercentageRemote(Lang.bind(this, function (b) {
            this._updateBrightnessLabel(b);
            this.setValue(b / 100);
        }));
    }

    _setBrightness(value) {
        this._proxy.SetPercentageRemote(value, Lang.bind(this, function (b) {
            this._updateBrightnessLabel(b);
        }));
    }

    _updateBrightnessLabel(value) {
        this.tooltipText = this.label;
        if (value)
            this.tooltipText += ": " + value + "%";

        this.tooltip.set_text(this.tooltipText);
        if (this._dragging)
            this.tooltip.show();
    }

    _onScrollEvent(actor, event) {
        let direction = event.get_scroll_direction();

        if (direction == Clutter.ScrollDirection.DOWN) {
            this._proxy.StepDownRemote(function () { });
        }
        else if (direction == Clutter.ScrollDirection.UP) {
            this._proxy.StepUpRemote(function () { });
        }

        this._slider.queue_repaint();
    }
}

class CinnamonPowerApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panel_height, instanceId) {
        super(orientation, panel_height, instanceId);

        this.setAllowedLayout(Applet.AllowedLayout.BOTH);

        this.metadata = metadata;

        this.settings = new Settings.AppletSettings(this, metadata.uuid, instanceId);

        Main.systrayManager.registerTrayIconReplacement("power", metadata.uuid);
        Main.systrayManager.registerTrayIconReplacement("battery", metadata.uuid);

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.aliases = global.settings.get_strv("device-aliases");

        this._deviceItems = [];
        this._devices = [];
        this._primaryDeviceId = null;
        this.panel_icon_name = '';

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.brightness = new BrightnessSlider(this, _("Brightness"), "display-brightness", BrightnessBusName, 0);
        this.keyboard = new BrightnessSlider(this, _("Keyboard backlight"), "keyboard-brightness", KeyboardBusName, 0);
        this.menu.addMenuItem(this.brightness);
        this.menu.addMenuItem(this.keyboard);

        try {
            let PowerProfilesInterface = `<node>
              <interface name="net.hadess.PowerProfiles">
                <property name="ActiveProfile" type="s" access="readwrite" />
                <property name="PerformanceDegraded" type="s" access="read" />
                <property name="Profiles" type="aa{sv}" access="read" />
                <property name="ActiveProfileHolds" type="aa{sv}" access="read" />
              </interface>
            </node>`;
            let PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(PowerProfilesInterface);
            this._profilesProxy = new PowerProfilesProxy(Gio.DBus.system, "net.hadess.PowerProfiles", "/net/hadess/PowerProfiles");
            if (!this._profilesProxy.Profiles) {
                let PowerProfilesInterface = `<node>
                  <interface name="org.freedesktop.UPower.PowerProfiles">
                    <property name="ActiveProfile" type="s" access="readwrite" />
                    <property name="PerformanceDegraded" type="s" access="read" />
                    <property name="Profiles" type="aa{sv}" access="read" />
                    <property name="ActiveProfileHolds" type="aa{sv}" access="read" />
                  </interface>
                </node>`;
                let PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(PowerProfilesInterface);
                this._profilesProxy = new PowerProfilesProxy(Gio.DBus.system, "org.freedesktop.UPower.PowerProfiles", "/org/freedesktop/UPower/PowerProfiles");
            }
        } catch {
           this._profilesProxy = null;
        }
        
        if (this._profilesProxy && this._profilesProxy.Profiles) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.contentSection = new PopupMenu.PopupMenuSection();

            this.ActiveProfile = this._profilesProxy.ActiveProfile;
            this.Profiles = this._profilesProxy.Profiles;

            this._proxyId = this._profilesProxy.connect("g-properties-changed", (proxy, changed, invalidated) => {
                for (let [changedProperty, changedValue] of Object.entries(changed.deepUnpack())) {
                    if (["ActiveProfile", "Profiles"].includes(changedProperty))
                        this[changedProperty] = changedValue.deepUnpack();
                    this._updateProfile();
                }
            });

            this._updateProfile();
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.menu.addSettingsAction(_("Power Settings"), 'power');

        this.actor.connect("scroll-event", Lang.bind(this, this._onScrollEvent));

        this._proxy = null;

        global.settings.connect('changed::' + PANEL_EDIT_MODE_KEY, Lang.bind(this, this._onPanelEditModeChanged));

        this.csd_power_watch_id = Gio.bus_watch_name(Gio.BusType.SESSION, "org.cinnamon.SettingsDaemon.Power", 0, (c, name) => {
            Interfaces.getDBusProxyAsync("org.cinnamon.SettingsDaemon.Power", Lang.bind(this, function (proxy, error) {
                Gio.bus_unwatch_name(this.csd_power_watch_id);
                this.csd_power_watch_id = 0;

                if (error) {
                    global.logError("Could not connect to csd-power", error.message);
                    return;
                }

                this._proxy = proxy;

                this._proxy.connect("g-properties-changed", Lang.bind(this, this._devicesChanged));
                global.settings.connect('changed::device-aliases', Lang.bind(this, this._on_device_aliases_changed));
                this.settings.bind("labelinfo", "labelinfo", this._devicesChanged);
                this.settings.bind("showmulti", "showmulti", this._devicesChanged);

                this._devicesChanged();
            }));
        }, null);

        this.set_show_label_in_vertical_panels(false);
    }

    _onPanelEditModeChanged() {
        if (global.settings.get_boolean(PANEL_EDIT_MODE_KEY)) {
            if (!this.actor.visible) {
                this.set_applet_icon_path(BATTERY_PNG_PATHS.full);
                this.set_applet_enabled(true);
            }
        }
        else {
            this._devicesChanged();
        }
    }

    _on_device_aliases_changed() {
        this.aliases = global.settings.get_strv("device-aliases");
        this._devicesChanged();
    }

    _onButtonPressEvent(actor, event) {
        if (event.get_button() === 2) {
            this.keyboard._proxy.ToggleRemote(function () { });
        }
        return Applet.Applet.prototype._onButtonPressEvent.call(this, actor, event);
    }

    on_applet_clicked(event) {
        this.menu.toggle();
    }

    _onScrollEvent(actor, event) {
        let direction = event.get_scroll_direction();
        if (direction == Clutter.ScrollDirection.UP) {
            this.brightness._proxy.StepUpRemote(function () { });
        } else if (direction == Clutter.ScrollDirection.DOWN) {
            this.brightness._proxy.StepDownRemote(function () { });
        }
        this.brightness._getBrightnessForcedUpdate();
    }

    _getDeviceStatus(device) {
        let status = "";
        let [device_id, vendor, model, device_kind, icon, percentage, state, battery_level, seconds] = device;

        let time = Math.round(seconds / 60);
        let minutes = time % 60;
        let hours = Math.floor(time / 60);

        if (state == UPDeviceState.UNKNOWN) {
            status = "";
        }
        else if (state == UPDeviceState.CHARGING) {
            if (time == 0) {
                status = _("Charging");
            }
            else if (time >= 60) {
                if (minutes == 0) {
                    status = ngettext("Charging - %d hour until fully charged", "Charging - %d hours until fully charged", hours).format(hours);
                }
                else {
                    let template = _("Charging - %d %s %d %s until fully charged");
                    status = template.format(hours, ngettext("hour", "hours", hours), minutes, ngettext("minute", "minutes", minutes));
                }
            }
            else {
                status = ngettext("Charging - %d minute until fully charged", "Charging - %d minutes until fully charged", minutes).format(minutes);
            }
        }
        else if (state == UPDeviceState.FULLY_CHARGED) {
            status = _("Fully charged");
        }
        else if (state == UPDeviceState.DISCHARGING) {
            if (time == 0) {
                status = _("Using battery power");
            }
            else if (time >= 60) {
                if (minutes == 0) {
                    status = ngettext("Using battery power - %d hour remaining", "Using battery power - %d hours remaining", hours).format(hours);
                }
                else {
                    let template = _("Using battery power - %d %s %d %s remaining");
                    status = template.format(hours, ngettext("hour", "hours", hours), minutes, ngettext("minute", "minutes", minutes));
                }
            }
            else {
                status = ngettext("Using battery power - %d minute remaining", "Using battery power - %d minutes remaining", minutes).format(minutes);
            }
        }
        else if (state == UPDeviceState.EMPTY) {
            status = _("Fully discharged");
        }
        else {
            status = _("Not charging");
        }

        return status;
    }

    on_panel_height_changed() {
        if (this._proxy)
            this._devicesChanged();
    }

    showDeviceInPanel(device) {
        let [device_id, vendor, model, device_kind, icon, percentage, state, battery_level, seconds] = device;
        let status = this._getDeviceStatus(device);
        this.set_applet_tooltip(status);
        let labelText = "";
        if (this.labelinfo == "nothing") {
            ;
        }
        else if (this.labelinfo == "time" && seconds != 0) {
            let time = Math.round(seconds / 60);
            let minutes = time % 60;
            let hours = Math.floor(time / 60);
            labelText = C_("time of battery remaining", "%d:%02d").format(hours, minutes);
        }
        else if (this.labelinfo == "percentage" || (this.labelinfo == "percentage_time" && seconds == 0)) {
            labelText = C_("percent of battery remaining", "%d%%").format(Math.round(percentage));
        }
        else if (this.labelinfo == "percentage_time") {
            let time = Math.round(seconds / 60);
            let minutes = Math.floor(time % 60);
            let hours = Math.floor(time / 60);
            labelText = C_("percent of battery remaining", "%d%%").format(Math.round(percentage)) + " (" +
                C_("time of battery remaining", "%d:%02d").format(hours, minutes) + ")";
        }
        this.set_applet_label(labelText);

        let selected_icon = deviceKindToIcon(device_kind, icon, percentage, state);
        if (this.panel_icon_name != selected_icon) {
            this.panel_icon_name = selected_icon;
            this.set_applet_icon_path(selected_icon);
            this._applet_icon.set_style_class_name('system-status-icon');
        }
    }

    _updateProfile() {
        this.contentSection.removeAll();

        for (let profileNum = 0; profileNum < this.Profiles.length; profileNum++) {
            let profileName = this.Profiles[profileNum].Profile.unpack();
            let item;
            if (profileName == this.ActiveProfile) {
                this.profileIndex = profileNum;
                item = new PopupMenu.PopupMenuItem(POWER_PROFILES[profileName], { style_class: 'popup-device-menu-item', reactive: false });
                item.setShowDot(true);
            } else {
                item = new PopupMenu.PopupMenuItem(POWER_PROFILES[profileName]);
                item.connect("activate", Lang.bind(this, function () {
                    this._changeProfile(profileName);
                    this.menu.toggle();
                }));
            }
            this.contentSection.addMenuItem(item);
        }

        this.menu.addMenuItem(this.contentSection);
    }

    _changeProfile(newProfile) {
        this._profilesProxy.ActiveProfile = newProfile;
        this.ActiveProfile = this._profilesProxy.ActiveProfile;
    }

    _devicesChanged() {
        this._devices = [];
        this._primaryDevice = null;
        this._primaryDeviceId = null;

        if (!this._proxy)
            return;

        this._proxy.GetPrimaryDeviceRemote(Lang.bind(this, function (device, error) {
            if (error) {
                this._primaryDeviceId = null;
            }
            else {
                if (device.length == 1) {
                    device = device[0];
                }
                let [device_id, vendor, model, device_kind, icon, percentage, state, battery_level, seconds] = device
                this._primaryDeviceId = device_id;
            }

            this._proxy.GetDevicesRemote(Lang.bind(this, function (result, error) {
                this._deviceItems.forEach(function (i) { i.destroy(); });
                this._deviceItems = [];
                let devices_stats = [];
                let pct_support_count = 0;
                let _devices = []; let _deviceItems = [];

                if (!error) {
                    let devices = result[0];
                    let position = 0;
                    for (let i = 0; i < devices.length; i++) {
                        let [device_id, vendor, model, device_kind, icon, percentage, state, battery_level, seconds] = devices[i];

                        if (device_kind == UPDeviceKind.LINE_POWER)
                            continue;

                        if (state == UPDeviceState.UNKNOWN)
                            continue;

                        if (reportsPreciseLevels(battery_level)) {
                            pct_support_count++;
                        }

                        let stats = "%s (%d%%)".format(deviceKindToString(device_kind), percentage);
                        devices_stats.push(stats);
                        _devices.push(devices[i]);

                        if (this._primaryDeviceId == null || this._primaryDeviceId == device_id) {
                            if (device_kind == UPDeviceKind.BATTERY && this._primaryDevice == null) {
                                this._primaryDevice = devices[i];
                            }
                        }

                        let status = this._getDeviceStatus(devices[i]);
                        let item = new DeviceItem(devices[i], status, this.aliases);
                        this.menu.addMenuItem(item, position);
                        _deviceItems.push(item);
                        position++;
                    }
                }
                else {
                    global.logError(error);
                }

                this._devices = _devices;
                this._deviceItems = _deviceItems;

                this.set_applet_enabled(true);
                let panel_device = null;

                if (this._primaryDevice != null && (!this.showmulti || (this._devices.length === 1) && pct_support_count === 1)) {
                    this.showDeviceInPanel(this._primaryDevice);
                }
                else {
                    if (this._devices.length === 1 && pct_support_count === 1) {
                        this.showDeviceInPanel(this._devices[0]);
                    }
                    else if (this._devices.length > 0) {
                        let labelText = "";
                        if (this.labelinfo !== "nothing") {
                            let num = 0;

                            for (let i = 0; i < this._devices.length; i++) {
                                let [, , , , , percentage, , battery_level, seconds] = this._devices[i];

                                if (!reportsPreciseLevels(battery_level)) {
                                    continue;
                                }

                                if (pct_support_count > 1) {
                                    labelText += (num++) + ': ';
                                }

                                if (this.labelinfo == "time" && seconds !== 0) {
                                    let time = Math.round(seconds / 60);
                                    let minutes = time % 60;
                                    let hours = Math.floor(time / 60);
                                    labelText += C_("time of battery remaining", "%d:%02d").format(hours, minutes);
                                }
                                else if (this.labelinfo == "percentage" || (this.labelinfo == "percentage_time" && seconds === 0)) {
                                    labelText += C_("percent of battery remaining", "%d%%").format(Math.round(percentage));
                                }
                                else if (this.labelinfo == "percentage_time") {
                                    let time = Math.round(seconds / 60);
                                    let minutes = Math.floor(time % 60);
                                    let hours = Math.floor(time / 60);
                                    labelText += C_("percent of battery remaining", "%d%%").format(Math.round(percentage)) + " (" +
                                        C_("time of battery remaining", "%d:%02d").format(hours, minutes) + ")";
                                }

                                if (num < pct_support_count) {
                                    labelText += '  ';
                                }
                            }
                        }

                        this.set_applet_tooltip(devices_stats.join(", "));
                        this.set_applet_label(labelText);
                        let icon = deviceKindToIcon(this._devices[0][3], this._proxy.Icon, this._devices[0][5], this._devices[0][6]);
                        if (icon != this.panel_icon_name) {
                            this.panel_icon_name = icon;
                            this.set_applet_icon_path(icon);
                            this._applet_icon.set_style_class_name('system-status-icon');
                        }
                    }
                    else {
                        this.set_applet_label("");
                        if (this.brightness.actor.visible) {
                            this.set_applet_tooltip(_("Brightness"));
                            this.panel_icon_name = 'display-brightness';
                            this.set_applet_icon_symbolic_name('display-brightness');
                        }
                        else if (this.keyboard.actor.visible) {
                            this.set_applet_tooltip(_("Keyboard backlight"));
                            this.panel_icon_name = 'keyboard-brightness';
                            this.set_applet_icon_symbolic_name('keyboard-brightness');
                        }
                        else {
                            this.set_applet_enabled(false);
                        }
                    }
                }
            }));
        }));
    }

    on_applet_removed_from_panel() {
        Main.systrayManager.unregisterTrayIconReplacement(this.metadata.uuid);

        if (!this._profilesProxy)
            return;

        if (this._proxyId)
            this._profilesProxy.disconnect(this._proxyId);
    }
}

function main(metadata, orientation, panel_height, instanceId) {
    return new CinnamonPowerApplet(metadata, orientation, panel_height, instanceId);
}
