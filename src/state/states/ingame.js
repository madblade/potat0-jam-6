/**
 *
 */

'use strict';

import extend               from '../../extend.js';
import { $ }                from '../../modules/polyfills/dom.js';

let IngameState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'ingame';
};

extend(IngameState.prototype, {

    start()
    {
        $('#announce')
            .removeClass()
            .empty()
            .addClass('reticle-wrapper')
            .append('<div class="reticle"></div>')
            .center()
            .show();

        const ux = this.stateManager.app.engine.ux;
        ux.setGamePaused(false);
    },

    end()
    {
        const controlsEngine = this.stateManager.app.engine.controls;
        const ux = this.stateManager.app.engine.ux;
        controlsEngine.stopListeners();
        ux.setGamePaused(true);

        return new Promise(function(resolve) {
            $('#announce')
                .empty()
                .removeClass('reticle-wrapper');
            resolve();
        });
    }

});

export { IngameState };
