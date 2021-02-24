/**
 *
 */

'use strict';

let FirstPersonModule = {

    onMouseMove(event)
    {
        if (!this.threeControlsEnabled) return;
        let movementX = event.movementX;
        // ||
        //     event.mozMovementX ||
        //     event.webkitMovementX || 0;
        let movementY = event.movementY;
        // ||
        //     event.mozMovementY ||
        //     event.webkitMovementY || 0;

        const graphics = this.app.engine.graphics;
        const mouseSpeed = graphics.mouseCameraSpeed;

        movementX *= mouseSpeed;
        movementY *= mouseSpeed;
        // const then = this.now();
        // const now = this.stamp();
        // let dtInMillis = (now - then);
        // console.log(dtInMillis * Math.sqrt(movementX * movementX + movementY * movementY));
        // if (dtInMillis > 150) return;
        // if (dtInMillis <= 1) dtInMillis = 0;

        // const stamp =
        // console.log(movementX);
        //let rotation = graphics.cameraManager.moveCameraFromMouse(movementX, movementY);

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
