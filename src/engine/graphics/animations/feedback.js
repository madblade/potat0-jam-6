/**
 * Feedback effects such as camera shake, etc.
 */

'use strict';

let FeedbackModule = {

    saveOldRotation(oldPitchRotationX, oldYawRotationZ)
    {
        this.oldPitchRotationX = oldPitchRotationX;
        this.oldYawRotationZ = oldYawRotationZ;
    },

    saveNewRotation(newPitchRotationX, newYawRotationZ)
    {
        this.newPitchRotationX = newPitchRotationX;
        this.newYawRotationZ = newYawRotationZ;
    },

    saveOldPosition(oldPosition)
    {
        this.oldCameraPosition.copy(oldPosition);
    },

    saveNewPosition(newPosition)
    {
        this.newCameraPosition.copy(newPosition);
    },

    updateCameraFeedback(deltaT)
    {
        const graphics = this.graphics;
        const manager = graphics.cameraManager;
        const mainCamera = manager.mainCamera;
        const raycastCamera = manager.mainRaycasterCamera;

        // (like camera lagging behind)

        // TODO
        //  1. smoothing camera position (go to target)
        //  2. correction camera vs wall

        // XXX feedback shaking
    },

    resetCameraFeedback()
    {
        // TODO revert camera position!
    }

};

export { FeedbackModule };
