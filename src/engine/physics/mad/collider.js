/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend      from '../../../extend';
import { Vector3 } from 'three';

let Collider = function(sweeper)
{
    this.sweeper = sweeper;

    this._w1 = new Vector3();
    this._w2 = new Vector3();
    this._w3 = new Vector3();
    this._w4 = new Vector3();
};

extend(Collider.prototype, {

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
            this.collidePairs(entity1, entity2);
        });
    },

    collidePair(entity1, entity2)
    {
        let collisionModel1 = entity1.collisionModel;
        let collisionModel2 = entity2.collisionModel;
        if (collisionModel1.isStatic && collisionModel2.isStatic)
            throw Error('[Mad/Collider] Static-to-static not allowed');

        // TODO narrow phase
    },

    // Internal routines

    intersectSphereTri(sphereC, radiusSquared, v1, v2, v3)
    {
        // 1. Check all vertices
        let dTest = sphereC.distanceToSquared(v1);
        if (dTest < radiusSquared)
            return this.intersectionCallback();
        dTest = sphereC.distanceToSquared(v2);
        if (dTest < radiusSquared)
            return this.intersectionCallback();
        dTest = sphereC.distanceToSquared(v3);
        if (dTest < radiusSquared)
            return this.intersectionCallback();

        // 2. Check penetration inside triangle
        // project on plane
        const projected = this._w1;
        const normal = this._w2;
        const v1v2 = this._w3;
        const v1v3 = this._w4;
        v1v2.copy(v2).addScaledVector(v1, -1);
        v1v3.copy(v3).addScaledVector(v1, -1);
        normal.copy(v1v2).cross(v1v3);
        projected.copy(sphereC).projectOnPlane(normal);

        // 3. Check penetration from the sides
        // TODO
    },

    intersectionCallback()
    {
        // TODO Compute penetration and apply response.
    }
});

export { Collider };
