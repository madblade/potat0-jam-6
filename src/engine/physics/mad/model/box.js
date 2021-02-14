/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel }   from './collisionmodel';
import extend, { inherit }  from '../../../../extend';

let BoxCollisionModel = function(physicsEntity, collisionSettings, e)
{
    CollisionModel.call(this, physicsEntity, collisionSettings, e);
    this.isBox = true;
};

inherit(BoxCollisionModel, CollisionModel);

extend(BoxCollisionModel.prototype, {

    computeAABB()
    {
        this.computeAABBHalf();
    },

});

export { BoxCollisionModel };
