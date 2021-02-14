/**
 * (c) madblade 2021 all rights reserved
 *
 * Box.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { CollisionModel }   from './collisionmodel';

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
