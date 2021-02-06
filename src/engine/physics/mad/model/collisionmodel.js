/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend                        from '../../../../extend';
import { Vector2, Vector3, Vector4 } from 'three';

const AABB_EPS = 0.00001;

let CollisionModel = function(
    physicsEntity, collisionSettings, engine
)
{
    this.entity = physicsEntity;

    // Bounding sphere
    this.aabbCenter = new Vector3();
    this.aabbXExtent = new Vector2();
    this.aabbYExtent = new Vector2();
    this.aabbZExtent = new Vector2();
    this.aabbHalf = new Vector3();
    this.p0p1Delta = new Vector3(0, 0, 0);

    this.isStatic = collisionSettings.static;
    this.isIntelligent = collisionSettings.intelligent;

    // Collision essentials
    this.position = physicsEntity.center;

    // Dynamic object
    if (!this.isStatic)
    {
        this.onGround = false;
        this.groundNormal = new Vector3();
        this.wantsToMove = false; // characters and IAs
        this.isSubjectToContinuousForce = false; // non-gravity forces

        // Internal engine specifics
        this.position0 = new Vector3();
        this.position1 = new Vector3();
        this.velocity0 = new Vector3();
        this.velocity1 = new Vector3();
        this.accelera0 = new Vector3();
        this.accelera1 = new Vector3();
        this.rotation0 = new Vector4(0, 0, 0, 0);
        if (collisionSettings.variableGravity)
            this.gravity = new Vector3();
        else
            this.gravity = engine.gravity; // shared, will throw if engine wasn’t specified
        this.continuousForces = [];

        this.instantaneousAcceleration = 20.0; // used to get up to max velocity
        this.instantaneousVelocity = 0.; // normalized
        this.wantedVelocity = new Vector3(); // accelerate until satisfied
        this.maxSpeedInAir = 10.0;
        this.maxSpeedInWater = 5.0;

        // Intelligent internals
        this._d = [!1, !1, !1, !1, !1, !1];
    }

    // Type
    this.isSphere = false;
    this.isCharacter = false;
    this.isCylinder = false;
    this.isTrimesh = false;
    this.isPlatform = false;
    this.isBox = false;
};

extend(CollisionModel.prototype, {

    computeBoundingSphere() {},

    computeAABB()
    {
        console.warn('[CollisionModel]: cannot compute AABB on an abstract.');
    },

    computeAABBHalf()
    {
        // aabbCenter must be at the center.
        this.aabbHalf.set(
            Math.abs(this.aabbXExtent.x - this.aabbXExtent.y) / 2 + AABB_EPS,
            Math.abs(this.aabbYExtent.x - this.aabbYExtent.y) / 2 + AABB_EPS,
            Math.abs(this.aabbZExtent.x - this.aabbZExtent.y) / 2 + AABB_EPS
        );
    },

    updateCollisionModelAfterMovement()
    {
        console.warn('[CollisionModel]: cannot move an abstract model.');
    },

    setGravity(g)
    {
        if (this.isStatic)
            throw Error('[CollisionModel]: cannot apply gravity to a static object.');
        this.gravity.copy(g);
    },

    stop()
    {
        this._d[0] = this._d[1] = this._d[2] =
            this._d[3] = this._d[4] = this._d[5] = !1;
    },

    getDistanceToTarget()
    {
        if (this.isStatic) return 0;
        return this.position0.distanceTo(this.position1);
    },

    getP0P1Delta()
    {
        if (this.isStatic)
        {
            this.p0p1Delta.set(0, 0, 0);
            return this.p0p1Delta;
        }

        // (Internal) Must recompute every time!
        this.p0p1Delta.set(
            Math.abs(this.position0.x - this.position1.x),
            Math.abs(this.position0.y - this.position1.y),
            Math.abs(this.position0.z - this.position1.z)
        );
        return this.p0p1Delta;
    },

    getAABBHalf()
    {
        return this.aabbHalf;
    },

    destroy()
    {
        if (this.isStatic) return;
        this.position0 = null;
        this.position1 = null;
        this.velocity0 = null;
        this.velocity1 = null;
        this.accelera0 = null;
        this.accelera1 = null;
        this.gravity = null;
        this.wantedVelocity = null;
        this.continuousForces = null;

        this.aabbXExtent = null;
        this.aabbYExtent = null;
        this.aabbZExtent = null;
        this.aabbHalf = null;
        this.p0p1Delta = null;

        // the actual aabbCenter is swapped to a placeholder
        this.aabbCenter = null;
    }

});

export { CollisionModel };
