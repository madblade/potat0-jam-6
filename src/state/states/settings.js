/**
 *
 */

'use strict';

import extend from '../../extend';

let SettingsState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'settings';
};

extend(SettingsState.prototype, {

    start()
    {
        const app = this.stateManager.app;
        app.engine.settings.run();
    },

    end()
    {
        const app = this.stateManager.app;
        return app.engine.settings.stop();
    }

});

export { SettingsState };
