/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel }   from './collisionmodel';
import extend, { inherit }  from '../../../../extend';

let SphereCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);
    this.isSphere = true;

    // XXX [LOW]
    // More flexible than Character.
    // Might be used for special entities.
};

inherit(SphereCollisionModel, CollisionModel);

extend(SphereCollisionModel.prototype, {

    computeAABB()
    {
        // XXX
        // Must compute extent and place the center at the middle.
        this.computeAABBHalf();
    },

    collideAgainstTerrain() // offsetX, offsetY, heightmaps, collider)
    {
        if (this.isStatic)
        {
            console.warn('[Sphere] expected self to be dynamic.');
            return;
        }

        console.log('[Sphere] Sph vs Terrain collision not implemented.');

        // 1. Compute heightmap(s) patches.

        // 3. Collide against patch(es).

        // 4. Compute onGround property.
        //      if on ground, compute terrain normal.
    },

    collideAgainstSphere(otherCollisionModel)
    {
        if (!otherCollisionModel.isSphere)
        {
            console.warn('[Sphere] expected another sphere.');
        }

        console.log('[Sphere] Sph v Sph collision not implemented.');

        // 1. compute penetration
        // 2. apply repulsion force according to penetration and entity masses

        // NB. don’t try to get a perfect, stable character-to-character
        // collision solver because this is a rabbit hole.
    },

    collideAgainstStatic(otherCollisionModel)
    {
        if (!otherCollisionModel.isStatic)
        {
            console.warn('[Sphere] expected static object.');
            return;
        }

        console.log('[Sphere] Sph v Stc collision not implemented.');

        // 1. intersect sphere to object
        // 2. move back from penetration.
        // 2. compute onGround property.
        // 3. if intelligent and onGround, compute ground normal.

        // CAREFUL: if any static entity is removed,
        // all dynamic entities should be reset: onGround = false
        // to prevent them from floating.
    },

});

export { SphereCollisionModel };
