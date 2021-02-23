/**
 * Feedback effects such as camera shake, etc.
 */

'use strict';

let FeedbackModule = {

    updateCameraFeedback(deltaT)
    {
        const graphics = this.graphics;
        const mainCamera = graphics.cameraManager.mainCamera;

        // TODO [CRIT] Here manage shaking and other effects.
        // (like camera lagging behind)

        // correction camera vs wall
    },

};

export { FeedbackModule };
