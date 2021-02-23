/**
 * Lightweight, simple, fast, sphere-actor physics engine.
 * For use in the main thread.
 *
 * (c) madblade 2021
 * All rights reserved
 * No commercial use — I’m for hire!
 */

'use strict';

import extend                       from '../../extend';

import { Sweeper }                  from './mad/sweeper';
import { Collider }                 from './mad/collider';
import { Integrator }               from './mad/integrator';
import { PhysicsEntity }            from './mad/entity';
import TimeUtils                    from './mad/time';
import { HeightMapModel }           from './mad/model/terrain';
import { PhysicsInputModule }       from './mad/input/input';
import { CollisionModel }           from './mad/model/collisionmodel';
import { CharacterCollisionModel }  from './mad/model/character';
import { TrimeshCollisionModel }    from './mad/model/trimesh';
import {
    Quaternion,
    Vector3
}                                   from 'three';

let MadEngine = function(physics)
{
    this.physics = physics;

    this.sweeper = new Sweeper(this);
    this.collider = new Collider(this.sweeper);
    this.integrator = new Integrator(this.sweeper);

    // Exposed settings
    this.gravity = new Vector3(0, 0, 0);
    this.resetGravity();

    // Time management
    this._stamp = TimeUtils.getTimeSecNano();
    this._variableDt = true;

    // Internals
    this._f = new Vector3(0, 0, 0);
    this._ffr = new Vector3(0, 0, 0);
    this._fto = new Vector3(0, 0, 0);
    this._q = new Quaternion();
    this._p = new Vector3();
    this._s = new Vector3();
};

extend(MadEngine.prototype, {

    resetGravity()
    {
        this.gravity.set(0, 0, -2 * 9.8);
    },

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
        const isWater = heightMapOptions.isWater;
        const newMap = new HeightMapModel(i, j, nbVerticesX, nbVerticesY, isWater);

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

    addStaticMesh(threeMesh)
    {
        let p = threeMesh.position;
        this.addPhysicsEntity(p, {
            trimesh: true,
            mesh: threeMesh,
            static: true,
            intelligent: false
        });
    },

    // collisionModelSettings:
    //      type: 'sphere', 'cylinder', 'platform', 'box',
    //      'terrain'/analytic/axis-aligned/trimesh, 'character'
    //      static: bool
    //      intelligent: bool
    addPhysicsEntity(center, options, originalId)
    {
        let entityId = this.sweeper.reserveEntityId(); // from 0 to length
        let entity = new PhysicsEntity(entityId, center, originalId);

        let collisionModel;
        if (options.character)
            collisionModel = new CharacterCollisionModel(entity, options, this);
        else if (options.trimesh)
            collisionModel = new TrimeshCollisionModel(entity, options, this, options.mesh);
        else
            collisionModel = new CollisionModel(entity, options, this);

        entity.setCollisionModel(collisionModel);
        collisionModel.computeAABB();

        this.sweeper.addPhysicsEntity(entity);
        return entity;
    },

    // This might be called to enforce entity movement.
    // (but it is not necessary as all dynamic entities are checked again by the sweeper
    // if they are not on the ground, if they want to move, or if they are subject to forces)
    /** @deprecated */
    movePhysicsEntity(entity)
    {
        this.sweeper.movePhysicsEntity(entity);
    },

    loadEntities(entities) // Must be called after the player was loaded
    {
        entities.forEach(entity => {
            this.loadEntityWithoutSorting(entity);
        });

        // Compute aabbs indices.
        this.sweeper.reorderObjects();
    },

    loadEntityWithoutSorting(entity)
    {
        this.sweeper.addPhysicsEntityWithoutSorting(entity);
    },

    solve()
    {
        // Compute adaptive time step.
        let relativeDt; // ms
        if (this._variableDt) relativeDt =
            TimeUtils.getTimeSecNano(this._stamp)[1] / 1e6;
        else relativeDt = 16.7;

        // Reset stamp before performing physics update.
        this._stamp = TimeUtils.getTimeSecNano();

        // 0. detect entities needing a move pass.
        this.sweeper.refreshEntitiesNeedingMovement();
        if (this.sweeper.entitiesNeedingToMove.length < 1) return;

        // 1. integrate objects needing to move
        // (this sets p1 for all dynamic entities)
        this.integrator.integrateMovement(relativeDt / 1e3); // s

        // 2. detect collisions
        this.sweeper.sweepDetectOverlappingPairs();

        // 3. correct penetration
        this.collider.collidePairs();
        // 4. collide with heightmaps in a separate pass,
        // compute entities not on ground
        this.collider.collideTerrain();
        // 4.1. for entities not on ground,
        // step down if there is just a little bit of delta with the ground
        // to avoid obnoxiously floaty behaviour.
        this.collider.stepDownEntities();

        // 5. notify new entities needing to move
        // (this copies p1 to p0 for dynamic entities)
        // (notice! this also pushes updates to the server model)
        this.integrator.applyIntegration(relativeDt);

        return relativeDt;
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
        this.resetGravity();
        this.sweeper.cleanup();
        this.collider.cleanup();
        this.integrator.cleanup();
    }

});

extend(MadEngine.prototype, PhysicsInputModule);

export { MadEngine };
