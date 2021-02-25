/**
 * Gameplay settings menu.
 */

'use strict';

import extend, { inherit }  from '../../extend';

import { $ }                from '../../modules/polyfills/dom';

import { GamepadNavigable } from '../../modules/navigation/navigable.gamepad';

let ControlsMenu = function(settingsModule)
{
    const nbNavigableObjects = 3;
    GamepadNavigable.call(this, nbNavigableObjects);

    this.settingsModule = settingsModule;
};

inherit(ControlsMenu,  GamepadNavigable);

extend(ControlsMenu.prototype, {

    getHTML()
    {
        // XXX put controlsSettings in this object
        const controlsSettings = this.settingsModule.controlsSettings;
        const ga = this.settingsModule.gamepadActive;
        const ai = this.activeItem;

        let content = `
            <div class="container">
            <table class="table table border rounded noselect" style="width:100%">
        `;

        content += `
            <tr id="mouse-speed-wrapper"
                class="camspeed-control-wrapper ${this.hl(ga, ai, 0)}"><td>Sensibilité (Souris)</td>
            <td>
            <div class="row mt-3">
                <div class="input-group mb-1 center-block col-12 slider-container">
                    <div class="col-12 input-group-append flex-fill">
                        <input type="range" min="0" max="100" value="50" class="slider"
                            id="mouse-speed-controller">
                    </div>
                </div>
            </div>
            </td></tr>

            <tr id="gamepad-speed-wrapper"
                class="camspeed-control-wrapper ${this.hl(ga, ai, 1)}"><td>Sensibilité (Manette)</td>
            <td>
            <div class="row mt-3">
                <div class="camspeed-control-wrapper
                        input-group mb-1 center-block col-12 slider-container">
                    <div class="col-12 input-group-append flex-fill">
                        <input type="range" min="0" max="100" value="50" class="slider"
                            id="gamepad-speed-controller">
                    </div>
                </div>
            </div>
            </td></tr>
        `;

        if (controlsSettings.hasOwnProperty('language')) {
            let language = `
                <select id="language" class="form-control">
                    <!-- <option value="default">Disposition clavier</option>-->
                    <option value="fr">AZERTY</option>
                    <option value="en">QWERTY</option>
                    <option value="bp">BÉPO</option>
                </select>`;

            content += `<tr><td>Disposition Clavier</td><td>${language}</td></tr>`;
        }

        content += `
            <tr id="return"><td colspan="2">Retour</td></tr>
            </table>
            </div>`;

        return content;
    },

    hl(ga, ai, i) // highlight
    {
        return ga && ai === i ? 'gamepad-selected' : '';
    },

    listen()
    {
        const sm = this.settingsModule;
        let controlsEngine = sm.controlsEngine;

        if (sm.controlsSettings.hasOwnProperty('language')) {
            let l = $('#language');
            l.change(function() {
                let selected = l.find('option:selected').val();
                controlsEngine.changeLayout(selected, true); // Don't restart listeners.
            });
        }

        this.listenReturn();
    },

    listenReturn()
    {
        const sm = this.settingsModule;
        $('#return').click(() => {
            sm.switchToMenu(sm.homeMenu);
        });
    },

    unlisten()
    {
        if (this.settingsModule.controlsSettings.hasOwnProperty('language')) {
            $('#language').off('change');
        }
        $('#return').off('click');
    },

    // Navigaton

    selectItems()
    {
        return [
            $('#mouse-speed-wrapper'),
            $('#gamepad-speed-wrapper'),
            $('#return')
        ];
    },

    navigate(options)
    {
        this.super.navigate.call(this, options);

        const app = this.settingsModule.app;
        const uiSettings = app.engine.controls.settings;
        if (this.activeItem === 0) // mouse
        {
            const camSpeedControl = $('#mouse-speed-controller');
            if (options === 'right' || options === 'left') // slider
            {
                const mouseSpeed = uiSettings.mouseCameraSpeed;
                const maxMouseSpeed = uiSettings.maxMouseSpeed;
                const minMouseSpeed = uiSettings.minMouseSpeed;

                // normalized gui
                const newSpeed =
                    options === 'right' ?
                        Math.min(mouseSpeed * 1.1, maxMouseSpeed) :
                        Math.max(mouseSpeed / 1.1, minMouseSpeed);
                uiSettings.mouseCameraSpeed = newSpeed;

                let speedGUI = (newSpeed - minMouseSpeed) / (maxMouseSpeed - minMouseSpeed);
                speedGUI = Math.log(1 + 16 * speedGUI) / Math.log(17);
                camSpeedControl.val(Math.floor(speedGUI * 100));
            }
        }
    }

});

export { ControlsMenu };
