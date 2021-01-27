/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';

let SphereCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);
    this.isSphere = true;
};

extend(SphereCollisionModel.prototype, {

    collideToSphere(otherCollisionModel)
    {
        // TODO [CRIT] sphere to sphere (none are characters)
        // 1. compute penetration
        // 2. apply repulsion force according to penetration and entity masses

        // NB. don’t try to get a perfect, stable character-to-character
        // collision solver because this is a rabbit hole.
        console.log('sphere vs sphere');
    },

    collideToStatic(otherCollisionModel)
    {
        // TODO [CRIT] sphere to static
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
