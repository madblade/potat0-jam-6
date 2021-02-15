/**
 * Animation management.
 */

'use strict';

import extend from '../../../extend';

let AnimationManager = function(graphics)
{
    this.graphics = graphics;

    this.mixers = new Map();
    this.times = new Map();
    this.clips = new Map();
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
            const e = entitiesIngame.get(id);
            if (!e)
            {
                console.warn('[Animations] Lone animation mixer.');
                return;
            }
        });
    },

    updateAnimation(entityId)
    {
        let mixer = this.mixers.get(entityId);
        let prevTime = this.times.get(entityId);
        if (mixer) {
            let time = Date.now();
            mixer.update((time - prevTime) * 0.001);
            this.times.set(entityId, time);
        } else {
            // console.log('[Animations] Undefined mixer.');
        }
    },

    addEntityAnimation(entityId, mixer)
    {
        let mixers = this.mixers;
        let times = this.times;
        mixers.set(entityId, mixer);
        times.set(entityId, Date.now());
    }

});

export { AnimationManager };
