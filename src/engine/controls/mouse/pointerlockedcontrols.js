/**
 *
 */

'use strict';

import { $ } from '../../../modules/polyfills/dom';

let PointerLockModule = {

    setupPointerLock()
    {
        let app = this.app;

        if (!('webkitPointerLockElement' in document) &&
            !('mozPointerLockElement' in document) &&
            !('pointerLockElement' in document)) return;

        let scope = this;
        let d = document;
        let b = document.body;

        if ('webkitPointerLockElement' in d) {
            if (!this.pointerLockFunction) this.pointerLockFunction = function() {
                scope.pointerLockChanged(d.webkitRequestPointerLock === b);
            };
            b.requestPointerLock = b.webkitRequestPointerLock;
            d.removeEventListener('webkitpointerlockchange', this.pointerLockFunction);
            d.addEventListener('webkitpointerlockchange', this.pointerLockFunction, false);
        } else if ('mozPointerLockElement' in d) {
            if (!this.pointerLockFunction) this.pointerLockFunction = function() {
                scope.pointerLockChanged(d.mozPointerLockElement === b);
            };
            b.requestPointerLock = b.mozRequestPointerLock;
            d.removeEventListener('mozpointerlockchange', this.pointerLockFunction);
            d.addEventListener('mozpointerlockchange', this.pointerLockFunction, false);
        } else if ('pointerLockElement' in d) {
            if (!this.pointerLockFunction) this.pointerLockFunction = function() {
                scope.pointerLockChanged(d.pointerLockElement === b);
            };
            d.removeEventListener('pointerlockchange', this.pointerLockFunction);
            d.addEventListener('pointerlockchange', this.pointerLockFunction, false);
        } else {
            console.log('ERROR: POINTER LOCK NOT SUPPORTED.');
        }

        $(document).mousedown(function(event)
        {
            if (app.getState() !== 'ingame' || app.isFocused())
                return;

            switch (event.which) {
                case 1: // Left
                    // break;
                case 2: // Middle
                case 3: // Right
                default:
                    // return;
            }

            // Ask the browser to lock the pointer.
            // event.preventDefault();
            // event.stopPropagation();
            // scope.requestPointerLock();
            // app.setFocused(true);
        });
    },

    exitPointerLock()
    {
        const d = document;
        if ('mozExitPointerLock' in d) d.mozExitPointerLock();
        else if ('exitPointerLock' in d) d.exitPointerLock();
    },

    requestPointerLockAgain()
    {
        let b = document.body;
        b.requestPointerLock();
    },

    startPointerLockedControls()
    {
        let controlsEngine = this.app.engine.controls;
        let b = document.body;
        b.requestPointerLock();

        controlsEngine.startKeyboardListeners();
        // do NOT call controlsEngine.startGamepadListeners();
        // ^ gamepad is useful for menu navigation!
        controlsEngine.resetGamepadListeners();
        controlsEngine.startMouseListeners();
        controlsEngine.startWindowListeners();
    },

    pointerLockChanged(isPointerLocked)
    {
        let app = this.app;
        app.engine.controls.threeControlsEnabled = isPointerLocked;

        if (!isPointerLocked)
        {
            app.setState('settings');
            app.setFocused(false);
        }
    }

};

export { PointerLockModule };
