/**
 *
 */

'use strict';

import { $ }  from '../../modules/polyfills/dom';
import extend from '../../extend';

let GraphicsMenu = function(settingsModule)
{
    this.settingsModule = settingsModule;
    this.activeItem = 0;
};

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
            <tr id="return"><td>Return</td></tr>
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

    navigate(options)
    {
    }

});

export { GraphicsMenu };
