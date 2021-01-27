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
        console.log('sphere vs sphere');
    }

});

export { SphereCollisionModel };
