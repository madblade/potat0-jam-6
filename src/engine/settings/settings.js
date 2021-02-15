/**
 * In-game setting menus.
 */

'use strict';

import extend, { assert } from '../../extend';

import { $ }              from '../../modules/polyfills/dom';

import { AudioMenu }      from './settings.audio';
import { ControlsMenu }   from './settings.controls';
import { GraphicsMenu }   from './settings.graphics';
import { HomeMenu }       from './settings.home';

let Settings = function(app)
{
    this.app = app;

    this.homeMenu = new HomeMenu(this);
    this.audioMenu = new AudioMenu(this);
    this.controlsMenu = new ControlsMenu(this);
    this.graphicsMenu = new GraphicsMenu(this);
    this.activeMenu = null;

    this.gamepadActive = false;
};

extend(Settings.prototype, {

    run()
    {
        let app = this.app;

        this.controlsEngine =   app.engine.controls;
        this.stateManager =     app.state;

        this.graphicsSettings = app.engine.graphics.settings;
        this.controlsSettings = app.engine.controls.settings;
        this.audioSettings =    app.engine.audio.settings;

        if (this.activeMenu) this.activeMenu.unlisten();
        this.activeMenu = this.homeMenu;

        // Add content, then fade in and add listeners.
        $('#announce')
            .empty()
            .removeClass()
            .addClass('settings')
            .append(this.activeMenu.getHTML())
            .center()
            // .fadeIn()
            .show();

        this.activeMenu.listen();
    },

    stop()
    {
        // Fade out settings menu.
        // this.unlistenSettingsMenu();

        assert(this.activeMenu === this.homeMenu,
            '[Settings/Menuing] Should be able to return to title from home menu only.');

        // Stop last (main menu) listeners.
        const am = this.activeMenu;
        if (am) am.unlisten();
        this.activeMenu = null;

        return new Promise(resolve => {
            let settings = $('#announce');
            // settings.fadeOut(200, () => {
            settings.empty().removeClass('settings');
            resolve();
            // });
        });
    },

    goBackToTitleScreen()
    {
        let app = this.app;
        // this.unlistenSettingsMenu();
        // $(window).off('keydown');
        // this.app.setState('loading');
        app.stopGame();
        app.setState('main');
    },

    switchToMenu(newActiveMenu)
    {
        assert(this.activeMenu !== newActiveMenu,
            '[Settings/Menuing] Trying to switch to the same menu.'
        );
        assert(
            newActiveMenu === this.homeMenu ||
            newActiveMenu === this.audioMenu ||
            newActiveMenu === this.controlsMenu ||
            newActiveMenu === this.graphicsMenu,
            '[Settings/Menuing] Invalid menu.'
        );

        this.activeMenu.unlisten();
        this.activeMenu = newActiveMenu;

        $('#announce')
            .empty()
            .append(this.activeMenu.getHTML());

        this.activeMenu.listen();
    },

    navigate(navigationOptions) // called by the gamepad
    {
        const am = this.activeMenu;
        if (!am) {
            console.log('[Settings/Menuing] No active menu found.');
            return;
        }

        am.navigate(navigationOptions);
    },

});

export { Settings };
