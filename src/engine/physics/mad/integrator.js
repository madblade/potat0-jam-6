/**
 * (c) madblade 2021 all rights reserved
 *
 * Integration routines (leapfrog).
 */

'use strict';

import extend, { assert }   from '../../../extend';

import {
    Vector2,
    Vector3
}                           from 'three';

let Integrator = function(sweeper)
{
    this.sweeper = sweeper;
    this.physics = sweeper.physics;

    // Internals / don’t reallocate.
    this._w0 = new Vector3();
    this._w1 = new Vector3();
    this._w2 = new Vector3();
    this._vec20 = new Vector2();
};

extend(Integrator.prototype, {

    integrateMovement(relativeDt)
    {
        const outOfDateEntities = this.sweeper.entitiesNeedingToMove;
        outOfDateEntities.forEach(e =>
            this.integrateEntity(e, relativeDt)
        );
    },

    integrateEntity(entity, relativeDt)
    {
        const cm = entity.collisionModel;
        assert(!cm.isStatic,
            `[Integrator] Trying to integrate a static entity ${entity}.`
        );

        const p0 = cm.position0; const p1 = cm.position1;
        const v0 = cm.velocity0; const v1 = cm.velocity1;
        const a0 = cm.accelera0; const a1 = cm.accelera1;
        const g = cm.gravity;
        const increment = this._w1;
        const sumOfForces = this._w0;

        // Sum forces.
        sumOfForces.copy(g);
        if (cm.isSubjectToContinuousForce)
        {
            let cf = cm.continuousForces;
            for (let i = 0; i < cf.length; ++i)
                sumOfForces.add(cf[i]);
        }

        // Jump.
        if (cm.isJumping)
        {
            // console.log('in air');
            cm.timeSinceJumpStarted += relativeDt;
            cm.numberOfIterationsInAir += 1;
            if (cm.numberOfIterationsInAir < 2)
            {
                // console.log('rejump');
                // const jumpHeight = 2.5; // 0.72 -> 6.969
                // const rh = jumpHeight - 1.969; // + 0.72;
                // const targetA0 = 2 * rh / (relativeDt * relativeDt);
                // a0.z = targetA0 / 8;
            }
        }
        if (cm.isPreparingJump)
        {
            // console.log('waiting.');
            cm.timeSincePreparedJump += relativeDt;
            if (cm.timeSincePreparedJump > cm.timeToPrepareJump)
            {
                // console.log('Jump!');
                cm.isJumping = true;
                cm.isPreparingJump = false;
                cm.timeSinceJumpStarted = 0;
                cm.numberOfIterationsInAir = 0;
                // const jumpHeight = 2.5; // 0.72 -> 6.969
                const jumpHeight = 2.5; // 0.72 -> 6.969
                const rh = jumpHeight - 1.969; // + 0.72;
                const targetA0 = 2 * rh / (relativeDt * relativeDt);
                a0.z = targetA0 / 4;
                // const targetV0 = 2 * rh / (relativeDt);
                // v0.z = targetV0 / 4;
                // a1.z = targetA1 * 7 / 8;
                // sumOfForces.z = targetA1 / 2;
                // sumOfForces.z = targetA0 / 2;
                // ^  we don’t know how much the next dt is gonna be :(
            }
        }
        const wv = cm.wantedVelocity;
        if (wv.z > 0 && cm.onGround &&
            !cm.isPreparingJump && !cm.isJumping)
        {
            cm.isPreparingJump = true;
            cm.timeSincePreparedJump = 0;
            cm.isRecoveringFromLanding = false;
            // console.log('preparing jump');
        }

        // console.log(`Integrating ${entity.entityId}.`);

        const localTimeDilation = this.physics.getTimeDilation(p0, entity);
        let dtr = relativeDt * localTimeDilation; // dtr = 1 / fps
        if (dtr > 0.05)
        {
            console.warn(`[Integrator] Large DT: ${dtr}.`);
            dtr = 0.016;
        }
        const inWater = this.physics.isWater(p0);
        const maxSpeed = inWater ?
            cm.maxSpeedInWater : cm.maxSpeedInAir;

        // Compute Leapfrog increment.
        const dtr2h = .5 * dtr * dtr;
        increment.set(
            v0.x * dtr + dtr2h * a0.x,
            v0.y * dtr + dtr2h * a0.y,
            v0.z * dtr + dtr2h * a0.z,
        );
        const maxSpeedDtr = maxSpeed * dtr;

        // TODO [GAMEPLAY] here go gameplay specifics
        // (jump, double/wall-jump, water, push, feedback, etc.)
        // (self movement uses Euler integration!)
        // max wv is ~ 1.1
        if (wv.manhattanLength() > 0)
        // && !cm.isRecoveringFromLanding && !cm.isPreparingJump)
        {
            const selfIncrement = this._w2;

            let wx = wv.x;
            let wy = wv.y;
            const iaXY = cm.instantaneousAccelerationXY;
            const acc = 1. / cm.timeToReachMaxVel;

            const ivXY = cm.instantaneousVelocityXY;
            const delta = this._vec20;
            delta.set(wx, wy);
            iaXY.copy(delta).normalize().multiplyScalar(acc);
            iaXY.multiplyScalar(dtr);
            ivXY.add(iaXY); // v1 = v0 + (a0 * dt)
            if (ivXY.lengthSq() > wx * wx + wy * wy)
            {
                ivXY.set(wx, wy);
            }

            // const dz = wv.z > 0 && cm.onGround ? wv.z : 0;
            selfIncrement.set(
                ivXY.x * maxSpeedDtr,
                ivXY.y * maxSpeedDtr,
                0
            );
            increment.add(selfIncrement);
        }

        // Clamp max speed (horizontal).
        const lxy = Math.sqrt(
            increment.x * increment.x +
            increment.y * increment.y
        );
        if (lxy > maxSpeedDtr)
        {
            increment.x *= maxSpeedDtr / lxy;
            increment.y *= maxSpeedDtr / lxy;
        }

        // Apply Leapfrog integration.
        p1.copy(p0).add(increment);
        a1.copy(sumOfForces);
        v1.copy(a0).add(a1).multiplyScalar(0.5 * dtr).add(v0);

        // Clamp max speed (vertical + horizontal).
        const l = v1.length();
        if (l > maxSpeed)
        {
            v1.multiplyScalar(maxSpeed / l);
        }
    },

    applyIntegration(dt) // Swap p0 and p1
    {
        const outOfDateEntities = this.sweeper.entitiesNeedingToMove;
        outOfDateEntities.forEach(e => this.applyIntegrationTo(e, dt));
    },

    applyIntegrationTo(entity) //, dt)
    {
        const cm = entity.collisionModel;
        if (cm.isStatic)
            throw Error('[Integrator] Can’t integrate a static entity.');

        cm.position0.copy(cm.position1);
        cm.velocity0.copy(cm.velocity1);
        cm.accelera0.copy(cm.accelera1);

        const p = window.dh.sg1.position;
        p.set(0, 0, Math.max(p.z, cm.position0.z));

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
        const app = this.physics.physics.app;
        if (entity.entityId === 0)
        {
            const sm = app.model.backend.selfModel;
            sm.updateSelf(cm.position0, cm.rotation0, -1);
            cm.lifterHelper.position.copy(cm.lifterCenter);
            cm.bumperHelper.position.copy(cm.bumperCenter);
        }
        else
        {
            const em = app.model.backend.entityModel;
            const updates = {};
            updates[entity.entityId] = {
                p: cm.position0,
                r: cm.rotation0,
                w: -1,
                // d: null
            };
            em.updateEntities(updates);
            if (!cm.isCharacter)
            {
                console.error(
                    `[Integrator] Entity ${entity.entityId} is dynamic but not a character.`
                );
            }
            cm.lifterHelper.position.copy(cm.lifterCenter);
            cm.bumperHelper.position.copy(cm.bumperCenter);
        }
    },

    cleanup()
    {
        this._w0.set(0, 0, 0);
        this._w1.set(0, 0, 0);
        this._w2.set(0, 0, 0);
    }

});

export { Integrator };
