/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend      from '../../../../extend';
import { Vector3 } from 'three';

let CollisionModel = function(physicsEntity, collisionSettings)
{
    this.entity = physicsEntity;

    // Bounding sphere
    this.boundingSphereCenter = physicsEntity.center;
    this.boundingSphereRadius = collisionSettings.radius;
    this.isStatic = collisionSettings.static;
    this.isIntelligent = collisionSettings.intelligent;

    this.position = physicsEntity.center;
    if (!this.isStatic)
    {
        this.onGround = false;
        this.wantsToMove = false; // characters and IAs
        this.isSubjectToContinuousForce = false; // non-gravity forces

        // Internal engine specifics
        this.position0 = new Vector3();
        this.position1 = new Vector3();
        this.velocity0 = new Vector3();
        this.velocity1 = new Vector3();
        this.accelera0 = new Vector3();
        this.accelera1 = new Vector3();
        this.gravity = new Vector3();
        this.continuousForces = [];

        this.instantaneousAcceleration = 20.0; // used to get up to max velocity
        this.instantaneousVelocity = 0.; // normalized
        this.wantedVelocity = new Vector3(); // accelerate until satisfied
        this.maxSpeedInAir = 1.0;
        this.maxSpeedInWater = 0.5;
    }
};

extend(CollisionModel.prototype, {

    computeBoundingSphere() {},

    setGravity(g)
    {
        if (this.isStatic)
            throw Error('[CollisionModel]: cannot apply gravity to a static object.');
        this.gravity.copy(g);
    },

});

export { CollisionModel };
