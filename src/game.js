/**
 * Client application entry point.
 */

'use strict';

import extend           from './extend.js';

// State
import { StateManager } from './state/states.js';

// Engine
import { Graphics }     from './engine/graphics/graphics.js';
import { Audio }        from './engine/audio/audio.js';

import { UI }           from './engine/controls/controls.js';
import { Settings }     from './engine/settings/settings.js';

// Model
import { Hub }          from './model/hub/hub.js';
import { BackEnd }      from './model/backend/backend.js';
import { FrontEnd }     from './model/frontend/frontend.js';

// Modules
import { Register }     from './modules/register/register.js';
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
        // TODO loader & splash screen.
        // TODO default to TPS.
        // TODO remove FPS support.
        // TODO remove chunks and put heightmaps instead.
        graphics:     new Graphics(this),
        audio:        new Audio(this),
        // TODO put AI, Physics. Wire to server model.
        controls:     new UI(this), // TODO add controller API, drop touch
        settings:     new Settings(this) // TODO templatize & fill with custom settings
    };

    // Model buffers server and client objects
    this.model = {
        hub:          new Hub(this), // TODO make a level manager from that stub.
        backend:      new BackEnd(this), // TODO use existing model (or spix’s) here instead of loading & buffers
        // TODO refactor chunks into heightmaps.
        // TODO remove interpolation.
        // TODO remove consistency loader entirely. Every level will be in memory.
        // TODO remove x map, Tree, x path.
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

    // Called when a 'creation' request is emitted from Hub state.
    requestGameCreation()
    {
        if (this.getState() !== 'hub') {
            console.error('Could not request game creation outside of Hub.');
            return;
        }

        // Perform game creation… ?
    },

    // Called when a 'join' request is emitted from Hub state.
    join()
    {
        // if (this.getState() !== 'hub')
        //     throw Error('Could not request game joining outside of Hub.');

        console.log('Join request...');

        // Configuration.
        this.setState('preingame');

        // Configure game… ?

        // Start model loop.
        this.model.frontend.init();
        this.model.backend.init();
        console.log('Game effectively started.');

        // Join game… ?
    },

    // Run game when joining confirmed.
    joinedServer()
    {
        console.log('[Game/Client] Joined server.');

        // Run game
        this.runGame();
    },

    runGame()
    {
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
