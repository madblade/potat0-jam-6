/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend               from '../../../../extend';
import { Matrix4, Vector3 } from 'three';

let TrimeshCollisionModel = function(
    physicsEntity, collisionSettings, e,
    trimesh // must be a THREE.Mesh
)
{
    CollisionModel.call(this, physicsEntity, collisionSettings, e);
    this.isTrimesh = true;

    this.positionAttribute = null; // three positions attribute
    this.indexAttribute = null; // three index attribute

    this.localTransform = new Matrix4();
    this.localTransformInverse = new Matrix4();
    if (trimesh)
    {
        this.trimesh = trimesh;
        this.localTransform.copy(trimesh.matrixWorld);
        this.localTransformInverse.copy(this.localTransform).invert();

        // internals
        this._v = new Vector3();
    }
};

TrimeshCollisionModel.prototype = Object.create(CollisionModel.prototype);

extend(TrimeshCollisionModel.prototype, {

    computeAABB()
    {
        if (this.trimesh)
        {
            const array = this.trimesh.geometry.attributes.position.array;
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let minZ = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let maxZ = Number.NEGATIVE_INFINITY;
            const nbPoints = array.length / 3;
            const v = this._v;
            for (let i = 0; i < nbPoints; ++i)
            {
                v.set(array[3 * i], array[3 * i + 1], array[3 * i + 2]);
                v.applyMatrix4(this.localTransform);
                minX = Math.min(minX, v.x);
                minY = Math.min(minY, v.y);
                minZ = Math.min(minZ, v.z);
                maxX = Math.max(maxX, v.x);
                maxY = Math.max(maxY, v.y);
                maxZ = Math.max(maxZ, v.z);
            }
            this.aabbXExtent.set(minX, maxX);
            this.aabbYExtent.set(minY, maxY);
            this.aabbZExtent.set(minZ, maxZ);
            this.aabbCenter.applyMatrix4(this.localTransform);
        }

        this.computeAABBHalf();
    },

});

export { TrimeshCollisionModel };
