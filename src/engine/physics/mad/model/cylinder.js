/**
 * (c) madblade 2021 all rights reserved
 *
 * Cylinder collision model.
 * Might be used for trees.
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';
import { Vector3 }        from 'three';

let CylinderCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);

    this.isCylinder = true;
    // this.radius = collisionSettings.cylinderRadius;
    // this.position <- this already belongs to
    this.axis = new Vector3();
    this.height = 0;
    this.basePoint = new Vector3();
};

extend(CylinderCollisionModel.prototype, {

    collideTo(otherCollisionModel)
    {
    }

});

export { CylinderCollisionModel };
