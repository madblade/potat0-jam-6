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

            const text = label.getText();
            if (!text || text.length < 1) return;
            const am = entity.animationComponent;
            label.updatePosition(camera, am.p0);
        });
    },

    addLabelledEntity(initialText, entityId, entity)
    {
        const graphics = this.graphics;
        const label = graphics.createTextLabel(initialText || 'no text');
        // label.setParent(null);

        const backend = graphics.app.model.backend;
        const labelledEntities = backend.entityModel.labelledEntities;

        labelledEntities.set(entityId, entity);
        entity.textComponent = label;
        return label;
    }

};

export { TextModule };
