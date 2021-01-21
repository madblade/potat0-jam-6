/**
 * User experience.
 * Manages level loading, save, difficulty, etc.
 */

'use strict';

import extend         from '../../extend.js';
import { Checkpoint } from './checkpoint';

let UX = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};

    // Save state
    this.lastCheckpoint = null;
};

extend(UX.prototype, {
    // TODO manage level loading, saves, difficulty here.

    startNewGame()
    {
        let app = this.app;
        let firstLevel = app.model.levels.getLevel(0);
        this.joinLevel(firstLevel);
    },

    configureLevel(level)
    {
        let app = this.app;
        if (app.getState() === 'ingame' || app.getState() === 'preingame')
        {
            console.warn('[UX] A game is already running. Cleaning up!');
            app.stopGame();
        }

        if (!level)
        {
            console.error('[UX] Undefined level.');
            app.setState('main');
            return false;
        }

        app.configureGame(level);
        return true;
    },

    joinLevel(level)
    {
        const status = this.configureLevel(level);
        if (status)
            this.app.runGame();
    },

    saveCheckpoint()
    {
        let app = this.app;
        if (!this.lastCheckpoint)
        {
            this.lastCheckpoint = new Checkpoint(app.model.levels.getLevel(0));
        }
        return this.lastCheckpoint;
    },

    joinFarthestCheckpoint()
    {
        let checkpoint = this.lastCheckpoint || this.saveCheckpoint();
        let level = checkpoint.getLevel();

        const status = this.configureLevel(level);
        if (!status) return;
        // TODO copy level state from checkpoint.

        this.app.runGame();
    },

});

export { UX };
