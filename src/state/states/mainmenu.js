/**
 * Main menu. New game, load, set audio.
 */

'use strict';

import extend, { inherit }  from '../../extend';

import { $ }                from '../../modules/polyfills/dom';
import { GamepadNavigable } from '../../modules/navigation/navigable.gamepad';

const GameTitle = 'Rad';
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
        `;
    this.htmlTail = '</div>';

    // This is a menu, we need navigable functionality.
    const nbNavigableObjects = 3;
    GamepadNavigable.call(this, nbNavigableObjects);
};

inherit(MainMenuState, GamepadNavigable);

extend(MainMenuState.prototype, {

    getMainMenuHTML()
    {
        const ga = this.stateManager.app.engine.settings.gamepadActive;
        const ai = this.activeItem;

        return `
            <div class="col-12"><div class="col-12">

            <div class="row mt-3">
                <div class="col-4"></div>
                <div id="volume-control-wrapper"
                    class="input-group mb-1 center-block col-4 slider-container ${this.hl(ga, ai, 0)}">
                    <div class="col-2" id="volume-status"><i class="fas fa-volume-mute fa-2x"></i></div>
                    <div class="col-10 input-group-append flex-fill">
                        <input type="range" min="0" max="100" value="0" class="slider"
                            id="main-volume-controller">
                    </div>
                </div>
            </div>

            <div class="input-group mb-1 center-block" id="play-quick">
                <div class="input-group-append flex-fill">
                    <button id="button-play"
                        class="btn btn-outline-secondary flex-fill ${this.hl(ga, ai, 1)}"
                        type="button">Nouvelle Partie</button>
                </div>
            </div>

            <div class="input-group mb-1 center-block" id="load">
                <div class="input-group-append flex-fill">
                    <button id="button-load"
                        class="btn btn-outline-secondary flex-fill ${this.hl(ga, ai, 2)}"
                        type="button">Charger</button>
                </div>
            </div>


            <div class="row mt-3" id="gamepad-detector">
                ${this.getDetectGamepadHTML(ga)}
            </div>

            </div></div>
        `;
    },

    getDetectGamepadHTML(ga)
    {
        return ga ? `
            <div class="col-4"></div>
            <div class="col-4 mb-1 center-block gamepad-status">
                <div class="col-3">
                    <span class="fa-stack fa-2x">
                        <i class="fas fa-gamepad fa-stack-1x"></i>
                    </span>
                </div>
                <div class="col-9 input-group-append flex-fill">
                    Manette détectée.
                </div>
            </div>
            ` : `
            <div class="col-4"></div>
                <div class="col-4 mb-1 center-block gamepad-status">
                    <div class="col-3">
                        <span class="fa-stack fa-2x">
                            <i class="fas fa-gamepad fa-stack-1x"></i>
                            <i class="fa fa-ban fa-stack-1x nested-icon"></i>
                        </span>
                    </div>
                    <div class="col-9 input-group-append flex-fill">
                        Aucune manette détectée.
                    </div>
                </div>
            `;
    },

    updateGamepadStatus()
    {
        const ga = this.stateManager.app.engine.settings.gamepadActive;
        $('#gamepad-detector').html(this.getDetectGamepadHTML(ga));
    },

    hl(ga, ai, i) // highlight
    {
        return ga && ai === i ? 'gamepad-selected' : '';
    },

    startListeners()
    {
        const app = this.stateManager.app;
        const audio = app.engine.audio;

        // Listen to buttons.
        const buttonPlay = $('#button-play');
        buttonPlay.click(() => {
            // audio.playText('New Jam');
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

        // Volume listeners are the same as in the audio menu.
        const settings = app.engine.settings;
        settings.audioMenu.startVolumeController();

        // Force graphics to start.
        app.engine.graphics.run();
    },

    start()
    {
        $('#announce').empty()
            .removeClass()
            .addClass('main-menu')
            .append(
                this.htmlHead +
                this.getMainMenuHTML() +
                this.htmlTail
            )
            // .css('left', '')
            // .css('right', '')
            .center()
            // .css('position', '')
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

        const audioMenu = this.stateManager.app.engine.settings.audioMenu;
        audioMenu.stopVolumeController();
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

    // Gamepad navigation

    selectItems()
    {
        return [
            $('#volume-control-wrapper'),
            $('#button-play'),
            $('#button-load'),
        ];
    },

    navigate(navigationOptions)
    {
        this.super.navigate.call(this, navigationOptions);

        // manage audio
        if (this.activeItem === 0) // vol control
        {
            const app = this.stateManager.app;
            const audio = app.engine.audio;

            const volumeControl = $('#main-volume-controller');
            const iconVolume = $('#volume-status');
            if (navigationOptions === 'right' || navigationOptions === 'left')
            {
                const volume = audio.getVolume();
                const newVolume =
                    navigationOptions === 'right' ?
                        Math.min(volume + 0.05, 1.) :
                        Math.max(volume - 0.05, 0.);
                audio.setVolume(newVolume);

                if (newVolume === 0)
                    iconVolume.html('<i class="fas fa-volume-mute fa-2x">');
                else
                {
                    iconVolume.html('<i class="fas fa-volume-up fa-2x">');
                    audio.playText(' Cxy');
                }

                volumeControl.val(Math.floor(newVolume * 100));
            }
            else if (navigationOptions === 'enter') // toggle
            {
                const isMute = audio.isMute();
                if (isMute)
                {
                    const newV = Math.floor(audio.getVolume() * 100);
                    volumeControl.val(newV);
                    iconVolume.html('<i class="fas fa-volume-up fa-2x">');
                    audio.unMute();
                }
                else
                {
                    iconVolume.html('<i class="fas fa-volume-mute fa-2x">');
                    audio.mute();
                }
            }
        }
    },

});

export { MainMenuState, GameHeader, GameTitle };
