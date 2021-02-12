/**
 * A class managing states.
 */

'use strict';

import extend               from '../extend';
import { $ }                from '../modules/polyfills/dom';

import { IngameState }      from './states/ingame';
import { LoadingState }     from './states/loading';
import { SettingsState }    from './states/settings';
import { LevelSelectState } from './states/level.select';
import { MainMenuState }    from './states/mainmenu';
import { PreIngameState }   from './states/pre.ingame';

let StateManager = function(app)
{
    this.app = app;

    // States
    this.states = {};
    this.previousState = '';
    this.state = '';
    this.focus = false;

    // Register actions
    this.registerState(new IngameState(this));
    this.registerState(new LoadingState(this));
    this.registerState(new SettingsState(this));
    this.registerState(new LevelSelectState(this));
    this.registerState(new MainMenuState(this));
    this.registerState(new PreIngameState(this));
};

StateManager.prototype.register = [];

extend(StateManager.prototype, {

    registerState(state)
    {
        let stateId = state.stateName;
        if (!this.states.hasOwnProperty(stateId)) {
            this.states[stateId] = state;
        }
    },

    // Low-level setState must handle every kind of state modification
    setState(state, opt)
    {
        this.previousState = this.state;
        this.state = state;

        if (!this.states.hasOwnProperty(this.state)) {
            console.error(`[StateManager] State "${state}" does not exist.`);
            return;
        }

        if (!this.states.hasOwnProperty(this.previousState)) {
            // Not defined at startup (for loading, that is)
            this.states[this.state].start(opt);
        } else {
            this.states[this.previousState].end().then(function() {
                let s = this.states[this.state];
                let start = s.start.bind(s);
                start(opt);
            }.bind(this));
        }
    },

    getState(state)
    {
        if (!this.states.hasOwnProperty(state)) {
            console.error(`[StateManager] State "${state} does not exist."`);
            return;
        }

        return this.states[state];
    },

    cleanupDOM()
    {
        $('#announce').empty();
        $('#container').empty();
        // HUD
        $('#position').empty();
        $('#chat').empty();
        $('#mini-map').empty();
        $('#items').empty();
        $('#hud').empty();
    }

});

export { StateManager };
