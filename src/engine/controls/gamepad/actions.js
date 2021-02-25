
'use strict';

let GamepadActionModule = {

    rotateCameraFromRightStickGamepad(x, y, dtMillis) // dt in ms
    {
        let graphics = this.app.engine.graphics;

        // dt ~ 16.7 for 60Hz, 7 for 144Hz
        // 0.5 * dtMillis;
        const cameraMovingSpeed = graphics.stickCameraSpeed;

        let movementX = x;
        let movementY = y;
        movementX = Math.sign(x) * Math.pow(Math.abs(movementX), 2.);
        movementY = Math.sign(y) * Math.pow(Math.abs(movementY), 2.);
        movementX *= 2 * cameraMovingSpeed;
        movementY *= 1.1 * cameraMovingSpeed;

        if (Math.abs(movementX) > 0 || Math.abs(movementY) > 0)
        {
            graphics.cameraManager.addCameraRotationEvent(
                movementX, movementY, 0, 0, dtMillis
            );
        }
    },

    stopMovePlayerFromLeftStickGamepad()
    {
        let clientModel = this.app.model.frontend;
        clientModel.triggerEvent('m', 'vecx');
    },

    movePlayerFromLeftStickGamepad(x, y)
    {
        let clientModel = this.app.model.frontend;
        clientModel.triggerEvent(
            'm',
            'vec',
            [x, -y]
        );
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
            const sm = this.app.state;
            sm.navigate('up'); // go up once
        }
    },

    dPadDown()
    {
        if (!this.threeControlsEnabled) // menu state
        {
            const sm = this.app.state;
            sm.navigate('down'); // go up once
        }
    },

    dPadRight()
    {
        if (!this.threeControlsEnabled) // menu state
        {
            const sm = this.app.state;
            sm.navigate('right'); // go up once
        }
    },

    dPadLeft()
    {
        if (!this.threeControlsEnabled) // menu state
        {
            const sm = this.app.state;
            sm.navigate('left'); // go up once
        }
    },

    circleButton(isPressed)
    {
        if (!this.threeControlsEnabled && isPressed)
        {
            // menu back
            const sm = this.app.state;
            sm.navigate('back'); // go up once
        }
        else
        {
            let cm = this.app.model.frontend;
            cm.triggerEvent('m', isPressed ? 'u' : 'ux');
        }
    },

    crossButton(isPressed)
    {
        if (!this.threeControlsEnabled && isPressed)
        {
            // menu click
            const sm = this.app.state;
            sm.navigate('enter'); // go up once
            return;
        }

        if (this.threeControlsEnabled && isPressed)
        {
            const backend = this.app.model.backend;
            if (backend.selfModel.canTalkToCup)
                backend.entityModel.talkToHelperCup();
        }
    },

    triangleButton(isPressed)
    {
        if (this.threeControlsEnabled && isPressed)
        {
            const backend = this.app.model.backend;
            if (backend.selfModel.canTalkToCup)
                backend.entityModel.untalkToHelperCup();
        }
    }

};

export { GamepadActionModule };
