/**
 * User interaction.
 */

'use strict';

import extend               from '../../extend';

import { $ }                from '../../modules/polyfills/dom';

import { KeyboardModule }   from './keyboard/keyboard';
import { MouseModule }      from './mouse/mouse';
import { TouchModule }      from './touch/touch';
import { WindowModule }     from './window/window';
import { GamepadModule }    from './gamepad/gamepad';

let UI = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};

    // Mouse on desktop.
    this.threeControlsEnabled = false;
    this.mouse = {};

    // Keyboard needs a list of possible keystrokes;
    // and a list of keys actually pressed.
    this.keyControls = {};

    // Gamepad controller.
    this.setupGamepad();

    // Other input methods.
    this.touchControlsEnabled = false;
    this.isTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0;
    if (this.isTouch)
    {
        console.log('[Controls] Touch device detected.');
        this.touch = {
            // Stick states
            leftX: 0, leftY: 0,
            rightX: 0, rightY: 0,
            // Euler-type controls
            rx: 0, ry: 0,
            leftLast: ''
        };
        this.touchWidgetControls = this.setupTouchWidget();
    }

    if (!this.isTouch) {
        this.settings.language = ''; // expose keyboard layout settings
    }

    // internal
    this._stamp = Date.now();
};

extend(UI.prototype, {

    run()
    {
        let graphicsEngine = this.app.engine.graphics;

        // XXX [ACCESSIBILITY] gamepad

        if (this.isTouch) {
            this.setupTouch();
        } else {
            this.setupKeyboard();
            // do NOT call this.setupGamepad();
            // ^ this is set once and for all at the app startup.
            this.setupMouse();
        }
        this.setupWindowListeners();

        // Should this be put somewhere else?
        $(window).resize(graphicsEngine.resize.bind(graphicsEngine));
    },

    stop()
    {
        this.stopListeners();
    },

    stopListeners()
    {
        if (this.isTouch) {
            this.stopTouchListeners();
        } else {
            this.stopKeyboardListeners();
            // do NOT call this.stopGamepadListeners();
            // ^ it remains used in menu navigation.
            this.stopMouseListeners();
        }
        this.stopWindowListeners();
    },

    stamp()
    {
        this._stamp = Date.now();
        return this._stamp;
    },

    now()
    {
        return this._stamp;
    },

    requestStartControls()
    {
        if (this.isTouch)
            this.startTouchControls();
        else
            this.startPointerLockedControls();
    },

    updateControlsDevice(dt)
    {
        this.updateControlsGamepadDevice(dt);
        this.updateControlsTouchDevice(dt);
    }
});

extend(UI.prototype, KeyboardModule);
extend(UI.prototype, MouseModule);
extend(UI.prototype, TouchModule);
extend(UI.prototype, GamepadModule);
extend(UI.prototype, WindowModule);

export { UI };
