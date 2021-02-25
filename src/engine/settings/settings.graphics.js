/**
 * Graphics settings menu.
 */

'use strict';

import extend, { inherit }  from '../../extend';

import { $ }                from '../../modules/polyfills/dom';

import { GamepadNavigable } from '../../modules/navigation/navigable.gamepad';

let GraphicsMenu = function(settingsModule)
{
    const nbNavigableObjects = 1;
    GamepadNavigable.call(this, nbNavigableObjects);

    this.settingsModule = settingsModule;
};

inherit(GraphicsMenu, GamepadNavigable);

extend(GraphicsMenu.prototype, {

    getHTML()
    {
        const graphicsSettings = this.settingsModule.graphicsSettings;

        let content = `
            <div class="container">
            <table class="table table border rounded noselect" style="width:100%"
            `;

        for (let s in graphicsSettings) {
            content += `<tr><td>${graphicsSettings[s]}</td></tr>`;
        }

        content += `
            <tr id="return"><td>Retour</td></tr>
            </table>
            </div>`;

        return content;
    },

    listen()
    {
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
        $('#return').off('click');
    },

    // Navigation

    selectItems()
    {
        return [];
    },

    navigate(options)
    {
        this.super.navigate.call(this, options);
    }

});

export { GraphicsMenu };
