import { COLLISION_EPS } from '../collider';

/**
 * (c) madblade 2021 all rights reserved
 */

let CharacterResponseModule = {

    bumpAgainstHeightMap(
        x, y,
        bumperCenter,
        gravityUp,
        heightMap,
        collider,
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

        const nbXToCheck = Math.ceil(bumpR / elementSizeX);
        const nbYToCheck = Math.ceil(bumpR / elementSizeY);
        const minX = Math.max(x - nbXToCheck - 1, 0);
        const maxX = Math.min(x + nbXToCheck + 1, nbSegmentsX); // nbv - 2
        const minY = Math.max(y - nbYToCheck - 1, 0);
        const maxY = Math.min(y + nbXToCheck + 1, nbSegmentsY); // nbv - 2
        const bumpR = this.bumperRadius;
        const bumpR2 = bumpR * bumpR;

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
                // abd
                v1.set(ix * elementSizeX, iy * elementSizeY, heightA);
                v2.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
                displacement = collider.intersectSphereTriOrthogonal(
                    bumperCenter, bumpR2, v1, v2, v3, bumpR, gravityUp
                );
                this.bump(displacement);

                // bcd
                v1.set(ix * elementSizeX, (iy + 1) * elementSizeY, heightB);
                v2.set((ix + 1) * elementSizeX, (iy + 1) * elementSizeY, heightC);
                v3.set((ix + 1) * elementSizeX, iy * elementSizeY, heightD);
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
        collider
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
            this.lift(displacement, true);
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
            nx = p1x + displacement.x;
            ny = p1y + displacement.y;
            nz = p1z + displacement.z;
        }
        if (displacement.manhattanLength() > 0) this._hasBumped = true;
        this.position1.set(nx, ny, nz);
        this.updateBumperLifterAfterChange(displacement);
    },

    lift(displacement, byAStaticObject)
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
        this.position1.set(nx, ny, nz);
        this.updateBumperLifterAfterChange(displacement);
    },

    stepDown()
    {
        // 1. go down by h / 2
        let bumperCenter = this.bumperCenter; // Should be set to p1!
        // bumperCenter.copy(this.position1);
        // TODO

        // 2. check lift on all entities + heightmaps
        // check on all trimeshes first
        // translate coordinates again for heightmaps

        // if !lift set onGround = false
        // if lift greater than step down, error
        // if lift smaller, then apply lift then bump.

        // Compute wasOnGround for next iteration.
        this.wasOnGround = false;
    }

};

export { CharacterResponseModule };
