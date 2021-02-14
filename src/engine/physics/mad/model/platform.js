/**
 * (c) madblade 2021 all rights reserved
 *
 * Maybe this should be able to push entities around?
 * Think about scripting this behavior.
 */

'use strict';

import extend, { inherit } from '../../../../extend';

import { CollisionModel }  from './collisionmodel';

let PlatformCollisionModel = function(physicsEntity, collisionSettings, e)
{
    CollisionModel.call(this, physicsEntity, collisionSettings, e);
    this.isPlatform = true;
};

inherit(PlatformCollisionModel, CollisionModel);

extend(PlatformCollisionModel.prototype, {

    computeAABB()
    {
        this.computeAABBHalf();
    },

});

export { PlatformCollisionModel };
