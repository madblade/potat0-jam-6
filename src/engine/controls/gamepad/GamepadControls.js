/**
 * (c) madblade 2021 all rights reserved.
 *
 * Gamepad API bindings.
 */

'use strict';

import extend, { assert } from '../../../extend';

let GamepadControls = function(controlsEngine)
{
    this.controlsEngine = controlsEngine;
    // ^ this handles the following:
    // rotateCameraFromRightStickGamepad
    // movePlayerFromLeftStickGamepad
    // stopMovePlayerFromLeftStickGamepad
    // goToHomeMenu
    // etc.

    // keep all gamepads in a map
    this.gamepads = {};
    this.numberOfGamepadsConnected = 0;

    // main gamepad
    this.mainGamepad = null;
    this.mainGamepadState = {
        buttons: new Array(18),
        axes: new Array(4)
    };
    this.initMainGamepadState();
    // oscillation fix
    this.oscillationDetection = [
        {last: 0, lastDifferent: 0},
        {last: 0, lastDifferent: 0},
        {last: 0, lastDifferent: 0},
        {last: 0, lastDifferent: 0},
    ];

    // Flags.
    // this.hasAtLeastOneGamepad = false;
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

        // this.hasAtLeastOneGamepad = true;
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
            // this.hasAtLeastOneGamepad = false;
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

    refreshGamepads(dt)
    {
        if (!this.started) return; // || !this.hasAtLeastOneGamepad) return;

        // const gamepad = this.mainGamepad;
        // On Chrome we have to constantly keep polling the gamepads :(
        let gamepads = navigator.getGamepads ? navigator.getGamepads() :
            navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [];
        if (gamepads.length < 1) return;
        const gamepad = gamepads[0];
        if (!gamepad) return;
        this.mainGamepad = gamepad;

        // Refresh buttons
        const lastButtonStates = this.mainGamepadState.buttons;
        const newButtonStates = gamepad.buttons;
        const nbButtons = lastButtonStates.length;
        assert(nbButtons === 18, `[Gamepad] Did not expect ${nbButtons} buttons.`);
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
                // console.log(b);
            }

            if (pressed !== lastButtonStates[b])
            {
                lastButtonStates[b] = pressed;
                this.aButtonWasUpdated(b, newState, pressed, touched);
            }
            else if (pressed)
            {
                this.aButtonWasHeld(b, newState, pressed, touched);
            }
        }

        // Refresh sticks
        const lastStickStates = this.mainGamepadState.axes;
        const osc = this.oscillationDetection;
        const newStickStates = gamepad.axes;
        const nbStickAxes = newStickStates.length;
        assert(nbStickAxes === 4, `[Gamepad] Did not expect ${nbStickAxes} axes.`);
        for (let s = 0; s < nbStickAxes / 2; ++s)
        {
            const s1 = 2 * s;
            const s2 = s1 + 1;
            let a1 = newStickStates[s1];
            let a2 = newStickStates[s2];
            if (Math.abs(a1) < 0.1) a1 = 0.;
            if (Math.abs(a2) < 0.1) a2 = 0.;

            if (
                a1 !== lastStickStates[s1] ||
                a2 !== lastStickStates[s2] ||
                a1 !== 0 || a2 !== 0
            )
            {
                // left stick oscillation correction
                if (s1 === 0)
                {
                    const o1 = osc[s1];
                    if (o1.lastDifferent === a1) {
                        // going back to a previous state: bad
                        a1 = o1.last;
                    } else if (o1.last !== a1) {
                        o1.lastDifferent = o1.last;
                        o1.last = a1;
                    }
                    const o2 = osc[s2];
                    if (o2.lastDifferent === a2) {
                        a2 = o2.last;
                    } else if (o2.last !== a2) {
                        o2.lastDifferent = o2.last;
                        o2.last = a2;
                    }
                }

                lastStickStates[s1] = a1;
                lastStickStates[s2] = a2;
                this.aStickWasHeldOrReleased(s1, s2, a1, a2, dt);
            }
        }
    },

    aButtonWasUpdated(b, state, pressed, touched)
    {
        const controlsEngine = this.controlsEngine;
        // console.log(`${b}, ${state}, ${pressed}, ${touched}`);

        switch (b)
        {
            case 0: // x
                controlsEngine.crossButton(pressed);
                break;
            case 1: // o
                controlsEngine.circleButton(pressed);
                break;
            case 2: // square
                break;
            case 3: // triangle
                break;
            case 4: // L1
                break;
            case 5: // R1
                break;
            case 6: // L2 (progressive on DS4)
                break;
            case 7: // R2 (ditto)
                break;
            case 8: // share
                break;
            case 9: // option / select
                if (pressed) // only do it once
                    controlsEngine.goToHomeMenu();
                break;
            case 10: // L3 (stick)
                break;
            case 11: // R3 (stick)
                break;
            case 12: // d-pad up
                if (pressed) controlsEngine.dPadUp();
                break;
            case 13: // d-pad down
                if (pressed) controlsEngine.dPadDown();
                break;
            case 14: // d-pad left
                if (pressed) controlsEngine.dPadLeft();
                break;
            case 15: // d-pad right
                if (pressed) controlsEngine.dPadRight();
                break;
            case 16: // ps button
                if (pressed)
                    controlsEngine.goToHomeMenu();
                break;
            case 17: // big haptic square
                // controlsEngine.goToHomeMenu();
                // this.doVibration();
                break;
        }
    },

    aButtonWasHeld(b, state, pressed, touched)
    {
    },

    aStickWasHeldOrReleased(axis1, axis2, val1, val2, dt)
    {
        // console.log(`${s}, ${value}`);
        assert(
            axis2 === axis1 + 1 && (axis1 === 0 || axis1 === 2),
            '[Controls] Unexpected stick state.'
        );
        const controlsEngine = this.controlsEngine;
        if (!controlsEngine.threeControlsEnabled) return;

        if (axis1 === 0) // left stick
        {
            // val1 x // left -
            // val2 y // up -
            if (val1 === 0 && val2 === 0)
                controlsEngine.stopMovePlayerFromLeftStickGamepad();
            else
            {
                controlsEngine.movePlayerFromLeftStickGamepad(val1, val2);
                // ^ physics input should manage moving quotas without needing dt
            }
        }
        else if (axis1 === 2) // right stick
        {
            // val1 x // left -
            // val2 y // up -
            if (val1 !== 0 || val2 !== 0)
                controlsEngine.rotateCameraFromRightStickGamepad(val1, val2, dt);
                // ^ dt needed for managing different device refresh rates
        }
    },

    doVibration()
    {
        const a = this.mainGamepad.vibrationActuator;
        assert(!!a, '[Gamepad] Vibration actuator not found.');
        if (!a) return;
        a.playEffect('dual-rumble', {
            startDelay: 0,
            duration: 100,
            weakMagnitude: 1.0,
            strongMagnitude: 1.0
        });
    },

});

export { GamepadControls };
