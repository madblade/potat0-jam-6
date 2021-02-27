/**
 * User experience.
 * Manages level loading, save, difficulty, etc.
 */

'use strict';

import extend             from '../../extend';

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

    // 1 dialogue / level id
    this.unlockedDialogues = new Map();

    // Time counters.
    this.setupClocks();
};

extend(UX.prototype, {

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
        state.resetProgressInLevel();
        state.resetProgressInCurrentTask();
        this.resetTimeSinceLastEvent();
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
        {
            const state = this.playerState;
            state.setLevel(level);
            state.resetProgressInLevel();
            state.resetProgressInCurrentTask();
            this.resetTimeSinceLastEvent();
            this.app.runGame();

            // if (level.getID() > 0)
            //     this.app.engine.audio.playMusic();
        }
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
        // [XXX] copy level state from checkpoint.

        this.app.runGame();
    },

    informPlayer(text)
    {
        // display text to player.
        // console.log('[UX] Got a message…');
        console.log(`[UX] Message: '${text}'`);
    },

    directJoinLevel(level)
    {
        // cleanup old level
        const app = this.app;
        app.model.backend.cleanupFullModel();
        app.model.frontend.cleanupFullModel();
        app.engine.graphics.cleanupFullGraphics();
        app.engine.physics.cleanupFullPhysics();

        // prepare new level
        app.model.frontend.init();
        app.model.backend.init(level);

        // run
    },

    validateLevel()
    {
        // Current level was completed.
        const levels = this.app.model.levels.getLevels();
        const state = this.playerState;
        const currentLevel = state.getLevel();
        const levelID = currentLevel.getID();
        const nextLevelID = levelID + 1;
        const nextLevel = levels[nextLevelID];
        if (!nextLevel)
        {
            this.informPlayer('You won!');
            this.setGamePaused(true);
        }
        else
        {
            this.resetTimeSinceLastEvent();
            state.setLevel(nextLevel);
            this.directJoinLevel(nextLevel);
        }
    },

    validateTask()
    {
        const state = this.playerState;
        state.resetProgressInCurrentTask(); // goto next set of tasks
        state.incrementProgressInLevel(); // 1 level = n tasks
        this.resetTimeSinceLastEvent();

        // Check that there are more tasks left.
        const currentLevel = state.getLevel();
        const scenario = currentLevel.getScenario();
        const progressInLevel = state.getProgressInLevel();
        const currentTask = scenario[progressInLevel];
        if (!currentTask)
        {
            console.error(
                '[UX/ValidateTask] ValidateTask called instead of ValidateLevel.'
            );
            this.validateLevel();
        }
    },

    updateDialogueAdvancement(levelID, maxD)
    {
        const ud = this.unlockedDialogues;
        const l = ud.get(levelID);
        if (!l) ud.set(levelID, maxD);
        else ud.set(levelID, Math.max(maxD, l));
    }

});

extend(UX.prototype, UXIngameModule);
extend(UX.prototype, UXTimeModule);

export { UX };
