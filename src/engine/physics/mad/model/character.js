/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { CollisionModel } from './collisionmodel';
import extend             from '../../../../extend';
import { Vector3 }        from 'three';

let CharacterCollisionModel = function(physicsEntity, collisionSettings)
{
    CollisionModel.call(this, physicsEntity, collisionSettings);

    this.isCharacter = true;

    // Overgrowth-like collision model
    this.lifterCenter = new Vector3();
    this.lifterRadius = 0;
    this.bumperCenter = new Vector3();
    this.bumperRadius = 0;
};

extend(CharacterCollisionModel.prototype, {

    updateCollisionModelAfterMovement()
    {
        const physicalEntity = this.entity;
        this.bumperCenter.copy(physicalEntity.center);
        // if character is crouching, update
    },

    collideAgainstStatic(otherCollisionModel)
    {
        // TODO
        // 1. bump // to gravity
        // 2. lift |- to gravity
        // 3. test onGround
    },

    collideAgainstCharacter(otherCollisionModel)
    {
        // solve character interaction
        // self character has a special status
    },

    collideAgainstDynamic(otherCollisionModel)
    {
        // 1. bump / slide
        // 2. apply force to other equal to self acceleration
    }

});

export { CharacterCollisionModel };
