/**
 * Lightweight, simple, fast, sphere-actor physics engine.
 * For use in the main thread.
 *
 * (c) madblade 2021
 * All rights reserved
 * No commercial use — I’m for hire!
 */

'use strict';

import extend                 from '../../extend';
import { Sweeper }            from './mad/sweeper';
import { Collider }           from './mad/collider';
import { Integrator }         from './mad/integrator';
import { PhysicsEntity }      from './mad/entity';
import TimeUtils              from './mad/time';
import { Vector3 }            from 'three';
import { HeightMapModel }     from './mad/model/terrain';
import { PhysicsInputModule } from './mad/input/input';

let MadEngine = function(physics)
{
    this.physics = physics;

    this.sweeper = new Sweeper(this);
    this.collider = new Collider(this.sweeper);
    this.integrator = new Integrator(this.sweeper);

    // Exposed settings
    this.gravity = new Vector3(0, 0, -9.8);

    // Time management
    this._stamp = TimeUtils.getTimeSecNano();
    this._variableDt = false;
};

extend(MadEngine.prototype, {

    initObject()
    {
        this.sweeper.reorderObjects();
    },

    // Only fixed-width height maps supported.
    // heightMapOptions format:
    //      nbSegmentsX, nbSegmentsY
    //      threeMesh (!!! Z === 0, to change elevation, change attributes!)
    //      heightBuffer
    //      analyticExpression
    addHeightMap(i, j, heightMapOptions)
    {
        const heightMaps = this.sweeper.heightMaps;
        const id = `${i},${j}`;

        const nbVerticesX = heightMapOptions.nbSegmentsX + 1;
        const nbVerticesY = heightMapOptions.nbSegmentsY + 1;
        const newMap = new HeightMapModel(i, j, nbVerticesX, nbVerticesY);

        if (heightMapOptions.threeMesh)
        {
            newMap.isTrimeshMap = true;
            newMap.setData(heightMapOptions.threeMesh);
        }
        else if (heightMapOptions.heightBuffer)
        {
            newMap.isHeightBuffer = true;
            newMap.setData(heightMapOptions.heightBuffer);
        }
        else if (heightMapOptions.analyticExpression)
        {
            newMap.isAnalytic = true;
            newMap.setData(heightMapOptions.analyticExpression);
        }

        // push into height maps model
        let hm = heightMaps.get(id);
        if (!hm)
        {
            hm = [];
            heightMaps.set(id, hm);
        }
        hm.push(newMap);
    },

    // collisionModelSettings:
    //      type: 'sphere', 'cylinder', 'platform', 'box',
    //      'terrain'/analytic/axis-aligned/trimesh, 'character'
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

        // 0. detect entities needing a move pass.
        this.sweeper.refreshEntitiesNeedingMovement();
        if (this.sweeper.entitiesNeedingToMove.length < 1) return;

        // 1. integrate objects needing to move
        // (this sets p1 for all dynamic entities)
        this.integrator.integrateMovement(relativeDt);

        // 2. detect collisions
        this.sweeper.sweepDetectOverlappingPairs();

        // 3. correct penetration
        this.collider.collidePairs();
        // 4. collide with heightmaps in a separate pass,
        // compute entities not on ground
        this.collider.collideTerrain();

        // 5. notify new entities needing to move
        // (this copies p1 to p0 for dynamic entities)
        // (notice! this also pushes updates to the server model)
        this.integrator.applyIntegration();
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
    },

    cleanup()
    {
        // [XXX] destroy everything here
        this.sweeper.heightMaps.clear();
    }

});

extend(MadEngine.prototype, PhysicsInputModule);

export { MadEngine };
