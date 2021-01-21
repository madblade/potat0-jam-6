/**
 *
 */

'use strict';

import $ from 'jquery';

let HomeModule = {

    getHomeHTML()
    {
        return `
            <div class="container">
                <table class="table table-bordered noselect" style="width:100%">
                <tr id="graphics"><td>Graphics</td></tr>
                <tr id="gameplay"><td>Gameplay</td></tr>
                <tr id="audio"><td>Audio</td></tr>
                <tr id="return"><td>Resume Game</td></tr>
                <tr id="home"><td>Main Menu</td></tr>
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
        $('#graphics').click(function() { this.goGraphics(); }.bind(this));
        $('#gameplay').click(function() { this.goControls(); }.bind(this));
        $('#audio').click(function() { this.goAudio(); }.bind(this));
        $('#home').click(function() { this.goHome(); }.bind(this));
        $('#return').click(function() {
            this.unlistenSettingsMenu();
            this.stateManager.setState('ingame');
            this.controlsEngine.requestLock();
            this.app.setFocused(true);
        }.bind(this));
    },

    unlistenSettingsMenu()
    {
        $(window).off('keydown');
        $('#graphics').off('click');
        $('#gameplay').off('click');
        $('#audio').off('click');
        $('#home').off('click');
        $('#return').off('click');
    },

    listenReturn()
    {
        $('#return').click(function() {
            $('#return').off('click');
            $('#announce')
                .empty()
                .append(this.getHomeHTML());
            this.listenHome();
        }.bind(this));
    }

};

export { HomeModule };
