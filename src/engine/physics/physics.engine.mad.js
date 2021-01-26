/**
 * Lightweight, simple, fast, sphere-actor physics engine.
 * For use in the main thread.
 *
 * (c) madblade 2021
 * All rights reserved
 * No commercial use — I’m for hire!
 */

'use strict';

import extend            from '../../extend';
import { Sweeper }       from './mad/sweeper';
import { Collider }      from './mad/collider';
import { Integrator }    from './mad/integrator';
import { PhysicsEntity } from './mad/entity';
import TimeUtils         from './mad/time';

let MadEngine = function(physics)
{
    this.physics = physics;

    this.sweeper = new Sweeper(this);
    this.collider = new Collider(this.sweeper);
    this.integrator = new Integrator(this.sweeper);

    // Time management
    this._stamp = TimeUtils.getTimeSecNano();
    this._variableDt = false;
};

extend(MadEngine.prototype, {

    initObject()
    {
        this.sweeper.reorderObjects();
    },

    // collisionModelSettings:
    //      type: 'sphere', 'cylinder', 'platform', 'box', 'terrain'/analytic/axis-aligned/trimesh, 'character'
    //      static: bool
    //      intelligent: bool
    addPhysicsEntity(center, collisionModelSettigs)
    {
        let entityId = this.sweeper.reserveEntityId(); // from 0 to length
        let entity = new PhysicsEntity(entityId, this.sweeper, center, collisionModelSettigs);
        this.sweeper.addPhysicsEntity(entity);
        return entity;
    },

    movePhysicsEntity(entity)
    {
        this.sweeper.movePhysicsEntity(entity);
    },

    solve()
    {
        // Compute adaptive time step.
        let relativeDt = TimeUtils.getTimeSecNano(this._stamp)[1] / 1e6;
        // Reset stamp before performing physics update.
        this._stamp = TimeUtils.getTimeSecNano();

        // 1. integrate objects needing to move
        this.integrator.integrateMovement(relativeDt);

        // 2. detect collisions
        this.sweeper.sweepDetectOverlappingPairs();

        // 3. correct penetration, compute entities not on ground
        this.collider.collidePairs();

        // 4. notify new entities needing to move
        this.integrator.applyIntegration();
        this.sweeper.refreshEntitiesNeedingMovement();
    },

    getTimeDilation()
    {
        // XXX gameplay specific
        return 1.;
    },

    isWater()
    {
        // XXX gameplay specific
        return false;
    }

});

export { MadEngine };
