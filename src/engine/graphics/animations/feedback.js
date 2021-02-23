/**
 * Feedback effects such as camera shake, etc.
 */

'use strict';

let FeedbackModule = {

    updateCameraFeedback(deltaT)
    {
        const graphics = this.graphics;
        const mainCamera = graphics.cameraManager.mainCamera;

        // (like camera lagging behind)

        // TODO
        //  0. save previous camera position @updateCameraPosition()
        //  1. correction camera vs wall
        //  2. smoothe camera position (go to target)

        // XXX feedback shaking
    },

    resetCameraFeedback()
    {
        // TODO revert camera position!
    }

};

export { FeedbackModule };
