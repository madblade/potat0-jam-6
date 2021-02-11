
'use strict';

let GamepadActionModule = {

    rotateCameraFromRightStickGamepad(x, y, dtMillis) // dt in ms
    {
        let graphics = this.app.engine.graphics;

        // dt ~ 16.7 for 60Hz, 7 for 144Hz
        const cameraMovingSpeed = dtMillis / 2;

        let movementX = x * 2 * cameraMovingSpeed;
        let movementY = y * 1 * cameraMovingSpeed;
        if (Math.abs(movementX) > 0 || Math.abs(movementY) > 0)
            graphics.cameraManager.addCameraRotationEvent(
                movementX, movementY, 0, 0
            );
    },

    stopMovePlayerFromLeftStickGamepad()
    {
        let clientModel = this.app.model.frontend;
        clientModel.triggerEvent('m', 'vecx');
    },

    movePlayerFromLeftStickGamepad(x, y)
    {
        let clientModel = this.app.model.frontend;
        clientModel.triggerEvent('m', 'vec', [x * 0.1, -y * 0.1]);
    },

    goToHomeMenu()
    {
        this.exitPointerLock();
    },

    // Menu / select methods.

    dPadUp()
    {
        if (!this.threeControlsEnabled) // menu state
        {
            // go up once
        }
    },

    dPadDown()
    {
    },

    dPadRight()
    {
    },

    dPadLeft()
    {
    },

    circleButton(isPressed)
    {
        if (!this.threeControlsEnabled && isPressed)
        {
            // menu back
        }
    },

    crossButton(isPressed)
    {
        if (!this.threeControlsEnabled && isPressed)
        {
            // menu click
        }
    }

};

export { GamepadActionModule };
