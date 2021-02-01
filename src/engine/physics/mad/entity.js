/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { Vector3 }        from 'three';
import extend             from '../../../extend';

// Generic entity that can collide.
let PhysicsEntity = function(
    entityId,
    center
)
{
    this.entityId = entityId;
    this.indexOnXArray = 0;
    this.indexOnYArray = 0;
    this.indexOnZArray = 0;
    this.center = new Vector3();
    this.center.copy(center);

    this.collisionModel = null;

    // Optimization
    this.isStatic = true;
    this.isIntelligent = false;
};

extend(PhysicsEntity.prototype, {

    setCollisionModel(cm)
    {
        this.collisionModel = cm;
        this.isStatic = cm.isStatic;
        this.isIntelligent = cm.isIntelligent;

        if (!this.isStatic)
        {
            cm.position0.copy(this.center);
            cm.position1.copy(this.center);
        }
    },

    destroy()
    {
        this.collisionModel.destroy();
        this.center = null;
        this.collisionModel = null;
    }

});

export { PhysicsEntity };
