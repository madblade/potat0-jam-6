
'use strict';

let GamepadListenerModule = {

    rotateCameraFromRightStickGamepad()
    {
        // TODO bind
        // let graphics = this.app.engine.graphics;
        // let movementX = this.touch.rightX * 12;
        // let movementY = this.touch.rightY * 16;
        // if (Math.abs(movementX) > 0 || Math.abs(movementY) > 0)
        //     graphics.cameraManager.addCameraRotationEvent(
        //         movementX, movementY, 0, 0
        //     );
    },

    movePlayerFromLeftStickGamepad()
    {
        // TODO bind true rotation to input engine
        // let clientModel = this.app.model.frontend;
        // let lx = this.touch.leftX;
        // let ly = this.touch.leftY;
        // let lastLeft = this.touch.leftLast;
        // let newLeft = [];
        // if (ly !== 0 && lx !== 0)
        // {
        //     let angle = Math.atan2(ly, lx);
        //     let pi8 = Math.PI / 8;
        // }

        // clientModel.triggerEvent('m', `${t}`);
        // this.touch.leftLast = newLeft;
    }

};

export { GamepadListenerModule };
