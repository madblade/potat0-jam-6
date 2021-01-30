/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend      from '../../../extend';
import { Vector3 } from 'three';

const COLLISION_EPS = 0.000001;

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
    this._w7 = new Vector3();
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
        const heightMapWidth = this.sweeper.heightMapSideWidth;
        entitiesNeedingToMove.forEach(e => {
            const cm = e.collisionModel;
            if (!cm.isSphere && !cm.isCharacter)
            {
                console.warn('[Mad/Collider] Trying to terrain-collide a non-sphere.');
                return;
            }
            // skip entities that are already on ground
            if (cm.onGround) return;

            // 1. Find heightmaps by coordinates.
            const p1 = cm.position1; // Collide at p1.
            const x = p1.x;
            const y = p1.y;
            const i = Math.floor(x / heightMapWidth + .5);
            const j = Math.floor(y / heightMapWidth + .5);
            const id = `${i},${j}`;
            let hms = heightMaps.get(id);
            if (!hms)
            {
                console.warn(`[Mad/Collider] No height map underneath ${e.entityId}??`);
                return;
            }

            // 2. Collide.
            const localX = x - (i - .5) * heightMapWidth;
            const localY = -y - (j - .5) * heightMapWidth;
            cm.collideAgainstTerrain(localX, localY, hms, this);
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
            dynamicEntityCM.collideAgainstStatic(staticEntityCM);
            return;
        }
        if (dynamicEntityCM.isCharacter)
        // e.g. sphere, cylinder, trimesh, box, static platform
        {
            dynamicEntityCM.collideAgainstStatic(staticEntityCM);
        }
    },

    // Gameplay might go here!
    collideDynamicToDynamic(entity1CM, entity2CM)
    {
        if (entity1CM.isCharacter && entity2CM.isCharacter)
            return entity1CM.collideAgainstCharacter(entity2CM);
        if (entity1CM.isSphere && entity2CM.isSphere)
            return entity1CM.collideAgainstSphere(entity2CM);
        if (entity1CM.isCharacter)
            return entity1CM.collideAgainstDynamicSphere(entity2CM);
        if (entity2CM.isCharacter)
            return entity2CM.collideAgainstDynamicSphere(entity1CM);
    },

    // Internal routines

    /**
     * @param c sphere center
     * @param radiusSquared sphere radius squared
     * @param v1 triangle vertex 1
     * @param v2 triangle vertex 2
     * @param v3 triangle vertex 3
     * @param radius sphere radius
     * @param pass pass number. 2 pass per iterations (1 inside, 1 outside)
     * @output displacement vector to go back to a clear state.
     */
    intersectSphereTriOrthogonal(c, radiusSquared, v1, v2, v3, radius, pass)
    {
        // 1. Get closest point in triangle
        const closest = this.getClosestPointInTri(c, v1, v2, v3);

        const displacement = this._w5;

        // if (pass % 2 === 0 && !this._insideFace)
        // {
        //     // wait until next pass
        //     displacement.set(0, 0, 0);
        //     return displacement; // return null instead?
        // }

        // careful: closest allocates _w4
        // careful: v1v2 allocates _w1
        // careful: v1v3 allocates _w2
        const cToClosest = this._w3;
        cToClosest.copy(closest).addScaledVector(c, -1);

        // 2. Check distance
        const distToClosest2 = cToClosest.lengthSq();
        if (distToClosest2 > radiusSquared + COLLISION_EPS)
        // adding EPS to a squared distance… hopefully this goes well.
        // it saves a bunch of sqrt calls so that can’t be bad
        {
            // no contact
            displacement.set(0, 0, 0);
            return displacement; // return null instead?
        }

        // 3. Collide
        const normal = this._w6;
        const v1v2 = this._w1; // allocated by getClosestPointInTri!
        const v1v3 = this._w2; // allocated by getClosestPointInTri!
        normal.copy(v1v2).cross(v1v3);
        normal.normalize();
        // normal.y = -normal.y; // (remember, we work in the flipped world)
        window.dh.h.setDirection(normal);
        // window.dh.s.position.copy(closest);
        // window.dh.sg1.position.copy(v1);
        // window.dh.sg2.position.copy(v2);
        // window.dh.sg3.position.copy(v3);

        const l2 = normal.length();

        if (l2 >= COLLISION_EPS) // hmm… I don’t like using the same EPS here.
        {
            normal.multiplyScalar(1. / l2); // normalized

            // This is the regular normal-pushback routine
            // that can be used somewhere else.
            // The lifter should manage everything ground-related, so this should be
            // essentially dead code.
            // Keeping it for reference.

            const distToClosest = Math.sqrt(distToClosest2);

            if (!this._insideFace)
            {
                // outside: pull back by the penetration amount.
                displacement.copy(cToClosest)
                    .normalize()
                    .multiplyScalar(distToClosest - radius - COLLISION_EPS);

                // possible enhancement?
                //  1. project c on triangle plane.
                //  2. compute penetration on plane.
                //  3. pull back on normal by penetration.
                // keep coherent with the inside case;
                // can afford a little bit of penetration.
                // normal.projectOnPlane(gravityUp);
                displacement.projectOnVector(normal); // OOB risk on edges
                // displacement.projectOnPlane(gravityUp);
                // displacement.set(0, 0, 0);
                // if (displacement.manhattanLength() > 0) {
                //     console.log('outside');
                //     console.log(displacement);
                // }
                displacement.y = -displacement.y;
                return displacement;
            }

            // inside face: slide along normal
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
            // (this is not an analytic solution! just an approx that seems to work well
            // in practice)
            // normal.projectOnPlane(gravityUp);
            const l = Math.abs(projection2 - projection1 + COLLISION_EPS);
            // if (l > 0) console.log(l);
            displacement.copy(normal).multiplyScalar(l);
            displacement.y = -displacement.y;
            // displacement.negate();
            // displacement.projectOnPlane(gravityUp);
            // displacement.set(0, 0, 0);
            // displacement.multiplyScalar(0.1);

            // This used to work but is broken with heightmaps, no time to investigate:
            // cToClosest.y = -cToClosest.y;
            // b.copy(cToClosest);// b.y = -b.y;
            // b.normalize().multiplyScalar(radius).projectOnPlane(gravityUp);
            // a.copy(cToClosest);// a.y = -a.y;
            // a.projectOnPlane(gravityUp);
            // const l = Math.abs(b.length() - a.length());
            // a.normalize().multiplyScalar(l).negate();
            // displacement.copy(a);
            // displacement.y = -displacement.y; // flipped world

            if (displacement.manhattanLength() > 0) {
                // console.log('inside');
                // console.log(v1);
                // console.log(v2);
                // console.log(v3);
                // console.log(normal);
                // console.log(displacement);
            }
        }
        else displacement.set(0, 0, 0);

        return displacement;
    },

    intersectSphereTriVertical(c, radiusSquared, v1, v2, v3, radius, gravityUp)
    // for lifter
    // gravityUp should point to -gravity and be normalized.
    {
        // 1. Get closest point in triangle
        const closest = this.getClosestPointInTri(c, v1, v2, v3);
        // careful: closest allocates _w4
        // careful: v1v2 allocates _w1
        // careful: v1v3 allocates _w2
        const cToClosest = this._w3;
        cToClosest.copy(closest).addScaledVector(c, -1);
        const displacement = this._w5;
        const distToClosest2 = cToClosest.lengthSq();

        // 2. Check range
        if (distToClosest2 > radiusSquared + COLLISION_EPS)
        {
            displacement.set(0, 0, 0);
            return displacement;
        }

        // 3. Compute lifting amount: intersect point & plane
        // line: p1 + gravity * d
        // plane: q (v1 + normal * radius), normal

        // d = (q - p1) * normal / (gravity dot normal)
        // if gravity dot normal ~ 0, abort.
        const normal = this._w6;
        const v1v2 = this._w1; // allocated by getClosestPointInTri!
        const v1v3 = this._w2; // allocated by getClosestPointInTri!
        normal.copy(v1v2).cross(v1v3);
        // normal.y = -normal.y;
        const l2 = normal.lengthSq();
        if (l2 <= COLLISION_EPS) { // ignore small triangles
            displacement.set(0, 0, 0);
            return displacement;
        }
        normal.multiplyScalar(1. / Math.sqrt(l2)); // normalize

        let projection1 = normal.dot(cToClosest);
        if (projection1 > 0) normal.negate();
        let dotGN = normal.dot(gravityUp);
        if (dotGN < COLLISION_EPS)
        {
            // Somehow this triggers often with very steep slopes. Investigate later.
            if (dotGN < 0)
            {
                // console.error('[Collider] Flipped triangle (from underneath heightmap?).');
            }
            else
            {
                console.warn('[Collider] Very steep lift skipped.');
                displacement.set(0, 0, 0);
                return displacement;
            }
        }
        const q = this._w7;

        // This seems to be a good approximation! But needs more thorough testing.
        const disp = Math.abs(cToClosest.normalize().dot(normal));

        q.copy(closest).addScaledVector(normal, disp * radius + COLLISION_EPS);
        q.addScaledVector(c, -1); // p0 in plane - l0 in line
        const dotPLN = Math.abs(q.dot(normal));
        const d = dotPLN / dotGN; // (p0 - l0) . n / (l . n)
        displacement.copy(gravityUp).multiplyScalar(d);
        // p = l0 + l * d

        // if (displacement.manhattanLength() > 0) console.log(displacement);

        return displacement;
    },

    // From Christer Ericson’s handbook, using barycentric coordinates.
    // Could be optimised by checking V1V2V3 region first (as is done in Bullet)
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
        if (det1 <= 0. && d1 >= 0. && d3 <= 0.)
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
        if (det3 <= 0. && d4 - d3 >= 0. && d5 - d6 >= 0.)
        {
            const w = (d4 - d3) / (d4 - d3 + d5 - d6);
            const result = this._w4;
            result.copy(v3).addScaledVector(v2, -1).multiplyScalar(w).add(v2);
            // v2 + w * (v3 - v2)
            return result;
        }

        // Check V1V2V3 face region
        const frac = 1. / (det3 + det2 + det1);
        const v = det2 * frac;
        const w = det1 * frac;
        const result = this._w4;
        result.copy(v1).addScaledVector(v1v2, v).addScaledVector(v1v3, w);
        this._insideFace = true;
        return result;
    },

});

export { Collider, COLLISION_EPS };
