/**
 *
 */

'use strict';

import { $ }                from '../../modules/polyfills/dom';
import { GamepadNavigable } from '../../modules/navigation/navigable.gamepad';
import extend, { inherit }  from '../../extend';

let ControlsMenu = function(settingsModule)
{
    const nbNavigableObjects = 0;
    GamepadNavigable.call(this, nbNavigableObjects);

    this.settingsModule = settingsModule;
};

inherit(ControlsMenu,  GamepadNavigable);

extend(ControlsMenu.prototype, {

    getHTML()
    {
        // XXX put controlsSettings in this object
        const controlsSettings = this.settingsModule.controlsSettings;

        let content = `
            <div class="container">
            <table class="table table border rounded noselect" style="width:100%">
        `;

        if (controlsSettings.hasOwnProperty('language')) {
            let language = `
                <select id="language" class="form-control">
                    <option value="default">Choose your layout:</option>
                    <option value="en">en</option>
                    <option value="fr">fr</option>
                </select>`;

            content += `<tr><td>Keyboard layout</td><td>${language}</td></tr>`;
        }

        content += `
            <tr id="return"><td colspan="2">Return</td></tr>
            </table>
            </div>`;

        return content;
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
        return [];
    },

    navigate(options)
    {
        this.super.navigate.call(this, options);
    }

});

export { ControlsMenu };
