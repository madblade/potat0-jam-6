/**
 * Entity model.
 */

'use strict';

import extend, { assert }               from '../../../extend';

import { PlayerModule }                 from './player';
import { ObjectsModule }                from './objects';
import { EntitiesInterpolationModule }  from './entities.interpolate';
import { EntitiesUpdateModule }         from './entities.update';
import { ProjectileUpdateModule }       from './projectile';
import {
    BoxBufferGeometry, DoubleSide,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    Vector3
} from 'three';

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

    this.lookers = new Map();
    // ^  Invokers of the animations/secondary/lookAtPlayer behaviour.
    this.helperCupID = -1;
    // ^  Tutorial / help entity id.
    this.objectiveID = -1;
    // ^  Target cup id.

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
extend(EntityModel.prototype, ObjectsModule);

extend(EntityModel.prototype, {

    init(level)
    {
        let graphics = this.app.engine.graphics;
        let physics = this.app.engine.physics;

        // reset walls
        let animationManager = graphics.animationManager;
        animationManager.resetRaycastables();

        let objects = level.getObjects();
        objects.forEach(o => {
            switch (o.type)
            {
                case 'box':
                    const geo = new BoxBufferGeometry(
                        o.w, o.h, o.d, 2, 2, 2
                    );
                    let mat;
                    if (o.wall) mat = new MeshPhongMaterial(
                        { color: '#eceaea', side: DoubleSide }
                    );
                    else if (o.platform) mat = new MeshBasicMaterial(
                        { color: '#797979' }
                    );
                    else if (o.stone) mat = new MeshPhongMaterial(
                        { color: '#727272' }
                    );
                    const m = new Mesh(geo, mat);
                    m.userData.hasReflection = o.reflection;
                    m.userData.hasPrimaryImage = o.image;
                    const p = o.position;
                    const r = o.rotation;
                    m.position.set(p[0], p[1], p[2]);
                    m.rotation.set(r[0], r[1], r[2]);
                    m.updateMatrixWorld();
                    graphics.addToScene(m, '-1');
                    physics.addStaticMesh(m);
                    if (o.wall)
                        animationManager.addRaycastable(m);
                    break;
            }
        });
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
        this.lookers.clear();
        this.helperCupID = -1;
        this.objectiveID = -1;
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

    makeNewBigCup(px, py, pz, bloom, textSequence)
    {
        const bc = {
            p: new Vector3(px, py, pz),
            r: new Vector3(0, 0, 0),
            k: 'bigcup',
            b: bloom,
        };
        if (textSequence)
            bc.t = textSequence;

        return bc;
    },

    addNewBigCup(newEntities, bigCup, alreadyGenerated)
    {
        assert(!!alreadyGenerated, '[Entities] Argument mismatch.');
        const newID = this.generateNewEntityID(alreadyGenerated);
        newEntities[newID] = bigCup;
        alreadyGenerated.push(newID);
        return newID;
    },

    setHelperCupID(id)
    {
        this.helperCupID = id;
    },

    setObjectiveID(id)
    {
        this.objectiveID = id;
    },

    triggerObjectiveShrink()
    {
        const id = this.objectiveID;
        assert(id !== -1, '[Entities] Cannot shrink objective.');
        if (id < 0) return;
        this.triggerShrink(id);
    },

    triggerShrink(id)
    {
        const entity = this.entitiesIngame.get(id.toString());
        assert(!!entity, `[Entities] Cannot shrink ${id}.`);
        if (!entity) return;
        entity.isShrinking = true;
    },

    setHelperCupTextSequence(newTextSequence)
    {
        const id = this.helperCupID;
        assert(id !== -1, '[Entities] Cannot feed text.');
        if (id < 0) return;
        const c = this.lookers.get(id.toString());
        const tc = c.textComponent;
        assert(!!tc, '[Entities] Cannot feed text.');
        if (!tc) return;
        tc.setTextSequence(newTextSequence);
    },

    talkToHelperCup()
    {
        const id = this.helperCupID;
        if (id < 0) return;
        const c = this.lookers.get(id.toString());
        const tc = c.textComponent;
        if (!tc) return;
        tc.stepTextSequence();
    },

    untalkToHelperCup()
    {
        const id = this.helperCupID;
        if (id < 0) return;
        const c = this.lookers.get(id.toString());
        const tc = c.textComponent;
        if (!tc) return;
        tc.unstepTextSequence();
    },

    getHelperCupDialogueAdvancement()
    {
        const id = this.helperCupID;
        if (id < 0) return;
        const c = this.lookers.get(id.toString());
        const tc = c.textComponent;
        if (!tc) return;
        return tc.textIndex;
    },

    addNewLittleCup(newEntities, px, py, pz, alreadyGenerated)
    {
        assert(!!alreadyGenerated, '[Entities] Argument mismatch.');
        const newID = this.generateNewEntityID(alreadyGenerated);
        newEntities[newID] = {
            p: new Vector3(px, py, pz),
            r: new Vector3(0, 0, 0),
            k: 'littlecup'
        };
        alreadyGenerated.push(newID);
        return newID;
    },

});

extend(EntityModel.prototype, EntitiesUpdateModule);
extend(EntityModel.prototype, ProjectileUpdateModule);
extend(EntityModel.prototype, EntitiesInterpolationModule);

export { EntityModel };
