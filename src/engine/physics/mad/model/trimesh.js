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
        this.tris = []; // costs some memory but prevents runtime mat4 multiplication

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
            const index = this.trimesh.geometry.index.array;
            const array = this.trimesh.geometry.attributes.position.array;
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let minZ = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let maxZ = Number.NEGATIVE_INFINITY;
            const nbTris = index ? index.length / 3 : pos.length / 9;
            const v = this._v;

            // reset model
            this.tris.length = 0;
            const tris = this.tris;

            for (let i = 0; i < nbTris; ++i)
            {
                const a = index ? index[3 * i] : 3 * i;
                const b = index ? index[3 * i + 1] : 3 * i + 1;
                const c = index ? index[3 * i + 2] : 3 * i + 2;

                v.set(array[3 * a], array[3 * a + 1], array[3 * a + 2]);
                v.applyMatrix4(this.localTransform);
                minX = Math.min(minX, v.x); minY = Math.min(minY, v.y);
                minZ = Math.min(minZ, v.z); maxX = Math.max(maxX, v.x);
                maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
                tris.push(v.x); tris.push(v.y); tris.push(v.z);
                v.set(array[3 * b], array[3 * b + 1], array[3 * b + 2]);
                v.applyMatrix4(this.localTransform);
                minX = Math.min(minX, v.x); minY = Math.min(minY, v.y);
                minZ = Math.min(minZ, v.z); maxX = Math.max(maxX, v.x);
                maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
                tris.push(v.x); tris.push(v.y); tris.push(v.z);
                v.set(array[3 * c], array[3 * c + 1], array[3 * c + 2]);
                v.applyMatrix4(this.localTransform);
                minX = Math.min(minX, v.x); minY = Math.min(minY, v.y);
                minZ = Math.min(minZ, v.z); maxX = Math.max(maxX, v.x);
                maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
                tris.push(v.x); tris.push(v.y); tris.push(v.z);
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
