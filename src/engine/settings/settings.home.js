/**
 *
 */

'use strict';

import { $ }                from '../../modules/polyfills/dom';
import { GamepadNavigable } from '../../modules/navigation/navigable.gamepad';
import extend, { inherit }  from '../../extend';

let HomeMenu = function(settingsModule)
{
    const nbNavigableObjects = 4;
    GamepadNavigable.call(this, nbNavigableObjects);

    this.settingsModule = settingsModule;
};

inherit(HomeMenu, GamepadNavigable);

extend(HomeMenu.prototype, {

    getHTML()
    {
        const ga = this.settingsModule.gamepadActive;
        const ai = this.activeItem;
        return `
            <div class="container">
                <table class="table border rounded noselect" style="width:100%">
                <tr ${this.hl(ga, ai, 0)} id="home"><td>Back to Main Menu</td></tr>
                <tr ${this.hl(ga, ai, 1)} id="graphics"><td>Graphics</td></tr>
                <tr ${this.hl(ga, ai, 2)} id="gameplay"><td>Gameplay</td></tr>
                <tr ${this.hl(ga, ai, 3)} id="audio"><td>Audio</td></tr>
                <tr ${this.hl(ga, ai, 4)} id="return"><td>Resume Game</td></tr>
                </table>
            </div>
        `;
    },

    hl(ga, ai, i) // highlight
    {
        return ga && ai === i ? 'class="gamepad-selected"' : '';
    },

    listen()
    {
        const sm = this.settingsModule;
        const app = sm.app;
        const audio = app.engine.audio;

        const hm = $('#home');
        hm.click(() => sm.goBackToTitleScreen());
        hm.mouseenter(() => audio.playMenuSound());

        const gx = $('#graphics');
        gx.click(() => sm.switchToMenu(sm.graphicsMenu));
        gx.mouseenter(() => audio.playMenuSound());

        const gp = $('#gameplay');
        gp.click(() => sm.switchToMenu(sm.controlsMenu));
        gp.mouseenter(() => audio.playMenuSound());

        const au = $('#audio');
        au.click(() => sm.switchToMenu(sm.audioMenu));
        au.mouseenter(() => audio.playMenuSound());

        const rn = $('#return');
        rn.click(() => {
            this.unlisten(); // (possibly unnecessary)
            sm.stateManager.setState('ingame');
            sm.controlsEngine.requestStartControls();
            sm.app.setFocused(true);
        });
        rn.mouseenter(() => audio.playMenuSound());
    },

    unlisten()
    {
        const hm = $('#home');
        const gx = $('#graphics');
        const gp = $('#gameplay');
        const au = $('#audio');
        const rn = $('#return');
        $(window).off('keydown');
        gx.off('click'); gx.off('mouseenter');
        gp.off('click'); gp.off('mouseenter');
        au.off('click'); au.off('mouseenter');
        hm.off('click'); hm.off('mouseenter');
        rn.off('click'); rn.off('mouseenter');
    },

    /* Gamepad navigation methods */

    navigate(options)
    {
        this.super.navigate.call(this, options);
    },

    selectItems()
    {
        return [
            $('#home'),
            $('#graphics'),
            $('#gameplay'),
            $('#audio'),
            $('#return')
        ];
    },

});

export { HomeMenu };
