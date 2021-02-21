/**
 * Ease in / out text labels.
 */

'use strict';

let TextModule = {

    updateTextLabels(deltaT)
    // TODO deltaT can be used for smooth feedback
    {
        const graphics = this.graphics;
        const backend = graphics.app.model.backend;
        const labelledEntities = backend.entityModel.labelledEntities;
        const mainCameraWrapper = graphics.cameraManager.mainCamera;
        const camera = mainCameraWrapper.getRecorder();

        labelledEntities.forEach((entity, id) =>
        {
            const label = entity.textComponent;
            if (!label && this._debug)
            {
                console.warn(
                    `[Animations/Label] Labelled entity ${id} has no label.`
                );
                return;
            }

            label.updatePosition(camera);
        });
    }

};

export { TextModule };
