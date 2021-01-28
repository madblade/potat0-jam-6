/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';
import { Matrix4 }        from 'three';

let TrimeshCollisionModel = function(
    physicsEntity, collisionSettings,
    trimesh // must be a THREE.Mesh
)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);
    this.isTrimesh = true;

    this.positionAttribute = null; // three positions attribute
    this.indexAttribute = null; // three index attribute

    this.localTransform = new Matrix4();
    if (trimesh)
    {
        this.trimesh = trimesh;
        this.localTransform.copy(trimesh.matrixWorld);
    }
};

extend(TrimeshCollisionModel.prototype, {

    computeAABB()
    {
        this.computeAABBHalf();
    },

    collideTo(otherCollisionModel)
    {
    }

});

export { TrimeshCollisionModel };
