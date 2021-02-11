/**
 * Handles Gamepad API.
 */

'use strict';

import { GamepadActionModule }   from './actions';
import extend                    from '../../../extend';
import { GamepadControls }       from './GamepadControls';

let GamepadModule = {

    setupGamepad()
    {
        // Setup controls. Only solo player mode supported ATM, but it’s possible
        // to have as many as desired!
        this.gamepadControls = new GamepadControls(this);

        window.addEventListener('gamepadconnected', this.connectGamepad.bind(this));
        window.addEventListener('gamepaddisconnected', this.disconnectGamepad.bind(this));
    },

    connectGamepad(event)
    {
        this.gamepadControls.gamepadConnected(event.gamepad);
        console.log('[Controls] Gamepad connected.');
    },

    disconnectGamepad(event)
    {
        this.gamepadControls.gamepadDisconnected(event.gamepad);
        console.log('[Controls] Gamepad disconnected.');
    },

    // There is no real gamepad listener pipeline;
    // the gamepad state has to be queried at every frame.
    // So this just sets an active / inactive flag.
    startGamepadListeners()
    {
        this.gamepadControls.start();
    },

    stopGamepadListeners()
    {
        this.gamepadControls.stop();
    },

    updateControlsGamepadDevice()
    {
        // Ping gamepad models.
        this.gamepadControls.refreshGamepads();
    }

};

extend(GamepadModule, GamepadActionModule);

export { GamepadModule };
