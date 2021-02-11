
'use strict';

let GamepadActionModule = {

    rotateCameraFromRightStickGamepad(x, y)
    {
        let graphics = this.app.engine.graphics;
        let movementX = x * 12;
        let movementY = y * 16;
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
    }

};

export { GamepadActionModule };
