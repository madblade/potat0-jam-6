/**
 *
 */

'use strict';

import { $ } from '../../modules/polyfills/dom';

let HomeModule = {

    getHomeHTML()
    {
        return `
            <div class="container">
                <table class="table border rounded noselect" style="width:100%">
                <tr id="home"><td>Back to Main Menu</td></tr>
                <tr id="graphics"><td>Graphics</td></tr>
                <tr id="gameplay"><td>Gameplay</td></tr>
                <tr id="audio"><td>Audio</td></tr>
                <tr id="return"><td>Resume Game</td></tr>
                </table>
            </div>
        `;
    },

    goHome()
    {
        let app = this.app;
        this.unlistenSettingsMenu();
        // $(window).off('keydown');
        // this.app.setState('loading');
        app.stopGame();
        app.setState('main');
    },

    listenHome()
    {
        const app = this.app;
        const audio = app.engine.audio;

        const gx = $('#graphics');
        gx.click(() => this.goGraphics());
        gx.mouseenter(() => audio.playMenuSound());
        const gp = $('#gameplay');
        gp.click(() => this.goControls());
        gp.mouseenter(() => audio.playMenuSound());
        const au = $('#audio');
        au.click(() => this.goAudio());
        au.mouseenter(() => audio.playMenuSound());
        const hm = $('#home');
        hm.click(() => this.goHome());
        hm.mouseenter(() => audio.playMenuSound());
        const rn = $('#return');
        rn.click(() => {
            this.unlistenSettingsMenu();
            this.stateManager.setState('ingame');
            this.controlsEngine.requestStartControls();
            this.app.setFocused(true);
        });
        rn.mouseenter(() => audio.playMenuSound());
    },

    unlistenSettingsMenu()
    {
        const gx = $('#graphics');
        const gp = $('#gameplay');
        const au = $('#audio');
        const hm = $('#home');
        const rn = $('#return');
        $(window).off('keydown');
        gx.off('click'); gx.off('mouseenter');
        gp.off('click'); gp.off('mouseenter');
        au.off('click'); au.off('mouseenter');
        hm.off('click'); hm.off('mouseenter');
        rn.off('click'); rn.off('mouseenter');
    },

    listenReturn()
    {
        $('#return').click(() => {
            $('#return').off('click');
            $('#announce')
                .empty()
                .append(this.getHomeHTML());
            this.listenHome();
        });
    }

};

export { HomeModule };
