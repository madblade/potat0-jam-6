/**
 * Connect to a distant / local server or launch a local server.
 */

'use strict';

import extend        from '../../extend';
import { $ }         from '../../modules/polyfills/dom.js';

const GameTitle = 'Rad Yarns';
const GameHeader = `
<div class="container small-title">
    <h2>${GameTitle}</h2>
</div>
`;

let MainMenuState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'main';

    this.htmlHead = `
        <div class="container">
            ${GameHeader}
        `;

    this.htmlQuick =
        `
        <div class="col-12"><div class="col-12">

        <div class="input-group mb-1 center-block" id="play-quick">
            <div class="input-group-append flex-fill">
                <button id="button-play"
                    class="btn btn-outline-secondary flex-fill" type="button">New Game</button>
            </div>
        </div>

        <div class="input-group mb-1 center-block" id="load">
            <div class="input-group-append flex-fill">
                <button id="button-load"
                    class="btn btn-outline-secondary flex-fill" type="button">Load</button>
            </div>
        </div>

        <div class="row mt-3">
            <div class="col-4"></div>
            <div class="input-group mb-1 center-block col-4 slider-container">
                <div class="col-2" id="volume-status"><i class="fas fa-volume-mute fa-2x"></i></div>
                <div class="col-10 input-group-append flex-fill">
                    <input type="range" min="0" max="100" value="0" class="slider"
                        id="main-volume-controller">
                </div>
            </div>
        </div>

        </div></div>
        `;

    this.htmlTail = '</div>';
};

extend(MainMenuState.prototype, {

    startListeners()
    {
        const app = this.stateManager.app;
        const audio = app.engine.audio;

        // Listen to buttons.
        const buttonPlay = $('#button-play');
        buttonPlay.click(() => {
            audio.playText('New Jam');
            app.engine.ux.startNewGame();
        });
        buttonPlay.mouseenter(() => {
            audio.playMenuSound();
        });
        const buttonLoad = $('#button-load');
        buttonLoad.click(() => {
            this.stateManager.setState('level-select');
        });
        buttonLoad.mouseenter(() => {
            audio.playMenuSound();
        });

        const settings = app.engine.settings;
        settings.startVolumeController();
    },

    start()
    {
        $('#announce').empty()
            .removeClass()
            .addClass('main-menu')
            .append(
                this.htmlHead +
                this.htmlQuick +
                this.htmlTail
            )
            .css('position', '')
            .show();

        this.startListeners();
    },

    stopListeners()
    {
        const bp = $('#button-play');
        bp.off('click');
        bp.off('mouseenter');
        const bl = $('#button-load');
        bl.off('click');
        bl.off('mouseenter');

        const settings = this.stateManager.app.engine.settings;
        settings.stopVolumeController();
    },

    end()
    {
        this.stopListeners();

        return new Promise(function(resolve) {
            $('#announce')
                .empty();
            resolve();
        });
    },

});

export { MainMenuState, GameHeader, GameTitle };
