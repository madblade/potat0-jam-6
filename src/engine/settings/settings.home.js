/**
 *
 */

'use strict';

import { $ }  from '../../modules/polyfills/dom';
import extend from '../../extend';

let HomeMenu = function(settingsModule)
{
    this.settingsModule = settingsModule;
    this.activeItem = 0;
    this.maxActiveItem = 4;
};

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
        if (options === 'up')
        {
            this.activeItem--;
            if (this.activeItem < 0)
                this.activeItem = this.maxActiveItem;
            this.highlightActiveItem();
        }
        else if (options === 'down')
        {
            this.activeItem++;
            if (this.activeItem > this.maxActiveItem)
                this.activeItem = 0;
            this.highlightActiveItem();
        }
        else if (options === 'enter')
        {
            this.clickActiveItem();
        }
        else if (options === 'back')
        {
            this.clickReturn();
        }
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

    highlightActiveItem()
    {
        const items = this.selectItems();
        const ai = this.activeItem;
        for (let i = 0; i < items.length; ++i)
            if (i === ai) items[i].addClass('gamepad-selected');
            else items[i].removeClass('gamepad-selected');
    },

    clickActiveItem()
    {
        const items = this.selectItems();
        const ai = this.activeItem;
        items[ai].trigger('click');
    },

    clickReturn()
    {
        const r = $('#return');
        r.trigger('click');
    }

});

export { HomeMenu };
