/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { Vector3 }        from 'three';
import extend             from '../../../extend';

// Generic entity that can collide.
let PhysicsEntity = function(
    entityId,
    sweeper,
    center,
    collisionModel
)
{
    this.entityId = entityId;
    this.indexOnXArray = 0;
    this.indexOnYArray = 0;
    this.indexOnZArray = 0;
    this.center = new Vector3();
    this.center.copy(center);
    this.collisionModel = collisionModel;

    // Optimization
    this.isStatic = collisionModel.isStatic;
    this.isIntelligent = collisionModel.isIntelligent;
};

extend(PhysicsEntity.prototype, {

    destroy()
    {
        this.collisionModel.destroy();
        this.center = null;
        this.collisionModel = null;
    }

});

export { PhysicsEntity };
