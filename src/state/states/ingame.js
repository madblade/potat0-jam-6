/**
 * In-game.
 */

'use strict';

import extend from '../../extend';

import { $ }  from '../../modules/polyfills/dom';

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
            .empty();

        // To add an FPS reticule:
        // .addClass('reticle-wrapper')
        // .append('<div class="reticle"></div>')
        // .center()
        // .show();

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
                .empty();

            // To remove the FPS reticule:
            // .removeClass('reticle-wrapper')
            resolve();
        });
    },

    navigate()
    {
        console.warn(
            '[States/Ingame] Should not be able to navigate menus whilst in-game.'
        );

        // (Gamepad triggered ingame while not locked -> restart controls)
        // Note: the user should click inside the window first.
        const controlsEngine = this.stateManager.app.engine.controls;
        controlsEngine.stopListeners();
        controlsEngine.requestStartControls();
    }

});

export { IngameState };
