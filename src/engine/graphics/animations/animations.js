/**
 * Animation management.
 */

'use strict';

import extend           from '../../../extend';
import {
    AnimationMixer,
    Vector3
}                       from 'three';

let AnimationManager = function(graphics)
{
    this.graphics = graphics;

    this.mixers = new Map();
    this.times = new Map();
    this.clips = new Map();

    // opt.
    this._r = new Vector3();
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

            this.updateEntityRotationAndTilt(e, id);
        });
    },

    // v  Called at integration.
    updateEntityPosition(entityId, newPosition, dt)
    {
        const backend = this.graphics.app.model.backend;
        const ei = backend.entityModel.entitiesIngame;
        const e = entityId !== 0 ?
            ei.get(entityId) :
            backend.selfModel.animationComponent;
        if (!e)
        {
            console.warn(`[Animations] Entity ${entityId} not found.`);
            return;
        }

        if (!e.p0)
        {
            this.initializeEntityAnimation(e);
            e.p0.copy(newPosition);
            e.dt01 = dt;
            return;
        }

        // update positions
        e.p2.copy(e.p1);
        e.p1.copy(e.p0);
        e.p0.copy(newPosition);
        // update dts
        // e.dt12 = e.dt01;
        e.dt01 = dt;
        // update velocities
        e.v1.copy(e.v0);
        e.v0.copy(e.p1).addScaledVector(e.p0, -1);
        e.v0.multiplyScalar(1 / e.dt01); // (p1 - p0) / dt
        // update acceleration
        e.a0.copy(e.v0).addScaledVector(e.v1, -1);
        e.a0.multiplyScalar(1 / e.dt01);
    },

    updateEntityRotationAndTilt(entity, entityId)
    {
        // Init entity model if needed
        if (!entity.p0)
        {
            this.initializeEntityAnimation(entity);
            return;
        }
        const gr = this.graphics;

        const v = entity.v0;
        if (Math.abs(v.x) + Math.abs(v.y) === 0.)
            return;

        // set target
        const theta = Math.atan2(v.y, v.x) + Math.PI / 2;
        this._r.set(0, 0, theta);

        const id = entityId;
        if (id === 0)
            gr.app.model.backend.selfModel.setRotation(this._r);

        // const a = entity.a0;
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

    initializeEntityAnimation(entity)
    {
        entity.p0 = new Vector3(0, 0, 0);
        entity.p1 = new Vector3(0, 0, 0);
        entity.p2 = new Vector3(0, 0, 0);
        entity.dt01 = 0;
        // entity.dt12 = 0;
        entity.v0 = new Vector3(0, 0, 0);
        entity.v1 = new Vector3(0, 0, 0);
        entity.a0 = new Vector3(0, 0, 0);
    }

});

export { AnimationManager };
