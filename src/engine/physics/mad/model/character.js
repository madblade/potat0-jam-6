/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel }          from './collisionmodel';
import extend                      from '../../../../extend';
import {
    Matrix4,
    Mesh, MeshBasicMaterial,
    SphereBufferGeometry, Vector3
}                                  from 'three';
import { COLLISION_EPS }           from '../collider';
import { CharacterResponseModule } from './character.response';

let CharacterCollisionModel = function(physicsEntity, collisionSettings, e)
{
    CollisionModel.call(this, physicsEntity, collisionSettings, e);

    this.isCharacter = true;

    // Overgrowth-like collision model
    this.lifterCenter = new Vector3();
    this.lifterRadius = collisionSettings.lifterRadius || 0.5;
    this.bumperCenter = new Vector3();
    this.bumperRadius = collisionSettings.bumperRadius || 1;
    this.lifterDelta = collisionSettings.lifterDelta || 0.2;
    // TODO leg raycast coordinates here + forward orientation

    // Helper
    this.lifterHelper = new Mesh(
        new SphereBufferGeometry(this.lifterRadius),
        new MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true
        })
    );
    this.bumperHelper = new Mesh(
        new SphereBufferGeometry(this.bumperRadius),
        new MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: true
        })
    );
    e.physics.app.engine.graphics.addToScene(this.lifterHelper, '-1');
    e.physics.app.engine.graphics.addToScene(this.bumperHelper, '-1');

    // Internals
    this._w1 = new Vector3();
    this._w2 = new Vector3();
    this._w3 = new Vector3();
    this._w4 = new Vector3();
    this._w5 = new Vector3();
    this._mi = new Matrix4();

    // dbg
    this._debug = false;

    this._hasBumped = false;
    this.wasLiftedByAStaticObject = false;
    this.wasLifted = false;
};

CharacterCollisionModel.prototype = Object.create(CollisionModel.prototype);

extend(CharacterCollisionModel.prototype, {

    computeAABB()
    {
        // aligned on bumper sphere
        const center = this.aabbCenter;
        const radius = Math.max(this.bumperRadius, this.lifterRadius);
        const minX = center.x - radius;
        const maxX = center.x + radius;
        const minY = center.y - radius;
        const maxY = center.y + radius;
        const zDelta = Math.max(this.lifterDelta + this.lifterRadius, radius);
        const minZ = center.z - zDelta;
        const maxZ = center.z + zDelta;
        this.aabbXExtent.set(minX, maxX);
        this.aabbYExtent.set(minY, maxY);
        this.aabbZExtent.set(minZ, maxZ);

        this.computeAABBHalf();
    },

    updateCollisionModelAfterMovement()
    {
        const physicalEntity = this.entity;

        // XXX if character is crouching, update
        this.bumperCenter.copy(physicalEntity.center);

        this.aabbCenter.copy(physicalEntity.center);

        // XXX
        this.lifterCenter.copy(physicalEntity.center);
        this._w1.set(0, 0, -this.lifterDelta);
        this.lifterCenter.add(this._w1);
    },

    updateBumperLifterAfterChange(displacement)
    {
        // Using displacement because we work in local coordinates.
        this.bumperCenter.add(displacement);
        this.lifterCenter.add(displacement);
    },

    // XXX [LOW] support infinite terrain patches
    collideAgainstTerrain(localX, localY, heightmaps, collider)
    {
        for (let i = 0; i < heightmaps.length; ++i)
            this.collideAgainstHeightMap(localX, localY, heightmaps[i], collider);
    },

    collideAgainstHeightMap(
        localX, localY, heightMap, collider
    )
    {
        if (!heightMap.isTrimeshMap)
        {
            console.log('[Character] Unsupported heightmap type.');
            return;
        }

        const extentX = heightMap.extentX;
        const extentY = heightMap.extentY;
        const nbVerticesX = heightMap.nbVerticesX;
        const nbVerticesY = heightMap.nbVerticesY;
        const nbSegmentsX = nbVerticesX - 1;
        const nbSegmentsY = nbVerticesY - 1;
        const x = Math.floor(localX / extentX * nbSegmentsX);
        const y = Math.floor(localY / extentY * nbSegmentsY);
        const gravityUp = this._w4;
        gravityUp.copy(this.gravity).negate().normalize();
        if (gravityUp.manhattanLength() === 0)
            gravityUp.z = -10; // needed to orient bumper and lifter

        // 1. BUMP.
        // local coordinates are in [0, heightMapWidth].
        this._hasBumped = false;
        let bumperCenter = this.bumperCenter; // Should be set to p1!
        bumperCenter.set(localX, localY, this.position1.z); // (translated to local coords)
        this.bumpAgainstHeightMap(x, y, bumperCenter, gravityUp, heightMap, collider);

        // 2. LIFT.
        this.wasLifted = false;
        // (using bumperCenter, which was modified by the bump routine)
        this.liftAgainstHeightMap(x, y, bumperCenter, gravityUp, heightMap, collider);

        if (!this.wasLifted && !this.wasLiftedByAStaticObject)
            this.onGround = false;

        // TODO vertical check (raycast down)
        // TODO check distance < height / 2
        //  if !point in range -> gravity fall
        //  if point in range, bump THEN lift

        // maxLift = lifter radius
        // constrain vertical lift
        // Compute onGround
        // if onGround, raycast IKs
    },

    collideAgainstStatic(otherCollisionModel, collider)
    {
        console.log('Collide character against static object.');
        if (!otherCollisionModel.isTrimesh)
            throw Error('[Character] Only trimeshes can be static.');

        if (otherCollisionModel.isTrimesh)
            this.collideTrimesh(otherCollisionModel, collider);
        // bumper-lifter
        //  - trimesh: easy (same thing as for terrain but on all tris)
        //  - cylinder: only bump
        //  - sphere: only bump
        // 1. bump // to gravity
        //      (not allowed to move farther X, Y, Z than what was
        //       predicted, including jump.
        //       check point-sphere collision routine to clamp the projected byproduct)
        // 2. lift |- to gravity
        //      (not allowed to go sideways,
        //       only up and down until height collision.
        //       check and customize point-sphere collision routine)
        // 3. test onGround
        //      (double raycast + IK)
        //      if onGround, compute onGround normal if possible
    },

    collideTrimesh(trimeshCollisionModel, collider)
    {
        const gravityUp = this._w4;
        gravityUp.copy(this.gravity).negate().normalize();
        if (gravityUp.manhattanLength() === 0)
            gravityUp.z = -10; // needed to orient bumper and lifter

        // 1. BUMP.
        let bumperCenter = this.bumperCenter; // Should be set to p1!
        bumperCenter.copy(this.position1);
        this.bumpAgainstTrimesh(bumperCenter, trimeshCollisionModel, gravityUp, collider);

        // 2. LIFT.
        this.liftAgainstTrimesh(bumperCenter, trimeshCollisionModel, gravityUp, collider);

        if (!this.wasLifted && !this.wasLiftedByAStaticObject)
            this.onGround = false;
    },

    // for IK and lifter
    rayCastDown()
    {
    },

    collideAgainstCharacter(otherCollisionModel)
    {
        if (!otherCollisionModel.isCharacter)
        {
            console.warn('[Character] expected other character.');
            return;
        }

        // TODO [GAMEPLAY] code me.
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
            console.warn('[Character] expected dynamic sphere.');
            return;
        }

        console.log('[Character] C vs DSph not implemented.');
        // 1. bump / slide
        // 2. apply force to other equal to self acceleration
        // Same as collide against character, guessing.
    }

});

extend(CharacterCollisionModel.prototype, CharacterResponseModule);

export { CharacterCollisionModel };
