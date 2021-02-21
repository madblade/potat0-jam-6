/**
 * Animation management.
 */

'use strict';

import extend, { assert }   from '../../../extend';

import { AnimationModel }   from './animations.model';
import { AnimationOuter }   from './animations.outer';
import { AnimationMixers }  from './animations.mixers';
import {
    AnimationMixer,
    Vector2,
    Vector3
}                           from 'three';

let AnimationManager = function(graphics)
{
    this.graphics = graphics;

    this.mixers = new Map();
    this.times = new Map();
    this.clips = new Map();

    // opt.
    this._r = new Vector3();
    this._xy = new Vector2();

    // flags.
    this._debug = true;
};

extend(AnimationManager.prototype, {

    initializeAnimations()
    {
        this.mixers = new Map();
        this.times = new Map();
        this.clips = new Map();
    },

    refresh(deltaT)
    {
        // Skinned / morphed mixers + secondary physics update.
        this.updateAnimations(deltaT);

        this.updateCameraFeedback(deltaT);

        // Text element update.
        this.updateTextLabels(deltaT);
    },

    updateAnimations(deltaT)
    {
        const backend = this.graphics.app.model.backend;
        const entitiesIngame = backend.entityModel.entitiesIngame;

        this.mixers.forEach((m, id) =>
        {
            const entityModel = id !== 0 ?
                entitiesIngame.get(id) :
                backend.selfModel;

            assert(!!entityModel, '[Animations] Lone animation mixer.');
            if (!entityModel) return;

            const animationComponent = entityModel.animationComponent;

            this.updateEntityPosition(
                entityModel,
                animationComponent,
                deltaT
            );

            this.updateEntityRotationAndTilt(
                entityModel,
                animationComponent,
                deltaT
            );

            this.updateMixerAction(
                entityModel,
                animationComponent,
                m,
                deltaT
            );
        });
    },

    updateAnimation(entityId)
    {
        const mixer = this.mixers.get(entityId);
        const prevTime = this.times.get(entityId);
        if (mixer) {
            const time = Date.now();
            mixer.update((time - prevTime) * 0.001);
            this.times.set(entityId, time);
        } else {
            // console.log('[Animations] Undefined mixer.');
        }
    },

    addSkinnedEntityAnimation(entityId, mesh, entityModel)
    {
        const mixers = this.mixers;
        const times = this.times;
        const mixer = new AnimationMixer(mesh);
        mixers.set(entityId, mixer);
        times.set(entityId, Date.now());
        this.setupMixer(entityId, mesh, mixer, entityModel);
    },

    updateCameraFeedback(deltaT)
    {
        const graphics = this.graphics;
        const mainCamera = graphics.cameraManager.mainCamera;

        // TODO Here manage shaking and other effects.
    },

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

});

extend(AnimationManager.prototype, AnimationModel);
extend(AnimationManager.prototype, AnimationOuter);
extend(AnimationManager.prototype, AnimationMixers);

export { AnimationManager };
