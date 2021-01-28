/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';

let BoxCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);
    this.isBox = true;
};

extend(BoxCollisionModel.prototype, {

    computeAABB()
    {
        this.computeAABBHalf();
    },

    collideTo(otherCollisionModel)
    {
    }

});

export { BoxCollisionModel };
