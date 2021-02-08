/**
 * Client application entry point.
 */

'use strict';

import extend           from './extend.js';

// State
import { StateManager } from './state/states.js';

// Engine
import { Graphics }     from './engine/graphics/graphics.js';
import { AudioEngine }  from './engine/audio/audio.js';
import { UI }           from './engine/controls/controls.js';
import { Settings }     from './engine/settings/settings.js';
import { UX }           from './engine/ux/ux';

// Model
import { Levels }       from './model/levels/levels.js';
import { BackEnd }      from './model/backend/backend.js';
import { FrontEnd }     from './model/frontend/frontend.js';

// Modules
import { Register } from './modules/register/register.js';
import { AI }       from './engine/ai/ai';
import { Physics }  from './engine/physics/physics';
// import { Polyfills }    from 'modules/polyfills/polyfills.js';

// Global application structure.
let Game = Game || { Core : {} };

// Main entry point.
Game.Core = function()
{
    // State pattern manages in-game, loading, menus.
    // Also acts as a Mediator between engine, model(s) and modules
    this.state =      new StateManager(this);

    // Engine manages client-side rendering, audio, inputs/outputs
    this.engine = {
        // TODO level transition & splash screen.
        // TODO remove chunks and put heightmaps instead.
        graphics:     new Graphics(this),
        audio:        new AudioEngine(this),
        ai:           new AI(this),
        physics:      new Physics(this),
        // TODO put AI, Physics. Wire to server model.
        controls:     new UI(this), // TODO add gamepad controller API
        settings:     new Settings(this), // TODO custom settings
        ux:           new UX(this),
    };

    // Model buffers server and client objects
    this.model = {
        levels:       new Levels(this),
        backend:      new BackEnd(this),
        // TODO use existing model (or spix’s) here instead of loading & buffers
        // TODO refactor chunks into heightmaps.
        // TODO remove interpolation.
        // TODO remove consistency loader entirely. Every level will be in memory.
        frontend:     new FrontEnd(this),
    };

    // Modules can be registered to add custom behaviours
    this.register = new Register(this);
    this.register.registerDefaultModules();
};

// Application entry point.
extend(Game.Core.prototype, {

    start()
    {
        this.setState('loading');
        this.engine.graphics.preload().then(() =>
            this.setState('main')
        );
    },

    stop()
    {
        this.setState('loading');
        this.stopGame();
    }

});

// Application utility.
extend(Game.Core.prototype, {

    getState()
    {
        return this.state.state;
    },

    setState(state, opt)
    {
        this.state.setState(state, opt);
    },

    isLoading()
    {
        return this.getState() === 'loading';
    },

    isFocused()
    {
        return this.state.focus;
    },

    setFocused(isFocused)
    {
        // Ensure output type.
        this.state.focus = !!isFocused;
    },

    // Called when a 'join' request is emitted from Hub state.
    configureGame(level)
    {
        console.log('[Main] Configuring Game...');
        // console.log(level);

        // Configuration.
        this.setState('preingame');

        // Configure game… ?

        // Start model loop.
        this.model.frontend.init();
        this.model.backend.init(level);
    },

    runGame()
    {
        console.log('[Game/Client] Starting game.');

        this.engine.graphics.run();
        this.engine.controls.run();
        this.engine.audio.run();
        this.register.gameStarted();
    },

    stopGame()
    {
        this.register.gameStopped();
        this.engine.graphics.stop();
        this.engine.controls.stop();
        this.engine.audio.stop();
        this.model.backend.cleanupFullModel();
        this.model.frontend.cleanupFullModel();
        this.engine.graphics.cleanupFullGraphics();
        this.engine.physics.cleanupFullPhysics();
        this.state.cleanupDOM();
    },

});

// Modules, for extending the core functionality.
// To be done:
// [MOD] register/reload modules
// [MOD] error reporting
// [MOD] wrapping DOM queries
extend(Game.Core.prototype, {

    registerModule()
    {

    },

    restartModule()
    {

    }
});

export { Game };
