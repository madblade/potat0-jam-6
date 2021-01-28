/**
 * (c) madblade 2021 all rights reserved
 *
 * Maybe this should be able to push entities around?
 * Think about scripting this behavior.
 *
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';

let PlatformCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);
    this.isPlatform = true;
};

extend(PlatformCollisionModel.prototype, {

    computeAABB()
    {
        this.computeAABBHalf();
    },

    collideTo(otherCollisionModel)
    {
    }

});

export { PlatformCollisionModel };
