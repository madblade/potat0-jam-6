/**
 *
 */

'use strict';

let TouchListenerModule = {

    onLeftStickMove(x, y)
    {
        this.touch.leftX = x;
        this.touch.leftY = y;
    },

    onRightStickMove(x, y)
    {
        this.touch.rightX = x;
        this.touch.rightY = y;
    },

    onButtonChange(which, isHeld)
    {
        // console.log(`Button ${which} ${isHeld ? 'pressed' : 'released'}.`);
        let clientModel = this.app.model.frontend;
        switch (which) {
            case 'triangle':
                break;
            case 'cross':
                this.requestMainHandItemAction(!isHeld);
                break;
            case 'circle': // jump
                if (isHeld) clientModel.triggerEvent('m', 'u');
                else if (!isHeld) clientModel.triggerEvent('m', 'ux');
                break;
            case 'square':
                this.requestSecondaryHandItemAction(!isHeld);
                break;
            case 'dpadLeft':
                if (isHeld)
                    clientModel.triggerChange('interaction', ['itemSelect', 1]);
                break;
            case 'dpadRight':
                if (isHeld)
                    clientModel.triggerChange('interaction', ['itemSelect', -1]);
                break;
            case 'dpadDown':
                clientModel.triggerChange('camera', ['toggle']);
                break;
            case 'dpadUp':
                if (isHeld)
                    clientModel.triggerChange('camera', ['toggle']);
                break;
            case 'home': // Only on press
                if (isHeld) this.touchControlsStatusChanged(false);
                break;
        }
    },

    rotateCameraFromRightStickTouch(deltaT)
    {
        let graphics = this.app.engine.graphics;
        let movementX = this.touch.rightX * 12;
        let movementY = this.touch.rightY * 16;
        if (Math.abs(movementX) > 0 || Math.abs(movementY) > 0)
            graphics.cameraManager.addCameraRotationEvent(
                movementX, movementY, 0, 0, deltaT
            );
    },

    movePlayerFromLeftStickTouch()
    {
        let clientModel = this.app.model.frontend;
        let lx = this.touch.leftX;
        let ly = this.touch.leftY;
        let lastLeft = this.touch.leftLast;
        let newLeft = [];
        if (ly !== 0 && lx !== 0)
        {
            let angle = Math.atan2(ly, lx);
            let pi8 = Math.PI / 8;
            switch (true) {
                case angle < -7 * pi8 || angle > 7 * pi8:
                    newLeft.push('l');
                    break;
                case angle < -5 * pi8:
                    newLeft.push('f', 'l');
                    break;
                case angle < -3 * pi8:
                    newLeft.push('f');
                    break;
                case angle < -pi8:
                    newLeft.push('f', 'r');
                    break;
                case angle > 5 * pi8:
                    newLeft.push('b');
                    break;
                case angle > 3 * pi8:
                    newLeft.push('b', 'l');
                    break;
                case angle > pi8:
                    newLeft.push('b', 'r');
                    break;
                default:
                    newLeft.push('r');
                    break;
            }
        }

        if (newLeft.length > 2)
            console.error('[Touch] too many events detected.');
        for (let i = 0; i < newLeft.length; ++i)
        {
            let t = newLeft[i];
            if (lastLeft.indexOf(t) < 0)
                clientModel.triggerEvent('m', `${t}`);
        }
        for (let i = 0; i < lastLeft.length; ++i)
        {
            let t = lastLeft[i];
            if (newLeft.indexOf(t) < 0)
                clientModel.triggerEvent('m', `${t}x`);
        }
        this.touch.leftLast = newLeft;
    }

};

export { TouchListenerModule };
