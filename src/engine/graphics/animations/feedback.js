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
        //  1. asymptotic smoothing of camera position
        const currentCP = this.currentCameraPosition;
        // const oldCP = this.oldCameraPosition;
        const newCP = this.newCameraPosition;
        if (currentCP.manhattanDistanceTo(newCP) > 0.)
        {
            const ratioTo60FPS = deltaT / 16;
            // const delta = ratioTo60FPS;
            // progress 10% each 16ms.
            const vecToTarget = this._w0;
            vecToTarget.set(
                ratioTo60FPS * 0.4 * (newCP.x - currentCP.x),
                ratioTo60FPS * 0.4 * (newCP.y - currentCP.y),
                ratioTo60FPS * 0.1 * (newCP.z - currentCP.z),
            );
            currentCP.add(vecToTarget);
        }

        // XXX feedback shaking exactly here
        // decay trauma

        // TODO
        //  2. correction camera vs wall

        // Apply.
        mainCamera.setCameraPosition(currentCP.x, currentCP.y, currentCP.z);
    },

    resetCameraFeedback()
    {
        // TODO revert camera position!
        const graphics = this.graphics;
        const manager = graphics.cameraManager;
        const mainCamera = manager.mainCamera;

        const newCP = this.newCameraPosition;
        mainCamera.setCameraPosition(newCP.x, newCP.y, newCP.z);
    }

};

export { FeedbackModule };
