/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';
import { Vector3 }        from 'three';
import { COLLISION_EPS }  from '../collider';

let CharacterCollisionModel = function(physicsEntity, collisionSettings, e)
{
    CollisionModel.call(this, physicsEntity, collisionSettings, e);

    this.isCharacter = true;

    // Overgrowth-like collision model
    this.lifterCenter = new Vector3();
    this.lifterRadius = collisionSettings.lifterRadius || 0.5;
    this.bumperCenter = new Vector3();
    this.bumperRadius = collisionSettings.bumperRadius || 1;

    // Internals
    this._w1 = new Vector3();
    this._w2 = new Vector3();
    this._w3 = new Vector3();
    this._w4 = new Vector3();
    this._w5 = new Vector3();

    this.wasLiftedByAStaticObject = false;
    this.wasLifted = false;
};

CharacterCollisionModel.prototype = Object.create(CollisionModel.prototype);

extend(CharacterCollisionModel.prototype, {

    computeAABB()
    {
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
        const elementSizeX = heightMap.elementSizeX;
        const elementSizeY = heightMap.elementSizeY;
        const pos = heightMap.getData().geometry.attributes.position.array;
        const v1 = this._w1;
        const v2 = this._w2;
        const v3 = this._w3;
        const x = Math.floor(localX / extentX * nbSegmentsX);
        const y = Math.floor(localY / extentY * nbSegmentsY);

        // 1. BUMP.
        // local coordinates are in [0, heightMapWidth].
        const bumpR = this.bumperRadius;
        const bumpR2 = bumpR * bumpR;
        let bumperCenter = this.bumperCenter; // Should be set to p1!
        bumperCenter.set(localX, localY, this.position1.z); // translated to local coords!
        let lowestPoint = bumperCenter.z - bumpR - COLLISION_EPS;
        let nbXToCheck = Math.ceil(bumpR / elementSizeX);
        let nbYToCheck = Math.ceil(bumpR / elementSizeY);
        let minX = Math.max(x - nbXToCheck, 0);
        let maxX = Math.min(x + nbXToCheck, nbSegmentsX - 1); // nbv - 2
        let minY = Math.max(y - nbYToCheck, 0);
        let maxY = Math.min(y + nbXToCheck, nbSegmentsY - 1); // nbv - 2
        // console.log(`bump ${minX}->${maxX};${minY}->${maxY}`);
        let displacement;
        // Go through heightmap patch.
        for (let iy = minY; iy < maxY; ++iy)
            for (let ix = minX; ix < maxX; ++ix)
            {
                // const offsetY = nbVerticesX * iy;
                const a = ix + nbVerticesX * iy; // 0, 0
                const b = ix + nbVerticesX * (iy + 1); // 0, 1
                const c = ix + 1 + nbVerticesX * (iy + 1); // 1, 1
                const d = ix + 1 + nbVerticesX * iy; // 1, 0

                // Compute max and min height.
                const heightA = pos[3 * a + 2];
                const heightB = pos[3 * b + 2];
                const heightC = pos[3 * c + 2];
                const heightD = pos[3 * d + 2];
                if (heightA < lowestPoint && heightB < lowestPoint &&
                    heightC < lowestPoint && heightD < lowestPoint)
                    continue;

                // Collide bump and clamp correction.
                // abd
                v1.set(ix * elementSizeX, iy * elementSizeY, heightA);
                v2.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTri(bumperCenter, bumpR2, v1, v2, v3);
                this.bump(displacement);

                // bcd
                v1.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v2.set((ix + 1) * elementSizeX, (iy + 1) * elementSizeY, heightC);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTri(bumperCenter, bumpR2, v1, v2, v3);
                this.bump(displacement);
            }

        // 2. LIFT.
        const gravityUp = this._w4;
        gravityUp.copy(this.gravity).negate().normalize();
        const liftR = this.lifterRadius;
        const liftR2 = liftR * liftR;
        let lifterCenter = this.lifterCenter; // Should be set to p1!
        lifterCenter.set(localX, localY, this.position1.z); // minus something
        lowestPoint = lifterCenter.z - liftR - COLLISION_EPS;
        let highestPoint = lifterCenter.z + liftR + COLLISION_EPS;
        nbXToCheck = Math.ceil(liftR / elementSizeX);
        nbYToCheck = Math.ceil(liftR / elementSizeY);
        minX = Math.max(x - nbXToCheck, 0);
        maxX = Math.min(x + nbXToCheck, nbSegmentsX - 1); // nbv - 2
        minY = Math.max(y - nbYToCheck, 0);
        maxY = Math.min(y + nbXToCheck, nbSegmentsY - 1); // nbv - 2
        // console.log(`lift ${minX}->${maxX};${minY}->${maxY}`);
        // Go through heightmap patch.
        for (let iy = minY; iy < maxY; ++iy)
            for (let ix = minX; ix < maxX; ++ix)
            {
                const a = ix + nbVerticesX * iy; // 0, 0
                const b = ix + nbVerticesX * (iy + 1); // 0, 1
                const c = ix + 1 + nbVerticesX * (iy + 1); // 1, 1
                const d = ix + 1 + nbVerticesX * iy; // 1, 0

                // Compute max and min height.
                const heightA = pos[3 * a + 2];
                const heightB = pos[3 * b + 2];
                const heightC = pos[3 * c + 2];
                const heightD = pos[3 * d + 2];
                if (heightA < lowestPoint && heightB < lowestPoint &&
                    heightC < lowestPoint && heightD < lowestPoint)
                    continue;

                if (heightA > highestPoint && heightB > highestPoint &&
                    heightC > highestPoint && heightD > highestPoint)
                    console.error('Went through the ground');

                // Collide bump and clamp correction.
                // abd
                v1.set(ix * elementSizeX, iy * elementSizeY, heightA);
                v2.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTriVertical(lifterCenter, liftR2, v1, v2, v3,
                    liftR, gravityUp);
                this.lift(displacement, false);

                // bcd
                v1.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v2.set((ix + 1) * elementSizeX, (iy + 1) * elementSizeY, heightC);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTriVertical(lifterCenter, liftR2, v1, v2, v3,
                    liftR, gravityUp);
                this.lift(displacement, false);
            }

        if (!this.wasLifted && !this.wasLiftedByAStaticObject)
            this.onGround = false; // XXX always move along terrain normals
        // maxLift = lifter radius
        // constrain vertical lift
        // Compute onGround
        // if onGround, raycast IKs
    },

    bump(displacement)
    {
        const p1 = this.position1;
        const p1x = p1.x;
        const p1y = p1.y;
        const p1z = p1.z;
        const p0 = this.position0;
        const p0x = p0.x;
        const p0y = p0.y;
        const p0z = p0.z;
        let nx = p1x + displacement.x;
        let ny = p1y + displacement.y;
        let nz = p1z + displacement.z;
        if (nx > p1x && nx > p0x || nx < p1x && nx < p0x)
        {
            nx = p1x;
            // console.log('bump oob');
        }
        if (ny > p1y && ny > p0y || ny < p1y && ny < p0y)
        {
            ny = p1y;
            // console.log('bump oob');
        }
        if (nz > p1z && nz > p0z || nz < p1z && nz < p0z)
        {
            nz = p1z;
            // console.log('bump oob');
        }

        if (displacement.length() > 0)
        {
            console.log(displacement);
        }
        // Apply.
        this.position1.set(nx, ny, nz);
        this.lifterCenter.add(displacement);
        this.bumperCenter.add(displacement);
    },

    lift(displacement, byAStaticObject)
    {
        const l = displacement.length();
        if (l > this.lifterRadius)
        {
            console.warn('big lift');
            displacement.multiplyScalar(this.lifterRadius / l);
        }
        const p1 = this.position1;
        const p1x = p1.x;
        const p1y = p1.y;
        const p1z = p1.z;
        let nx = p1x + displacement.x;
        let ny = p1y + displacement.y;
        let nz = p1z + displacement.z;

        if (l > 0.)
        {
            this.onGround = true;
            if (byAStaticObject) this.wasLiftedByAStaticObject = true;
            else this.wasLifted = true;
        }

        if (displacement.length() > 0)
        {
            console.log(displacement);
        }
        // Apply.
        this.position1.set(nx, ny, nz);
        this.lifterCenter.add(displacement);
        this.bumperCenter.add(displacement);
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
        const trimesh = trimeshCollisionModel.trimesh;
        const index = trimesh.geometry.index;
        const pos = trimesh.geometry.attributes.position;
        const v1 = this._w1;
        const v2 = this._w2;
        const v3 = this._w3;

        // 1. BUMP.
        const bumpR = this.bumperRadius;
        const bumpR2 = bumpR * bumpR;
        let bumperCenter = this._w5;
        bumperCenter.copy(this.position1).applyMatrix4(trimesh.localTransform);
        let displacement;
        const nbTris = index ? index.length : pos.length / 3;
        for (let i = 0; i < nbTris; ++i)
        {
            const a = index ? index[i] : 3 * i;
            const b = index ? index[i + 1] : 3 * i + 1;
            const c = index ? index[i + 2] : 3 * i + 2;

            // Collide bump and clamp correction.
            v1.set(pos[3 * a], pos[3 * a + 1], pos[3 * a + 2]);
            v2.set(pos[3 * b], pos[3 * b + 1], pos[3 * b + 2]);
            v1.set(pos[3 * c], pos[3 * c + 1], pos[3 * c + 2]);
            displacement = collider.intersectSphereTri(bumperCenter, bumpR2, v1, v2, v3);
            this.bump(displacement);
        }

        // 2. LIFT.
        const gravityUp = this._w4;
        gravityUp.copy(this.gravity).negate().normalize();
        const liftR = this.lifterRadius;
        const liftR2 = liftR * liftR;
        let lifterCenter = this._w5;
        lifterCenter.copy(this.position1).applyMatrix4(trimesh.localTransform); // minus something!
        for (let i = 0; i < nbTris; ++i)
        {
            const a = index ? index[i] : 3 * i;
            const b = index ? index[i + 1] : 3 * i + 1;
            const c = index ? index[i + 2] : 3 * i + 2;

            // Collide bump and clamp correction.
            v1.set(pos[3 * a], pos[3 * a + 1], pos[3 * a + 2]);
            v2.set(pos[3 * b], pos[3 * b + 1], pos[3 * b + 2]);
            v1.set(pos[3 * c], pos[3 * c + 1], pos[3 * c + 2]);
            displacement = collider.intersectSphereTriVertical(lifterCenter, liftR2, v1, v2, v3,
                liftR, gravityUp);
            this.lift(displacement, true);
        }

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

        // TODO [HIGH] code me.
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

export { CharacterCollisionModel };
