/**
 *
 */

'use strict';

let FirstPersonModule = {

    onMouseMove(event)
    {
        if (!this.threeControlsEnabled) return;
        let movementX = event.movementX;
        // || event.mozMovementX || event.webkitMovementX || 0;
        let movementY = event.movementY;
        // || event.mozMovementY || event.webkitMovementY || 0;

        const mouseSpeed = this.settings.mouseCameraSpeed;

        movementX *= mouseSpeed;
        movementY *= mouseSpeed;

        let cameraManager = this.app.engine.graphics.cameraManager;
        cameraManager.addCameraRotationEvent(
            movementX, movementY, 0, 0 // , dtInMillis
        );
    },

    unregisterMouseMove()
    {
        if (!this.omm) {
            console.error('[TPS] Failed to get listener.');
            return;
        }
        document.removeEventListener(
            'mousemove',
            this.omm,
            false
        );
    },

    registerMouseMove()
    {
        if (!this.omm)
        {
            this.omm = this.onMouseMove.bind(this);
        }
        document.addEventListener(
            'mousemove',
            this.omm,
            true
        );
    },

};

export { FirstPersonModule };
