/**
 * Animation management.
 */

'use strict';

import extend              from '../../../extend';
import { AnimationModel }  from './animations.model';
import { AnimationOuter }  from './animations.outer';
import { AnimationMixers } from './animations.mixers';
import {
    AnimationMixer,
    Vector2,
    Vector3
}                          from 'three';

let AnimationManager = function(graphics)
{
    this.graphics = graphics;

    this.mixers = new Map();
    this.times = new Map();
    this.clips = new Map();

    // opt.
    this._r = new Vector3();
    this._xy = new Vector2();
};

extend(AnimationManager.prototype, {

    initializeAnimations()
    {
        this.mixers = new Map();
        this.times = new Map();
        this.clips = new Map();
    },

    updateAnimations(deltaT)
    {
        const backend = this.graphics.app.model.backend;
        const entitiesIngame = backend.entityModel.entitiesIngame;

        this.mixers.forEach((m, id) =>
        {
            const e = id !== 0 ?
                entitiesIngame.get(id) :
                backend.selfModel.animationComponent;
            if (!e)
            {
                console.warn('[Animations] Lone animation mixer.');
                return;
            }

            this.updateEntityPosition(id, id === 0 ?
                backend.selfModel.position : e.position, deltaT);
            this.updateEntityRotationAndTilt(e, id, deltaT);
            this.updateMixerAction(e, id, deltaT);
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

    addSkinnedEntityAnimation(entityId, mesh)
    {
        const mixers = this.mixers;
        const times = this.times;
        const mixer = new AnimationMixer(mesh);
        mixers.set(entityId, mixer);
        times.set(entityId, Date.now());
    },

});

extend(AnimationManager.prototype, AnimationModel);
extend(AnimationManager.prototype, AnimationOuter);
extend(AnimationManager.prototype, AnimationMixers);

export { AnimationManager };
