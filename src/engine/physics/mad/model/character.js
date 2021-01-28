/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';
import { Vector3 }        from 'three';

let CharacterCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);

    this.isCharacter = true;

    // Overgrowth-like collision model
    this.lifterCenter = new Vector3();
    this.lifterRadius = 0;
    this.bumperCenter = new Vector3();
    this.bumperRadius = 0;
};

extend(CharacterCollisionModel.prototype, {

    computeAABB()
    {
        this.computeAABBHalf();
    },

    updateCollisionModelAfterMovement()
    {
        const physicalEntity = this.entity;
        this.bumperCenter.copy(physicalEntity.center);
        // if character is crouching, update
    },

    collideAgainstTerrain(offsetX, offsetY, heightmaps, collider)
    {
        // XXX [LOW] support infinite terrain patches

        // 1. Compute heightmap(s) patches.

        // 3. Collide against patch(es).

        // 4. Compute onGround property.
        //      if on ground, compute terrain normal.
    },

    collideAgainstStatic(otherCollisionModel)
    {
        console.log('Collide character against static object.');
        // TODO [CRIT] bumper-lifter
        // 1. bump // to gravity
        //      (not allowed to move farther up or down than what was
        //       predicted, including jump.
        //       check point-sphere collision routine to clamp the projected byproduct)
        // 2. lift |- to gravity
        //      (not allowed to go sideways,
        //       only up and down until height collision.
        //       check and customize point-sphere collision routine)
        // 3. test onGround
        //      (double raycast + IK)
        //      if onGround, compute onGround normal
    },

    // for IK and lifter
    rayCastDown()
    {
    },

    collideAgainstCharacter(otherCollisionModel)
    {
        // solve character interaction
        // maybe we can afford a little bit of terrain penetration, test that:

        // 1. self character has a special status: more responsive
        // 2. if other entity is heavier, push self
        //    (going back to between p0 and p1 would mean solving a quadratic eqn)
        // 3. if other entity is lighter, just ignore/apply a force to it.
        // 4. if other entity is lighter AND main character, don’t move self from
        //      desired output, move main character away from penetration instead
        //      (except if coming from up, e.g. skydiving)
    },

    collideAgainstDynamicSphere(otherCollisionModel)
    {
        if (!otherCollisionModel.isSphere)
        {
            console.warn('[Character] trying to collide against dynamic non-sphere');
            return;
        }

        // 1. bump / slide
        // 2. apply force to other equal to self acceleration
        // Same as collide against character, guessing.
    }

});

export { CharacterCollisionModel };
