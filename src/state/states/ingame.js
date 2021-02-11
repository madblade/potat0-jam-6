/**
 *
 */

'use strict';

import extend               from '../../extend';
import { $ }                from '../../modules/polyfills/dom';

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
        const app = this.stateManager.app;
        const controlsEngine = app.engine.controls;
        const ux = app.engine.ux;
        const rendererManager = app.engine.graphics.rendererManager;
        rendererManager.setInTitleScene(false);
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
