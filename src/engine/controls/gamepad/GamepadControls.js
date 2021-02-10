/**
 * (c) madblade 2021
 * All rights reserved.
 */

import extend, { assert } from '../../../extend';

let GamepadControls = function(controlsEngine)
{
    this.controlsEngine = controlsEngine;
    // ^ this handles the following:
    // Right stick: camera movement
    // this.rotateCameraFromRightStickGamepad();
    // Left stick: player movement
    // this.movePlayerFromLeftStickGamepad();

    // keep all gamepads in a map
    this.gamepads = {};
    this.numberOfGamepadsConnected = 0;

    // main gamepad
    this.mainGamepad = null;
    this.mainGamepadState = {
        buttons: new Array(17),
        axes: new Array(4)
    };
    this.initMainGamepadState();

    // Flags.
    this.hasAtLeastOneGamepad = false;
    this.started = false;
};

extend(GamepadControls.prototype, {

    initMainGamepadState()
    {
        const state = this.mainGamepadState;
        state.buttons.fill(false);
        state.axes.fill(0);
    },

    gamepadConnected(gamepad)
    {
        assert(this.numberOfGamepadsConnected < 1,
            '[GamepadControls] Only one gamepad at a time is supported.'
        );

        this.hasAtLeastOneGamepad = true;
        this.numberOfGamepadsConnected++;
        this.gamepads[gamepad.index] = gamepad;
        this.mainGamepad = gamepad;
    },

    gamepadDisconnected(gamepad)
    {
        this.numberOfGamepadsConnected--;

        // Switch to next detected gamepad if necessary.
        if (this.numberOfGamepadsConnected < 1)
        {
            this.hasAtLeastOneGamepad = false;
        }
        else
        {
            if (gamepad.index === this.mainGamepad.index)
            {
                this.initMainGamepadState();
                this.mainGamepad = this.gamepads[Object.keys(gamepad)[0]];
            }
        }

        delete this.gamepads[gamepad.index];
    },

    start()
    {
        this.started = true;
    },

    stop()
    {
        this.started = false;
        this.initMainGamepadState();
    },

    refreshGamepads()
    {
        if (!this.started || !this.hasAtLeastOneGamepad) return;

        // const gamepad = this.mainGamepad;
        // On Chrome we have to constantly keep polling the gamepads :(
        let gamepads = navigator.getGamepads ? navigator.getGamepads() :
            navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [];
        if (gamepads.length < 1) return;
        const gamepad = gamepads[0];

        // Refresh buttons
        const lastButtonStates = this.mainGamepadState.buttons;
        const newButtonStates = gamepad.buttons;
        const nbButtons = lastButtonStates.length;
        for (let b = 0; b < nbButtons; ++b)
        {
            let newState = newButtonStates[b];
            let pressed = newState === 1.0;
            let touched = false;
            if (typeof newState === 'object') {
                pressed = newState.pressed;
                if ('touched' in newState) touched = newState.touched;
                newState = newState.value;
            }
            if (pressed || touched)
            {
                console.log(b);
            }

            if (pressed !== lastButtonStates[b])
            {
                lastButtonStates[b] = pressed;
                this.aButtonWasUpdated(b, newState, pressed, touched);
            }
        }

        // Refresh sticks
        // const sticks = this.mainGamepadState.axes;
    },

    aButtonWasUpdated(b, state, pressed, touched)
    {
        console.log(`${b}, ${state}, ${pressed}, ${touched}`);
    }

});

export { GamepadControls };
