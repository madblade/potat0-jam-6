/**
 * Animation management.
 */

'use strict';

import extend, { assert }   from '../../../extend';

import { $ }                from '../../../modules/polyfills/dom';

import { AnimationModel }   from './animations.model';
import { AnimationOuter }   from './animations.outer';
import { AnimationMixers }  from './animations.mixers';
import { TextModule }       from './text';
import { FeedbackModule }   from './feedback';
import { SecondaryModule }  from './secondary';
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

    // feedback.
    this.oldCameraPosition = new Vector3(0, 0, 0);
    this.newCameraPosition = new Vector3(0, 0, 0);
    this.oldPitchRotationX = 0;
    this.oldYawRotationZ = 0;
    this.newPitchRotationX = 0;
    this.newYawRotationZ = 0;
    this.trauma = 0;
    this.decayRate = 0;

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

        // IK / Secondary physics.
        this.updateSecondaryAnimations(deltaT);

        // Camera effects.
        this.updateCameraFeedback(deltaT);

        // Text element update.
        this.updateTextLabels(deltaT);
    },

    restore()
    {
        this.resetCameraFeedback();
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

    cleanup()
    {
        // remove all text labels
        $('.text-label').empty().remove();
    }

});

extend(AnimationManager.prototype, AnimationModel);
extend(AnimationManager.prototype, AnimationOuter);
extend(AnimationManager.prototype, AnimationMixers);
extend(AnimationManager.prototype, TextModule);
extend(AnimationManager.prototype, FeedbackModule);
extend(AnimationManager.prototype, SecondaryModule);

export { AnimationManager };
