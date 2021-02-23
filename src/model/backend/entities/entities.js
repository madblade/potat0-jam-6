/**
 * Entity model.
 */

'use strict';

import extend                          from '../../../extend';

import { PlayerModule }                from './player';
import { EntitiesInterpolationModule } from './entities.interpolate';
import { EntitiesUpdateModule }        from './entities.update';
import {
    BoxBufferGeometry,
    MeshBasicMaterial, Vector3
} from 'three';
import { ProjectileUpdateModule }      from './projectile';

let EntityModel = function(app)
{
    this.app = app;

    // Model component
    this.entitiesOutdated = new Map();
    this.entitiesLoading = new Set();
    this.entitiesIngame = new Map();
    this.entitiesNeedingInterpolation = new Map();
    // ^  (Could be used by Bullet)
    // (We might want to put physical entities in a separate array)

    // Text
    this.labelledEntities = new Map();

    // Graphical component
    this.needsUpdate = false;

    // Interpolation-prediction
    // -> Moved per-entity.
    this.useInterpolation = false;
    // this.lastServerUpdateTime = this.getTime();
    // this.averageDeltaT = -1;
};

extend(EntityModel.prototype, PlayerModule);

extend(EntityModel.prototype, {

    init(level)
    {
        let graphics = this.app.engine.graphics;
        let physics = this.app.engine.physics;
        let objects = level.getObjects();
        objects.forEach(o => {
            switch (o.type)
            {
                case 'box':
                    const geo = new BoxBufferGeometry(
                        o.w, o.h, o.d, 2, 2, 2
                    );
                    const mat = new MeshBasicMaterial(
                        { wireframe: true, color: 0x000000 }
                    );
                    const m = graphics.createMesh(geo, mat);
                    const p = o.position;
                    const r = o.rotation;
                    m.position.set(p[0], p[1], p[2]);
                    m.rotation.set(r[0], r[1], r[2]);
                    m.updateMatrixWorld();
                    graphics.addToScene(m, '-1');
                    physics.addStaticMesh(m);
                    break;
            }
        });
        console.log('[Model/Entities] TODO bind entities to graphics and physics.');
    },

    refresh()
    {
        if (!this.needsUpdate)
        {
            if (this.useInterpolation)
                this.interpolatePredictEntities();
            return;
        }

        let entities = this.entitiesIngame;
        let pushes = this.entitiesOutdated;

        // We’re not actually using the 'outdated' mechanism
        // with direct updates: this is used for client/server multi-player.
        pushes.forEach(
            (updatedEntity, id) =>
            {
                if (this.entitiesLoading.has(id)) return;

                let currentEntity = entities.get(id);
                if (!updatedEntity)
                    this.removeEntity(id);
                else if (!currentEntity)
                    this.addEntity(id, updatedEntity);
                else
                    this.updateEntity(id, currentEntity, updatedEntity);
            }
        );

        if (this.useInterpolation)
            this.interpolatePredictEntities();
        else // XXX we may use both if entities from Bullet are slower
            this.directUpdateEntities();

        // Flush buffer.
        this.entitiesOutdated.clear();

        // Unset dirty flag.
        this.needsUpdate = false;
    },

    getTime()
    {
        return window.performance.now();
    },

    cleanup()
    {
        this.entitiesIngame.clear();
        this.entitiesOutdated.clear();
        this.entitiesLoading.clear();
        this.needsUpdate = false;
        // XXX [CLEANUP] graphical component and all meshes
    },

    generateNewEntityID(entitiesAlreadyGenerated)
    {
        const ingame = this.entitiesIngame;
        const loading = this.entitiesLoading;
        let newID = 1;
        let tries = 0;
        const maxTries = 10000;
        while (
            (ingame.has(newID) || loading.has(newID) ||
            ingame.has(newID.toString()) || loading.has(newID.toString()) ||
            entitiesAlreadyGenerated && (entitiesAlreadyGenerated.indexOf(newID) > -1 ||
            entitiesAlreadyGenerated.indexOf(newID.toString()) > -1)
            ) && ++tries < maxTries
        )
        {
            newID++;
        }
        if (tries >= maxTries) throw Error('[Entities] Too many entities.');
        return newID;
    },

    addNewBigCup(newEntities, px, py, pz)
    {
        const newID = this.generateNewEntityID();
        console.log(`NEW ID ${newID}`);
        newEntities[newID] = {
            p: new Vector3(px, py, pz),
            r: new Vector3(0, 0, 0),
            k: 'bigcup'
        };
        return newID;
    }

});

extend(EntityModel.prototype, EntitiesUpdateModule);
extend(EntityModel.prototype, ProjectileUpdateModule);
extend(EntityModel.prototype, EntitiesInterpolationModule);

export { EntityModel };
