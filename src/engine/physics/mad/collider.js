/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend      from '../../../extend';
import { Vector3 } from 'three';

const EPS = 0.000001;

let Collider = function(sweeper)
{
    this.sweeper = sweeper;

    // Internals tri/sphere
    this._w1 = new Vector3();
    this._w2 = new Vector3();
    this._w3 = new Vector3();
    this._w4 = new Vector3();
    this._w5 = new Vector3();
    this._w6 = new Vector3();
    this._insideFace = false;
};

extend(Collider.prototype, {

    // Reset onGround property if a static needs to be removed at any time
    atLeastOneStaticEntityWasMoved()
    {
        const dynamicEntities = this.sweeper.dynamicEntities;
        dynamicEntities.forEach(e => {
            e.collisionModel.onGround = false;
        });
    },

    collidePairs()
    {
        let pairs = this.sweeper.potentialCollidingPairs;
        let entities = this.sweeper.physicsEntities;

        pairs.forEach(p => {
            let ids = p.split(',');
            if (ids.length !== 2) throw Error('[Mad/Collider] Invalid collision pair');
            const id1 = parseInt(ids[0], 10);
            const id2 = parseInt(ids[1], 10);
            const entity1 = entities[id1];
            const entity2 = entities[id2];
            this.collidePair(entity1, entity2);
        });
    },

    collidePair(entity1, entity2)
    {
        let collisionModel1 = entity1.collisionModel;
        let collisionModel2 = entity2.collisionModel;
        if (collisionModel1.isStatic && collisionModel2.isStatic)
            throw Error('[Mad/Collider] Static-to-static not allowed');

        if (collisionModel1.isStatic)
            return this.collideStaticToDynamic(collisionModel1, collisionModel2);

        if (collisionModel2.isStatic)
            return this.collideStaticToDynamic(collisionModel2, collisionModel1);

        return this.collideDynamicToDynamic(collisionModel1, collisionModel2);
    },

    collideTerrain()
    {
        const entitiesNeedingToMove = this.sweeper.entitiesNeedingToMove;
        const heightMaps = this.sweeper.heightMaps;
        entitiesNeedingToMove.forEach(e => {
            const cm = e.collisionModel;
            // skip entities that are already on ground
            if (cm.onGround) return;

            const p1 = cm.p1;
            // TODO
            // 1. Find heightmaps by coordinates.
            // 2. Compute heightmap(s) patches.
            // 3. Collide against patch(es).
            // 4. Compute onGround property.
            //      if on ground, compute terrain normal.
        });
    },

    collideStaticToDynamic(staticEntityCM, dynamicEntityCM)
    {
        // (Only dynamic spheres/characters are supported).
        if (!dynamicEntityCM.isSphere && !dynamicEntityCM.isCharacter)
        {
            console.warn(
                `[Mad] Only spheres and characters
                can interact with statics:
                ${dynamicEntityCM.isPlatform ? 'platform' : dynamicEntityCM}.`
            );
            return;
        }
        if (dynamicEntityCM.isSphere)
        // (e.g. projectile)
        // (e.g. adversary)
        {
            // TODO
            // 1. Intersect sphere to object
            // 2. if intelligent, compute onGround property.
            //      if onGround, compute ground normal.
            // 3. else, if intersects

            // CAREFUL: if any static entity is removed,
            // all dynamic entities should be reset: onGround = false
            // to prevent them from floating.
            return;
        }
        if (dynamicEntityCM.isCharacter)
        {
            console.log('Collide character against static object.');
            dynamicEntityCM.collideAgainstStatic(staticEntityCM);
            // e.g. vs sphere, vs cylinder, vs trimesh, vs box, vs static platform
        }
    },

    // Gameplay might go here!
    collideDynamicToDynamic(entity1CM, entity2CM)
    {
        if (entity1CM.isCharacter && entity2CM.isCharacter)
            return entity1CM.collideAgainstCharacter(entity2CM);
        if (entity1CM.isSphere && entity2CM.isSphere)
            return entity1CM.collideToSphere(entity2CM);
        if (entity1CM.isCharacter)
            return entity1CM.collideAgainstDynamic(entity2CM);
        if (entity2CM.isCharacter)
            return entity2CM.collideAgainstDynamic(entity1CM);
    },

    // Internal routines

    /**
     * @param c sphere center
     * @param radiusSquared sphere radius squared
     * @param v1 triangle vertex 1
     * @param v2 triangle vertex 2
     * @param v3 triangle vertex 3
     * @output displacement vector to go back to a clear state.
     */
    intersectSphereTri(c, radiusSquared, v1, v2, v3)
    {
        // 1. Get closest point in triangle
        const closest = this.getClosestPointInTri(c, v1, v2, v3);
        // careful: closest might allocate _w4
        // careful: v1v2 allocates _w1
        // careful: v1v3 allocates _w2
        const cToClosest = this._w3;
        cToClosest.copy(closest).addScaledVector(c, -1);

        // 2. Check distance
        const displacement = this._w5;
        const distToClosest2 = cToClosest.length2();
        if (distToClosest2 > radiusSquared + EPS)
        // adding EPS to a squared distance… hopefully this goes well.
        // it saves a bunch of sqrt calls so that can’t be bad
        {
            // no contact
            displacement.set(0, 0, 0);
            return displacement; // return null instead?
        }

        // 3. Collide
        const distToClosest = Math.sqrt(distToClosest2);
        const radius = Math.sqrt(radiusSquared);
        if (!this._insideFace)
        {
            // outside: pull back by the penetration amount.
            displacement.copy(cToClosest)
                .normalize()
                .multiplyScalar(distToClosest - radius - EPS);
            return displacement;
        }
        else // inside face: slide along normal
        {
            const normal = this._w6;
            const v1v2 = this._w1; // allocated by getClosestPointInTri!
            const v1v3 = this._w2; // allocated by getClosestPointInTri!
            normal.copy(v1v2).cross(v1v3);
            const l2 = normal.length();
            if (l2 >= EPS) // hmm… I don’t like using the same EPS here.
            {
                normal.multiplyScalar(1. / l2); // normalized
                let projection1 = normal.dot(cToClosest);
                cToClosest.multiplyScalar(radius / distToClosest);
                let projection2 = normal.dot(cToClosest);
                if (projection1 === projection2) throw Error('[Mad]: Thales didn’t work :(');

                if (projection1 > 0) // flipped triangle: revert normal
                    normal.negate();
                else { // okay: make projection positive.
                    projection1 *= -1;
                    projection2 *= -1;
                }

                // Move along normal by virtue of the great Thales
                // (and add EPS for good measure)
                displacement.copy(normal).multiplyScalar(projection2 - projection1 + EPS);
            }

            return displacement;
        }
    },

    // From Christer Ericson’s Handbook, using barycentric coordinates.
    // Could be optimised by checking center first (as is done in Bullet)
    // if the triangle is big, compared to the sphere radius.
    getClosestPointInTri(c, v1, v2, v3)
    {
        this._insideFace = false;
        const v1v2 = this._w1;
        const v1v3 = this._w2;
        const cvx = this._w3;
        v1v2.copy(v2).addScaledVector(v1, -1);
        v1v3.copy(v3).addScaledVector(v1, -1);

        // Check V1 region
        cvx.copy(c).addScaledVector(v1, -1); // cv1
        const d1 = v1v2.dot(cvx);
        const d2 = v1v3.dot(cvx);
        if (d1 <= 0. && d2 <= 0.) return v1; // 1,0,0

        // Check V2 region
        cvx.copy(c).addScaledVector(v2, -1); // cv2
        const d3 = v1v2.dot(cvx);
        const d4 = v1v3.dot(cvx);
        if (d3 >= 0. && d4 <= d3) return v2; // 0,1,0

        // Check V1V2 edge region
        const det1 = d1 * d4 - d3 * d2;
        if (det1 <= 0 && d1 >= 0. && d3 <= 0.)
        {
            const v = d1 / (d1 - d3);
            const result = this._w4;
            result.copy(v1).addScaledVector(v1v2, v);
            // v1 + v * v1v2
            return result; // 1-v, v, 0
        }

        // Check V3 region
        cvx.copy(c).addScaledVector(v3, -1);
        const d5 = v1v2.dot(cvx);
        const d6 = v1v3.dot(cvx);
        if (d6 > 0. && d5 <= d6) return v3; // 0,0,1

        // Check V1V3 edge region
        const det2 = d5 * d2 - d1 * d6;
        if (det2 <= 0. && d2 >= 0. && d6 <= 0.)
        {
            const w = d2 / (d2 - d6);
            const result = this._w4;
            result.copy(v1).addScaledVector(v1v3, w);
            // v1 + w * v1v3
            return result; // 1-w, 0, w
        }

        // Check V2V3 edge region
        const det3 = d3 * d6 - d5 * d4;
        if (det3 <= 0 && d4 - d3 >= 0. && d5 - d6 >= 0.)
        {
            const w = (d4 - d3) / (d4 - d3 + d5 - d6);
            const result = this._w4;
            result.copy(v3).addScaledVector(v2, -1).multiplyScalar(w).add(v2);
            // v2 + w * (v3 - v2)
            return result;
        }

        // Check V1V2V3 face region
        const frac = 1. / (det1 + det2 + det3);
        const v = det2 * frac;
        const w = det3 * frac;
        const result = this._w4;
        result.copy(v1).addScaledVector(v1v2, v).addScaledVector(v1v3, w);
        this._insideFace = true;
        return result;
    },

});

export { Collider };