/**
 * Handles Gamepad API.
 */

'use strict';

import extend                    from '../../../extend';

import { GamepadActionModule }   from './actions';
import { GamepadControls }       from './GamepadControls';

let GamepadModule = {

    setupGamepad()
    {
        // Setup controls. Only solo player mode supported ATM, but it’s possible
        // to have as many as desired!
        this.gamepadControls = new GamepadControls(this);

        window.addEventListener('gamepadconnected', this.connectGamepad.bind(this));
        window.addEventListener('gamepaddisconnected', this.disconnectGamepad.bind(this));

        // Prefer continuous polling over state management.
        this.startGamepadListeners();
    },

    connectGamepad(event)
    {
        this.gamepadControls.gamepadConnected(event.gamepad);
        console.log('[Controls] Gamepad connected.');
    },

    disconnectGamepad(event)
    {
        this.gamepadControls.gamepadDisconnected(event.gamepad);
        // Never stop gamepad controls from there,
        // for the gamepad API we use continuous polling.
        console.log('[Controls] Gamepad disconnected.');
    },

    // There is no real gamepad listener pipeline;
    // the gamepad state has to be queried at every frame.
    // So this just sets an active / inactive flag.
    startGamepadListeners()
    {
        this.gamepadControls.start();
    },

    resetGamepadListeners()
    {
        this.stopMovePlayerFromLeftStickGamepad();
    },

    /** @deprecated */
    stopGamepadListeners()
    // Keeping this method for consistency; it should never be called.
    {
        console.error('[Gamepad] Stopping gamepad listeners.');
        this.gamepadControls.stop();
    },

    updateControlsGamepadDevice(dt)
    {
        // Ping gamepad models.
        this.gamepadControls.refreshGamepads(dt);
    }

};

extend(GamepadModule, GamepadActionModule);

export { GamepadModule };
