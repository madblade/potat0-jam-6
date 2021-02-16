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

            this.updateEntityPosition(id, id === 0 ? backend.selfModel.position : e.position, deltaT);
            this.updateEntityRotationAndTilt(e, id, deltaT);
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
            const initialTheta = entityId !== 0 ? e.rotation.z : backend.selfModel.rotation.z;
            this.initializeEntityAnimation(e, initialTheta);
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

    updateEntityRotationAndTilt(entity, entityId, deltaT)
    {
        // Init entity model if needed
        const initialTheta = entityId === 0 ?
            this.graphics.app.model.backend.selfModel.avatar.rotation.z :
            entity.rotation.z;
        if (!entity.p0)
        {
            this.initializeEntityAnimation(entity, initialTheta);
            return;
        }
        const gr = this.graphics;

        // Rotation target.
        const v = entity.v0;
        const id = entityId;
        const pi = Math.PI;
        if (Math.abs(v.x) + Math.abs(v.y) > 0.)
        {
            let theta = Math.atan2(v.y, v.x) - pi / 2;
            // Clamp theta between [-pi, pi].
            if (theta > pi) theta -= 2 * pi;
            else if (theta < -pi) theta += 2 * pi;
            else if (theta > 2 * pi || theta < -2 * pi)
                throw Error('[Animations] Invalid target theta.');

            // Set rotation target.
            if (!this.almostEqual(entity.theta1, theta))
            {
                console.log(`${initialTheta} -> ${theta}`);
                // Update rotation target.
                if (entity.theta1 !== entity.theta0) // was rotating
                {
                    entity.thetaT = 0.1;
                    entity.theta0 = initialTheta;
                    entity.theta1 = theta;
                }
                else // was not rotating
                {
                    entity.thetaT = 0;
                    entity.theta0 = initialTheta;
                    entity.theta1 = theta;
                }
            }
        }

        // Rotation interpolate.
        if (entity.currentTheta !== entity.theta1)
        {
            const sourceTheta = entity.theta0;
            const targetTheta = entity.theta1;
            entity.thetaT += deltaT / 1e3;
            const t = this.smoothstep(0, .300, entity.thetaT);
            // const t = this.lerp(0, .500, entity.thetaT);

            if (t === 1) // End interpolation
            {
                entity.currentTheta = entity.theta1;
            }
            else
            {
                let targetTheta2 = targetTheta;
                // Target - source should be < pi.
                if (Math.abs(sourceTheta - targetTheta2) > pi)
                {
                    // Choose shortest path.
                    targetTheta2 =
                        targetTheta > sourceTheta ? targetTheta - 2 * pi :
                            targetTheta < sourceTheta ? targetTheta + 2 * pi : null;
                    if (targetTheta2 === null || Math.abs(sourceTheta - targetTheta2) > pi)
                        throw Error('[Animations] still target delta > pi.');
                }

                // Clamp result to [-pi, pi].
                let ct = t * targetTheta2 + (1 - t) * sourceTheta;
                if (ct > pi) ct -= 2 * pi;
                else if (ct < -pi) ct += 2 * pi;
                entity.currentTheta = ct;
            }

            if (id === 0)
            {
                const sm = gr.app.model.backend.selfModel;
                this._r.set(0, 0, entity.currentTheta);
                sm.setRotation(this._r);
            }
        }
        else
        {
            entity.theta0 = entity.theta1;
        }

        // const a = entity.a0;
    },

    almostEqual(t1, t2)
    {
        return Math.abs(t1 - t2) < 0.00001;
    },

    lerp(end1, end2, t)
    {
        return this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
    },

    smoothstep(end1, end2, t)
    {
        const x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
        return x * x * (3 - 2 * x);
    },

    clamp(t, low, high)
    {
        return Math.min(high, Math.max(low, t));
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

    initializeEntityAnimation(entity, initialTheta)
    {
        entity.p0 = new Vector3(0, 0, 0);
        entity.p1 = new Vector3(0, 0, 0);
        entity.p2 = new Vector3(0, 0, 0);
        entity.dt01 = 0;
        // entity.dt12 = 0;
        entity.v0 = new Vector3(0, 0, 0);
        entity.v1 = new Vector3(0, 0, 0);
        entity.a0 = new Vector3(0, 0, 0);

        // initialTheta
        entity.theta0 = initialTheta - Math.PI;
        entity.theta1 = entity.theta0;
        entity.currentTheta = entity.theta0;
        entity.thetaT = 0;
    }

});

export { AnimationManager };
