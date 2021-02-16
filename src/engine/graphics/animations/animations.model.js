/**
 * Holds / manages models for
 * entity positions, velocities, accelerations.
 */

'use strict';

import {
    Vector2,
    Vector3
} from 'three';

let AnimationModel = {

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

        // z rotation interpolation
        entity.theta0 = initialTheta;
        entity.theta1 = entity.theta0;
        entity.currentTheta = entity.theta0;
        entity.thetaT = 0;

        // tilt interpolation
        entity.xy0 = new Vector2(0, 0);
        entity.xy1 = new Vector2(0, 0);
        entity.currentXY = new Vector2(0, 0);
        entity.xyT = 0;
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

};

export { AnimationModel };
