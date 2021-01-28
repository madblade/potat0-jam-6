/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';
import { Vector3 }        from 'three';
import { COLLISION_EPS }  from '../collider';

let CharacterCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);

    this.isCharacter = true;

    // Overgrowth-like collision model
    this.lifterCenter = new Vector3();
    this.lifterRadius = 0;
    this.bumperCenter = new Vector3();
    this.bumperRadius = 0;

    this._w1 = new Vector3();
    this._w2 = new Vector3();
    this._w3 = new Vector3();
};

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
        const widthX = heightMap.widthX;
        const widthY = heightMap.widthY;
        const nbVerticesX = heightMap.nbVerticesX;
        const nbVerticesY = heightMap.nbVerticesY;
        const nbSegmentsX = nbVerticesX - 1;
        const nbSegmentsY = nbVerticesY - 1;
        const elementSizeX = heightMap.elementSizeX;
        const elementSizeY = heightMap.elementSizeY;
        const pos = heightMap.geometry.attributes.position.array;

        // 1. BUMP.
        // local coordinates are in [0, heightMapWidth].
        const x = Math.floor(localX / widthX * nbSegmentsX);
        const y = Math.floor(localY / widthY * nbSegmentsY);

        const bumpR = this.bumperRadius;
        const bumpR2 = bumpR * bumpR;
        const lowestBumpPoint = this.bumperCenter.z - bumpR - COLLISION_EPS;
        const nbXToCheck = Math.ceil(this.bumperRadius / elementSizeX);
        const nbYToCheck = Math.ceil(this.bumperRadius / elementSizeY);
        const minX = Math.max(x - nbXToCheck, 0);
        const maxX = Math.min(x + nbXToCheck, nbSegmentsX - 1); // nbv - 2
        const minY = Math.max(y - nbYToCheck, 0);
        const maxY = Math.min(y + nbXToCheck, nbSegmentsY - 1); // nbv - 2
        const v1 = this._w1;
        const v2 = this._w2;
        const v3 = this._w3;
        console.log(`${minX}->${maxX};${minY}->${maxY}`);
        let displacement;
        for (let iy = minY; iy < maxY; ++iy)
            for (let ix = minX; ix < maxX; ++ix)
            {
                // const offsetY = nbVerticesX * iy;
                const a = ix + nbVerticesX * iy; // 0, 0
                const b = ix + nbVerticesX * (iy + 1); // 0, 1
                const c = ix + 1 + nbVerticesX * (iy + 1); // 1, 1
                const d = ix + 1 + nbVerticesX * iy; // 1, 0

                const heightA = pos[3 * a + 2];
                const heightB = pos[3 * b + 2];
                const heightC = pos[3 * c + 2];
                const heightD = pos[3 * d + 2];
                if (heightA < lowestBumpPoint && heightB < lowestBumpPoint &&
                    heightC < lowestBumpPoint && heightD < lowestBumpPoint)
                    continue;

                // test abd
                v1.set(ix * elementSizeX, iy * elementSizeY, heightA);
                v2.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTri(this.bumperCenter, bumpR2, v1, v2, v3);
                this.bump(displacement);

                // test bcd
                v1.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v2.set((ix + 1) * elementSizeX, (iy + 1) * elementSizeY, heightC);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTri(this.bumperCenter, bumpR2, v1, v2, v3);
                this.bump(displacement);
            }

        // Compute heightmap patch.
        // Compute max and min height.
        // Collide bump: min / max height opti, collide, clamp correction.
        // TODO [CRIT] collide

        // 2. LIFT.
        // maxLift = lifter radius
        // constrain vertical lift
        // Compute onGround
        // if onGround, raycast IKs
    },

    bump(displacement)
    {
        const p1x = this.position1.x;
        const p1y = this.position1.y;
        const p1z = this.position1.z;
        const p0x = this.position0.x;
        const p0y = this.position0.y;
        const p0z = this.position0.z;
        let nx = p1x + displacement.x;
        let ny = p1y + displacement.y;
        let nz = p1z + displacement.z;
        if (nx > p1x && nx > p0x || nx < p1x && nx < p0x)
        {
            nx = p1x;
            console.log('bump oob');
        }
        if (ny > p1y && ny > p0y || ny < p1y && ny < p0y)
        {
            ny = p1y;
            console.log('bump oob');
        }
        if (nz > p1z && nz > p0z || nz < p1z && nz < p0z)
        {
            nz = p1z;
            console.log('bump oob');
        }
    },

    lift(displacement)
    {
        console.log(displacement);
        // TODO vertical intersect
        // intersection point + triangle normal * radius
    },

    collideAgainstStatic(otherCollisionModel)
    {
        console.log('Collide character against static object.');
        // TODO [CRIT] bumper-lifter
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
        //      if onGround, compute onGround normal
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
