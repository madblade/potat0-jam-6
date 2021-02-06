/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend      from '../../../extend';
import { Vector3 } from 'three';

let Integrator = function(sweeper)
{
    this.sweeper = sweeper;
    this.physics = sweeper.physics;

    // Internals / don’t reallocate.
    this._w0 = new Vector3();
    this._w1 = new Vector3();
    this._w2 = new Vector3();
};

extend(Integrator.prototype, {

    integrateMovement(relativeDt)
    {
        const outOfDateEntities = this.sweeper.entitiesNeedingToMove;
        outOfDateEntities.forEach(e => this.integrateEntity(e, relativeDt));
    },

    integrateEntity(entity, relativeDt)
    {
        const cm = entity.collisionModel;
        if (cm.isStatic)
        {
            console.warn(
                `[Integrator] Trying to integrate a static entity ${entity}.`
            );
        }

        const p0 = cm.position0; const p1 = cm.position1;
        const v0 = cm.velocity0; const v1 = cm.velocity1;
        const a0 = cm.accelera0; const a1 = cm.accelera1;
        const g = cm.gravity;
        const sumOfForces = this._w0;
        const increment = this._w1;
        sumOfForces.copy(g);

        if (cm.isSubjectToContinuousForce)
        {
            let cf = cm.continuousForces;
            for (let i = 0; i < cf.length; ++i)
                sumOfForces.add(cf[i]);
        }

        // console.log(`Integrating ${entity.entityId}.`);

        const localTimeDilation = this.physics.getTimeDilation(p0, entity);
        let dtr = relativeDt * localTimeDilation; // dtr = 1 / fps
        dtr = 0.016; // TODO variable dt
        // dtr = 0.1;
        // dtr = 0.05;
        const inWater = this.physics.isWater(p0);
        const maxSpeed = inWater ?
            cm.maxSpeedInWater : cm.maxSpeedInAir;

        // Compute Leapfrog increment
        const dtr2h = .5 * dtr * dtr;
        increment.set(
            v0.x * dtr + dtr2h * a0.x,
            v0.y * dtr + dtr2h * a0.y,
            v0.z * dtr + dtr2h * a0.z,
        );
        const maxSpeedDtr = maxSpeed;// * dtr;
        let l = increment.length();
        if (l > maxSpeedDtr) increment.multiplyScalar(maxSpeedDtr / l);
        // console.log(p0);

        // TODO [GAMEPLAY] here go gameplay specifics
        // (jump, double/wall-jump, water, push, feedback, etc.)
        // (self movement uses Euler integration!)
        const wv = cm.wantedVelocity;
        let iv = cm.instantaneousVelocity; // scalar
        const ia = cm.instantaneousAcceleration; // scalar
        const selfIncrement = this._w2;
        iv = Math.min(iv + ia * dtr, 1.0);
        selfIncrement.copy(wv).multiplyScalar(iv);
        cm.instantaneousVelocity = iv; // Apply Euler integration
        increment.add(selfIncrement);

        // Apply Leapfrog integration
        p1.copy(p0).add(increment);
        a1.copy(sumOfForces);
        v1.copy(a0).add(a1).multiplyScalar(0.5 * dtr).add(v0);
        l = v1.length();
        if (l > maxSpeedDtr) v1.multiplyScalar(maxSpeedDtr / l);
    },

    applyIntegration() // Swap p0 and p1
    {
        const outOfDateEntities = this.sweeper.entitiesNeedingToMove;
        outOfDateEntities.forEach(e => this.applyIntegrationTo(e));
    },

    applyIntegrationTo(entity)
    {
        const cm = entity.collisionModel;
        if (cm.isStatic)
            throw Error('[Integrator] Can’t integrate a static entity.');

        cm.position0.copy(cm.position1);
        cm.velocity0.copy(cm.velocity1);
        cm.accelera0.copy(cm.accelera1);
        // cm.velocity1.set(0, 0, 0);
        // cm.accelera1.set(0, 0, 0);

        if (cm.isCharacter)
        {
            cm.wasLifted = false;
            cm.wasLiftedByAStaticObject = false;
        }

        // Apply to sweeper model.
        this.sweeper.updateOrderedArraysAfterMove(entity.entityId);

        // Update collision model (aabb centers)
        entity.center.copy(cm.position0);
        cm.updateCollisionModelAfterMovement();

        // Notify server model.
        if (entity.entityId === 0)
        {
            const app = this.physics.physics.app;
            const sm = app.model.backend.selfModel;
            sm.updateSelf(cm.position0.toArray(), cm.rotation0, -1);
            // window.dh.h.position.set(
            //     cm.position0.x, cm.position0.y, cm.position0.z + 0.5);

            // sm.updateSelf([0, 0, 1], [0, 0, 0, 0], -1);
            cm.lifterHelper.position.copy(cm.lifterCenter);
            cm.bumperHelper.position.copy(cm.bumperCenter);
        }
    }

});

export { Integrator };
