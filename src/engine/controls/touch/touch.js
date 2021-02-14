/**
 * Handles mobile user interface.
 */

'use strict';

import extend                   from '../../../extend';

import { TouchListenerModule }  from './listeners';
import { MobileWidgetControls } from './MobileWidgetControls';

let TouchModule = {

    setupTouchWidget()
    {
        let widget = document.getElementById('widget');

        let widgetControls = new MobileWidgetControls(
            widget,
            this.onLeftStickMove.bind(this),
            this.onRightStickMove.bind(this),
            this.onButtonChange.bind(this),
            'playstation'
        );
        widgetControls.element.style.visibility = 'hidden';
        return widgetControls;
    },

    // Setup listener
    setupTouch()
    {},

    // Activate listeners
    startTouchListeners()
    {
        if (!this.isTouch)
        {
            console.error('[Touch] Trying to initialize touch on non-touch device.');
            return;
        }
        console.log('[Touch] Starting touch listeners.');

        // Reset sticks
        let touch = this.touch;
        touch.leftX = touch.leftY = 0;
        touch.rightX = touch.rightY = 0;
        touch.rx = touch.ry = 0;
        touch.leftLast = [];

        let widget = this.touchWidgetControls;
        widget.init();
        widget.element.style.visibility = 'visible';
        widget.startWidgetListeners();
    },

    stopTouchListeners()
    {
        let widget = this.touchWidgetControls;
        widget.stopWidgetListeners();
        widget.element.style.visibility = 'hidden';
    },

    // v This is the entrypoint.
    startTouchControls()
    {
        this.touchControlsEnabled = true;
        let controlsEngine = this.app.engine.controls;
        controlsEngine.startTouchListeners();
        controlsEngine.startWindowListeners();
    },

    touchControlsStatusChanged(isTouchEnabled)
    {
        // Exits from lock status.
        let app = this.app;
        app.engine.controls.touchControlsEnabled = isTouchEnabled;

        if (!isTouchEnabled) {
            app.setState('settings');
            app.setFocused(false);
        }
    },

    updateControlsTouchDevice()
    {
        if (!this.isTouch) return;
        if (!this.touchControlsEnabled) return;

        // Update widget model and visual.
        this.touchWidgetControls.animate();

        // Right stick: camera movement
        this.rotateCameraFromRightStickTouch();

        // Left stick: player movement
        this.movePlayerFromLeftStickTouch();
    },
};

extend(TouchModule, TouchListenerModule);

export { TouchModule };
