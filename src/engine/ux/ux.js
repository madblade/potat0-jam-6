/**
 * User experience.
 * Manages level loading, save, difficulty, etc.
 */

'use strict';

import extend               from '../../extend.js';

let UX = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};
    this.settings = {};
};

extend(UX.prototype, {
    // TODO manage level loading, saves, difficulty here.

    startNewGame()
    {
        let app = this.app;
        let firstLevel = app.model.levels.getLevel(0);
        this.joinLevel(firstLevel);
    },

    joinLevel(level)
    {
        let app = this.app;
        if (app.getState() === 'ingame' || app.getState() === 'preingame')
        {
            console.warn('[UX] A game is already running. Cleaning up!');
            app.stopGame();
        }
        app.configureGame(level);
        app.runGame();
    }

});

export { UX };
