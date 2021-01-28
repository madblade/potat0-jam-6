/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';

let TrimeshCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);
    this.isTrimesh = true;

    this.positionAttribute = null; // three positions attribute
    this.indexAttribute = null; // three index attribute
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
