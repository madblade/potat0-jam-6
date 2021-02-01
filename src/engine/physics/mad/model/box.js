/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';

let BoxCollisionModel = function(physicsEntity, collisionSettings, e)
{
    CollisionModel.call(this, physicsEntity, collisionSettings, e);
    this.isBox = true;
};

BoxCollisionModel.prototype = Object.create(CollisionModel.prototype);

extend(BoxCollisionModel.prototype, {

    computeAABB()
    {
        this.computeAABBHalf();
    },

});

export { BoxCollisionModel };
