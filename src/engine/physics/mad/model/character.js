/**
 * (c) madblade 2021 all rights reserved
 *
 * Bumper-lifter collision routines.
 * See GDC 2014 / Overgrowth.
 */

'use strict';

import extend, { inherit }          from '../../../../extend';

import { CollisionModel }           from './collisionmodel';
import { CharacterResponseModule }  from './character.response';
import {
    Mesh,
    MeshBasicMaterial,
    SphereBufferGeometry,
    Vector3
}                                   from 'three';

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
    this.maxRadius = Math.max(this.bumperRadius, this.lifterRadius);
    // TODO leg raycast coordinates here + forward orientation

    // Step down test
    this.bumperCenterTest = new Vector3();
    this.bumperCenterTestTranslated = new Vector3();
    this.stepDownHeight = this.lifterRadius / 2 - 0.05;
    // Math.min(
    //     this.lifterRadius / 2,
    //     this.lifterRadius - (this.bumperRadius - this.lifterDelta)
    // );

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
    this.stepDownCollisionData = [];

    // dbg
    this._debug = false;

    this._hasBumped = false;
    this.wasLiftedByAStaticObject = false;
    this.wasLifted = false;
    this.wasOnGround = false;
    this.canJumpFromGround = false;
};

inherit(CharacterCollisionModel, CollisionModel);

extend(CharacterCollisionModel.prototype, {

    getMaxRadius()
    {
        return this.maxRadius;
    },

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
        let x = Math.floor(localX / extentX * nbSegmentsX);
        let y = Math.floor(localY / extentY * nbSegmentsY);
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
        // Don’t forget to reset the coordinates test if there was a bump!
        x = Math.floor(bumperCenter.x / extentX * nbSegmentsX);
        y = Math.floor(bumperCenter.y / extentY * nbSegmentsY);
        // this.wasLifted = false; // would assume there is only one heightmap!
        // ^ This is actually reset at the sweeper stage,
        // before the collision with all heightmaps.
        this.liftAgainstHeightMap(x, y, bumperCenter, gravityUp, heightMap, collider);
        // ^ This uses bumperCenter, which was modified by the bump routine.

        // Heightmaps are checked after statics.
        this.onGround = this.wasLifted || this.wasLiftedByAStaticObject;

        if (!this.onGround && this.wasOnGround)
        {
            this.stepDownCollisionData.push(['hm', heightMap]);
            // ^ heightMap contains all the data necessary for the coordinate transform.
            collider.pushCollisionModelForStepDown(this);
        }

        // maxLift = lifter radius
        // constrain vertical lift
        // Compute onGround
        // if onGround, raycast IKs
    },

    collideAgainstStatic(otherCollisionModel, collider)
    {
        // console.log('Collide character against static object.');
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
        //       predicted, including jump.)
        // 2. lift |- to gravity
        //      (not allowed to go sideways,
        //       only up and down until height collision.)
        // 3. test onGround
        //      (double raycast + IK)
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
        // this.wasLiftedByAStaticObject = false;
        // ^ this is reset at the Sweeper stage,
        //   and not every time a new trimesh is tested against collison
        this.liftAgainstTrimesh(bumperCenter, trimeshCollisionModel, gravityUp, collider);

        // Statics are tested before heightmaps.
        this.onGround = this.wasLiftedByAStaticObject;
        if (!this.onGround && this.wasOnGround)
        {
            this.stepDownCollisionData.push(['s', trimeshCollisionModel]);
            collider.pushCollisionModelForStepDown(this);
            // ^ This is mandatory here because there might be no heightmap down.
        }
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
