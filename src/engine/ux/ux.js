/**
 * User experience.
 * Manages level loading, save, difficulty, etc.
 */

'use strict';

import extend             from '../../extend.js';
import { Checkpoint }     from './checkpoint';
import { UXIngameModule } from './ux.ingame';
import { PlayerState }    from './player.state';
import { UXTimeModule }   from './ux.time';

let UX = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};

    // Save state
    this.lastCheckpoint = null;

    // Progress
    this.playerState = new PlayerState();

    // Time counters.
    this.setupClocks();
};

extend(UX.prototype, {
    // TODO [HIGH] manage level loading, saves, difficulty here.

    refresh()
    {
        this.refreshClocks();
    },

    startNewGame()
    {
        const state = this.playerState;
        const app = this.app;
        const firstLevel = app.model.levels.getLevel(0);
        state.setLevel(firstLevel);
        this.joinLevel(firstLevel);
    },

    configureLevel(level)
    {
        const app = this.app;
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
        // TODO [HIGH] copy level state from checkpoint.

        this.app.runGame();
    },

    informPlayer(text)
    {
        // display text to player.
        console.log('[UX] Got a message…');
        console.log(`[UX] Message: '${text}'`);
    },

    validateLevel()
    {
        // Current level was completed.
        const levels = this.app.model.levels.getLevels();
        const currentLevel = this.playerState.getLevel();
        const levelID = currentLevel.getID();
        const nextLevelID = levelID + 1;
        const nextLevel = levels[nextLevelID];
        if (!nextLevel)
        {
            this.informPlayer('You won!');
        }
        else
        {
            this.playerState.setLevel(nextLevel);
        }
    }

});

extend(UX.prototype, UXIngameModule);
extend(UX.prototype, UXTimeModule);

export { UX };
