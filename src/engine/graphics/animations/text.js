/**
 * Ease in / out text labels.
 */

'use strict';

let TextModule = {

    updateTextLabels(deltaT)
    {
        const graphics = this.graphics;
        const backend = graphics.app.model.backend;
        if (backend.selfModel.locked) return;

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
            label.advanceTime(deltaT);
            label.updatePosition(camera, am.p0);
        });
    },

    addLabelledEntity(textSequence, entityId, entity)
    {
        const graphics = this.graphics;
        const label = graphics.createTextLabel(textSequence);
        label.bindAudio(graphics.app.engine.audio);
        // label.setParent(null);

        const backend = graphics.app.model.backend;
        const labelledEntities = backend.entityModel.labelledEntities;

        labelledEntities.set(entityId, entity);
        entity.textComponent = label;
        return label;
    }

};

export { TextModule };
