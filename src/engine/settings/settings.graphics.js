/**
 *
 */

'use strict';

import { $ } from '../../modules/polyfills/dom';

let GraphicsModule = {

    getGraphicsHTML(graphicsSettings)
    {
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

    goGraphics()
    {
        this.unlistenSettingsMenu();
        $('#announce')
            .empty()
            .append(this.getGraphicsHTML(this.graphicsSettings));
        this.listenReturn();
    },

    listenGraphics()
    {

    }

};

export { GraphicsModule };
