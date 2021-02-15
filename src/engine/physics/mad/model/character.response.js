/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { COLLISION_EPS } from '../collider';

let CharacterResponseModule = {

    bumpAgainstHeightMap(
        x, y,
        bumperCenter,
        gravityUp,
        heightMap,
        collider
    )
    {
        const v1 = this._w1;
        const v2 = this._w2;
        const v3 = this._w3;
        const nbVerticesX = heightMap.nbVerticesX;
        const nbVerticesY = heightMap.nbVerticesY;
        const nbSegmentsX = nbVerticesX - 1;
        const nbSegmentsY = nbVerticesY - 1;
        const elementSizeX = heightMap.elementSizeX;
        const elementSizeY = heightMap.elementSizeY;
        const pos = heightMap.getData().userData.points;
        const bumpR = this.bumperRadius;
        const bumpR2 = bumpR * bumpR;

        const nbXToCheck = Math.ceil(bumpR / elementSizeX);
        const nbYToCheck = Math.ceil(bumpR / elementSizeY);
        const minX = Math.max(x - nbXToCheck - 1, 0);
        const maxX = Math.min(x + nbXToCheck + 1, nbSegmentsX); // nbv - 2
        const minY = Math.max(y - nbYToCheck - 1, 0);
        const maxY = Math.min(y + nbXToCheck + 1, nbSegmentsY); // nbv - 2

        let displacement;
        // Go through heightmap patch.
        for (let iy = minY; iy < maxY; ++iy)
            for (let ix = minX; ix < maxX; ++ix)
            {
                const a = ix + nbVerticesX * iy;
                const b = a + nbVerticesX;
                const c = b + 1;
                const d = a + 1;

                // Compute max and min height.
                const heightA = pos[a];
                const heightB = pos[b];
                const heightC = pos[c];
                const heightD = pos[d];

                // Collide bump and clamp correction.
                // Caution! v1v3v2 (and not v1v2v3) to revert normals!
                // abd
                v1.set(ix * elementSizeX, iy * elementSizeY, heightA);
                v3.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v2.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTriOrthogonal(
                    bumperCenter, bumpR2, v1, v2, v3, bumpR, gravityUp
                );
                this.bump(displacement);

                // bcd
                v1.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v3.set((ix + 1) * elementSizeX, (iy + 1) * elementSizeY, heightC);
                v2.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTriOrthogonal(
                    bumperCenter, bumpR2, v1, v2, v3, bumpR, gravityUp
                );
                this.bump(displacement);
            }
    },

    liftAgainstHeightMap(
        x, y,
        bumperCenter,
        gravityUp,
        heightMap,
        collider,
        readOnly // used to test without setting position1 or bumper / lifter
    )
    {
        const v1 = this._w1;
        const v2 = this._w2;
        const v3 = this._w3;
        const nbVerticesX = heightMap.nbVerticesX;
        const nbVerticesY = heightMap.nbVerticesY;
        const nbSegmentsX = nbVerticesX - 1;
        const nbSegmentsY = nbVerticesY - 1;
        const elementSizeX = heightMap.elementSizeX;
        const elementSizeY = heightMap.elementSizeY;
        const pos = heightMap.getData().userData.points;

        const liftR = this.lifterRadius;
        const liftR2 = liftR * liftR;

        let lifterCenter = this.lifterCenter; // Should be set to p1!
        lifterCenter.set( // apply bump to lifter
            bumperCenter.x,
            bumperCenter.y,
            bumperCenter.z - this.lifterDelta
        );
        const lowestPoint = lifterCenter.z - liftR - COLLISION_EPS;
        const nbXToCheck = Math.ceil(liftR / elementSizeX);
        const nbYToCheck = Math.ceil(liftR / elementSizeY);
        const minX = Math.max(x - nbXToCheck - 1, 0);
        const maxX = Math.min(x + nbXToCheck + 1, nbSegmentsX);
        const minY = Math.max(y - nbYToCheck - 1, 0);
        const maxY = Math.min(y + nbXToCheck + 1, nbSegmentsY);

        let displacement;

        // Go through heightmap patch.
        for (let ix = minX; ix < maxX; ++ix)
            for (let iy = minY; iy < maxY; ++iy)
            {
                const a = ix + nbVerticesX * iy;
                const b = a + nbVerticesX;
                const c = b + 1;
                const d = a + 1;

                // Compute max and min height.
                const heightA = pos[a];
                const heightB = pos[b];
                const heightC = pos[c];
                const heightD = pos[d];
                if (heightA < lowestPoint && heightB < lowestPoint &&
                    heightC < lowestPoint && heightD < lowestPoint)
                    continue;

                // Collide lift and clamp correction.
                // v1v3v2 for good measure (normals are set implicitly!)
                // abd
                v1.set(ix * elementSizeX, iy * elementSizeY, heightA);
                v3.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v2.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTriVertical(
                    lifterCenter, liftR2, v1, v2, v3,
                    liftR, gravityUp
                );
                this.lift(displacement, false, readOnly);

                // bcd
                v1.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v3.set((ix + 1) * elementSizeX, (iy + 1) * elementSizeY, heightC);
                v2.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTriVertical(
                    lifterCenter, liftR2, v1, v2, v3,
                    liftR, gravityUp);
                this.lift(displacement, false, readOnly);
            }
    },

    bumpAgainstTrimesh(
        bumperCenter,
        trimeshCollisionModel,
        gravityUp,
        collider
    )
    {
        const tris = trimeshCollisionModel.tris; // working on already transformed tris
        const v1 = this._w1;
        const v2 = this._w2;
        const v3 = this._w3;
        let displacement;

        const bumpR = this.bumperRadius;
        const bumpR2 = bumpR * bumpR;
        // let bumperCenter = this.bumperCenter; // Should be set to p1!
        // bumperCenter.copy(this.position1);
        // bumperCenter.copy(this.position1).applyMatrix4(trimeshCollisionModel.localTransformInverse);
        // const nbTris = index ? index.length / 3 : pos.length / 9;
        const nbTris = tris.length / 9;
        for (let i = 0; i < nbTris; ++i)
        {
            const a = 3 * i;
            const b = 3 * i + 1;
            const c = 3 * i + 2;
            v1.set(tris[3 * a], tris[3 * a + 1], tris[3 * a + 2]);
            v2.set(tris[3 * b], tris[3 * b + 1], tris[3 * b + 2]);
            v3.set(tris[3 * c], tris[3 * c + 1], tris[3 * c + 2]);

            // Collide bump and clamp correction.
            displacement = collider.intersectSphereTriOrthogonal(
                bumperCenter, bumpR2, v1, v2, v3, bumpR, gravityUp
            );
            this.bump(displacement);
        }
    },

    liftAgainstTrimesh(
        bumperCenter,
        trimeshCollisionModel,
        gravityUp,
        collider,
        readOnly // test-only: don’t affect p1 or bumper / lifter position
    )
    {
        const tris = trimeshCollisionModel.tris; // working on already transformed tris
        const v1 = this._w1;
        const v2 = this._w2;
        const v3 = this._w3;
        let displacement;

        const liftR = this.lifterRadius;
        const liftR2 = liftR * liftR;
        const lifterCenter = this.lifterCenter;

        // It’s more efficient to copy bumper’s position.
        lifterCenter.set(
            bumperCenter.x,
            bumperCenter.y,
            bumperCenter.z - this.lifterDelta
        );
        // lifterCenter.copy(this.bumperCenter).addScaledVector(gravityUp, -this.lifterDelta);
        // lifterCenter.copy(this.position1).applyMatrix4(trimesh.localTransform);
        // lifterCenter.applyMatrix4(trimeshCollisionModel.localTransformInverse);

        const nbTris = tris.length / 9;
        for (let i = 0; i < nbTris; ++i)
        {
            const a = 3 * i;
            const b = 3 * i + 1;
            const c = 3 * i + 2;

            v1.set(tris[3 * a], tris[3 * a + 1], tris[3 * a + 2]);
            v2.set(tris[3 * b], tris[3 * b + 1], tris[3 * b + 2]);
            v3.set(tris[3 * c], tris[3 * c + 1], tris[3 * c + 2]);

            // Collide lift and clamp correction.
            displacement = collider.intersectSphereTriVertical(
                lifterCenter, liftR2, v1, v2, v3, liftR, gravityUp
            );
            this.lift(displacement, true, readOnly);
        }
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
        let correct = false;

        // Bumper may change px and py farther than desired, but not too far!
        if (nx > p1x && nx > p0x || nx < p1x && nx < p0x)
        {
            const br = this.bumperRadius;
            if (displacement.lengthSq() > br * br)
            {
                displacement.normalize().multiplyScalar(br / 2);
                correct = true;
            }
        }
        if (ny > p1y && ny > p0y || ny < p1y && ny < p0y)
        {
            const br = this.bumperRadius;
            if (displacement.lengthSq() > br * br)
            {
                displacement.normalize().multiplyScalar(br / 2);
                correct = true;
            }
        }
        if (nz > p1z && nz > p0z || nz < p1z && nz < p0z)
        {
            if (this._debug)
                console.warn('[Collision/Character] Bumper changed Z.');
            nz = p1z;
            displacement.z = 0;
            const br = this.bumperRadius;
            if (displacement.lengthSq() > br * br)
            {
                displacement.normalize().multiplyScalar(br / 2);
                correct = true;
            }
        }

        // Apply.
        if (correct)
        {
            console.log('Correcting bump');
            nx = p1x + displacement.x;
            ny = p1y + displacement.y;
            nz = p1z + displacement.z;
        }
        if (displacement.manhattanLength() > 0) this._hasBumped = true;
        this.position1.set(nx, ny, nz);
        this.updateBumperLifterAfterChange(displacement);
    },

    lift(displacement, byAStaticObject, readOnly)
    {
        const l = displacement.length();
        if (l > this.lifterRadius)
        {
            if (this._debug)
                console.warn('[Character/Response] Big lift clamped.');
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
            if (byAStaticObject) this.wasLiftedByAStaticObject = true;
            else this.wasLifted = true;
            this.velocity1.z = 0;
            // ^ Reset velocity orthogonal to gravity
        }

        // Apply.
        if (!readOnly)
        {
            this.position1.set(nx, ny, nz);
            this.updateBumperLifterAfterChange(displacement);
        }
    },

    stepDown(collider)
    {
        // 1. go down by h / 2
        let bumperCenter = this.bumperCenterTest; // Should be set to p1!
        let bumperCenterLocal = this.bumperCenterTestTranslated;
        bumperCenter.copy(this.position1);
        // ^ was possibly already bumped (but not lifted)
        const gravityUp = this._w4;
        gravityUp.copy(this.gravity).negate().normalize();
        if (gravityUp.manhattanLength() === 0)
            gravityUp.z = -10; // needed to orient bumper and lifter even when g = 0

        // Step down by half lifter radius.
        bumperCenter.z -= this.stepDownHeight;

        // 2. check lift on all entities + heightmaps
        // TEST ONLY
        // should check on all trimeshes first
        // translate coordinates again for heightmaps
        const cd = this.stepDownCollisionData;
        this.wasLifted = false;
        this.wasLiftedByAStaticObject = false;
        // console.log(this.stepDownHeight);
        for (let i = 0; i < cd.length; ++i)
        {
            const model = cd[i];
            if (model[0] === 'hm')
            {
                // (translation to local coords should be done after)
                const heightMap = model[1];
                const extentX = heightMap.extentX;
                const extentY = heightMap.extentY;
                const nbVerticesX = heightMap.nbVerticesX;
                const nbVerticesY = heightMap.nbVerticesY;
                const nbSegmentsX = nbVerticesX - 1;
                const nbSegmentsY = nbVerticesY - 1;
                bumperCenterLocal.copy(bumperCenter);
                const p1x = bumperCenterLocal.x; const hi = heightMap.x;
                const p1y = bumperCenterLocal.y; const hj = heightMap.y;
                const localX = p1x - (hi - .5) * extentX;
                const localY = p1y - (hj - .5) * extentY;
                // ^ extentX and extentY should be the same as sweeper.heightMapSideWidth
                const x = Math.floor(localX / extentX * nbSegmentsX);
                const y = Math.floor(localY / extentY * nbSegmentsY);
                bumperCenterLocal.x = localX;
                bumperCenterLocal.y = localY;

                // only testing
                this.liftAgainstHeightMap(
                    x, y, bumperCenterLocal, gravityUp,
                    heightMap, collider, true
                );
                if (this.wasLifted) break;
            }
            else if (model[0] === 's')
            {
                const trimeshCollisionModel = model[1];

                this.liftAgainstTrimesh(
                    bumperCenter, trimeshCollisionModel, gravityUp,
                    collider, true
                );
                if (this.wasLiftedByAStaticObject) break;
            }
        }

        // if !lift set onGround = false
        if (!this.wasLiftedByAStaticObject && !this.wasLifted)
        {
            this.onGround = false;
            this.wasOnGround = false;
            return;
        }

        // console.log('apply step down');
        this.position1.z -= this.stepDownHeight;
        bumperCenter.copy(this.position1);
        // (possible debug assert: re-lift should not be greater than step down)
        // if there is a (smaller) lift, then apply lift then bump.
        for (let i = 0; i < cd.length; ++i)
        {
            bumperCenter.copy(this.position1); // update after other bump / lifts
            const model = cd[i];
            if (model[0] === 'hm')
            {
                bumperCenterLocal = this.bumperCenter;
                // ^ so that it is affected by lift / bump routines.

                const heightMap = model[1];
                // (translated to local coords)
                const extentX = heightMap.extentX;
                const extentY = heightMap.extentY;
                const nbVerticesX = heightMap.nbVerticesX;
                const nbVerticesY = heightMap.nbVerticesY;
                const nbSegmentsX = nbVerticesX - 1;
                const nbSegmentsY = nbVerticesY - 1;
                bumperCenterLocal.copy(bumperCenter);
                const p1x = bumperCenterLocal.x; const hi = heightMap.x;
                const p1y = bumperCenterLocal.y; const hj = heightMap.y;
                const localX = p1x - (hi - .5) * extentX;
                const localY = p1y - (hj - .5) * extentY;
                let x = Math.floor(localX / extentX * nbSegmentsX);
                let y = Math.floor(localY / extentY * nbSegmentsY);
                bumperCenterLocal.x = localX;
                bumperCenterLocal.y = localY;

                // read and write
                this.liftAgainstHeightMap(
                    x, y, bumperCenterLocal, gravityUp,
                    heightMap, collider
                );

                // apply change (bumperCenterLocal === this.bumperCenter!)
                x = Math.floor(bumperCenterLocal.x / extentX * nbSegmentsX);
                y = Math.floor(bumperCenterLocal.y / extentY * nbSegmentsY);
                this.bumpAgainstHeightMap(
                    x, y, bumperCenterLocal, gravityUp,
                    heightMap, collider
                );
            }
            else if (model[0] === 's')
            {
                const trimeshCollisionModel = model[1];

                this.liftAgainstTrimesh(
                    bumperCenter, trimeshCollisionModel, gravityUp,
                    collider
                );
                bumperCenter.copy(this.position1); // apply change
                this.bumpAgainstTrimesh(
                    bumperCenter, trimeshCollisionModel, gravityUp,
                    collider
                );
            }
        }

        // Compute wasOnGround for next iteration.
        this.onGround = true;
        this.wasOnGround = true;
    }

};

export { CharacterResponseModule };
