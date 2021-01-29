/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend, { assert }     from '../../../extend';
import { PlaceHolder }        from './placeholder';
import { HeightMapConstants } from './model/terrain';

// Broad phase utility.
let Sweeper = function(physics)
{
    this.physics = physics;

    this.orderedObjectsByX = [];
    this.orderedObjectsByY = [];
    this.orderedObjectsByZ = [];

    this.entitiesNeedingToMove = new Set();
    this.dynamicEntities = new Set();
    this.potentialCollidingPairs = new Set();

    // Entity id must equal physics entity index in this array
    this.physicsEntities = [];


    // Height maps are horizontal (up=+Z) by default.
    this.heightMaps = new Map();
    this.heightMapSideWidth = HeightMapConstants.DEFAULT_EXTENT;
    // x,y => array of height maps in the current chunk

    // Engine internals & optimization.
    this.locks = [!1, !1, !1, !1, !1, !1];
    this.availableIndicesInPhysicalEntitiesArray = [];
};

extend(Sweeper.prototype, {

    // Init and model

    reorderObjects()
    {
        let objects = this.physicsEntities;
        let axisX = this.orderedObjectsByX;
        let axisY = this.orderedObjectsByY;
        let axisZ = this.orderedObjectsByZ;
        assert(
            axisX.length === axisY.length &&
            axisX.length === axisZ.length, 'sweeper length'
        );

        // Init objects order on every axis.
        for (let i = 0; i < objects.length; ++i) {
            axisX[i] = i;
            axisY[i] = i;
            axisZ[i] = i;
        }

        axisX.sort((a, b) => {
            if (objects[a].collisionModel.aabbCenter.x <
                objects[b].collisionModel.aabbCenter.x) return -1;
            else if (objects[a].collisionModel.aabbCenter.x >
                objects[b].collisionModel.aabbCenter.x) return 1;
            else return 0;
        });

        axisY.sort((a, b) => {
            if (objects[a].collisionModel.aabbCenter.y <
                objects[b].collisionModel.aabbCenter.y) return -1;
            else if (objects[a].collisionModel.aabbCenter.y >
                objects[b].collisionModel.aabbCenter.y) return 1;
            else return 0;
        });

        axisZ.sort((a, b) => {
            if (objects[a].collisionModel.aabbCenter.z <
                objects[b].collisionModel.aabbCenter.z) return -1;
            else if (objects[a].collisionModel.aabbCenter.z >
                objects[b].collisionModel.aabbCenter.z) return 1;
            else return 0;
        });

        // Init object indices on every axis.
        let numberOfObjects = objects.length;
        for (let i = 0; i < numberOfObjects; ++i) {
            objects[axisX[i]].indexOnXArray = i;
            objects[axisY[i]].indexOnYArray = i;
            objects[axisZ[i]].indexOnZArray = i;
        }
    },

    insertObject(entity)
    {
        const axisX = this.orderedObjectsByX;
        const axisY = this.orderedObjectsByY;
        const axisZ = this.orderedObjectsByZ;

        assert(
            axisX.length === axisY.length &&
            axisX.length === axisZ.length, 'sweeper length'
        );

        if (axisX.length < 1)
        {
            axisX.push(entity); entity.indexOnXArray = 0;
            axisY.push(entity); entity.indexOnYArray = 0;
            axisZ.push(entity); entity.indexOnZArray = 0;
            return;
        }

        const cm = entity.collisionModel;
        const cx = cm.aabbCenter.x;
        const cy = cm.aabbCenter.y;
        const cz = cm.aabbCenter.z;

        // 1. dichotomy insert
        let indexX = this.dichotomyLowerBound(axisX, cx, 'x');
        let indexY = this.dichotomyLowerBound(axisY, cy, 'y');
        let indexZ = this.dichotomyLowerBound(axisZ, cz, 'z');

        // 2. displacement right on all axes
        axisX.splice(indexX, 0, entity);
        while (indexX++ < axisX.length) axisX[indexX].indexOnXArray++;
        axisY.splice(indexY, 0, entity);
        while (indexY++ < axisY.length) axisY[indexY].indexOnYArray++;
        axisZ.splice(indexZ, 0, entity);
        while (indexZ++ < axisZ.length) axisZ[indexZ].indexOnZArray++;
    },

    dichotomyLowerBound(a, value, prop)
    {
        let lo = 0; let hi = a.length - 1; let mid;
        while (lo <= hi) {
            mid = lo + hi >> 1; // floor((lo+hi)/2)
            // priority '+' > priority '>>'
            if (a[mid].collisionModel.aabbCenter[prop] > value) hi = mid - 1;
            else if (a[mid].collisionModel.aabbCenter[prop] < value) lo = mid + 1;
            else return mid;
        }
        return lo;
    },

    reserveEntityId()
    {
        if (this.availableIndicesInPhysicalEntitiesArray.length)
            return this.availableIndicesInPhysicalEntitiesArray.pop();
        else
            return this.physicsEntities.length;
    },

    getNumberOfEntities()
    {
        return this.physicsEntities.length;
    },

    // Pre-physics update.

    anEntityNeedsToMove(entity)
    {
        assert(!entity.isPlaceHolder, '[Sweeper] trying to move a placeholder?');
        this.entitiesNeedingToMove.add(entity);
    },

    addPhysicsEntity(entity)
    {
        assert(typeof entity === 'number', '[Sweeper] entity id typecast failed.');

        this.physicsEntities[entity.entityId] = entity;
        // Don’t sort again, just insert.
        this.insertObject(entity);

        if (!entity.collisionModel.isStatic)
            this.dynamicEntities.add(entity);
    },

    addPhysicsEntityWithoutSorting(entity)
    {
        assert(typeof entity === 'number', '[Sweeper] entity id typecast failed.');

        this.physicsEntities[entity.entityId] = entity;
        this.orderedObjectsByX.push(entity);
        this.orderedObjectsByY.push(entity);
        this.orderedObjectsByZ.push(entity);

        if (!entity.collisionModel.isStatic)
            this.dynamicEntities.add(entity);
    },

    removeEntity(entityId)
    {
        let entity = this.physicsEntities[entityId];
        if (!entity)
            throw Error('[Mad/Sweeper] Trying to remove entity that’s not there.');

        // No need to displace any entity: place dummy inside.
        const axisX = this.orderedObjectsByX; const iX = entity.indexOnXArray;
        const axisY = this.orderedObjectsByY; const iY = entity.indexOnYArray;
        const axisZ = this.orderedObjectsByZ; const iZ = entity.indexOnZArray;
        let ph = new PlaceHolder(iX, iY, iZ, entity.collisionModel.aabbCenter);
        axisX[iX] = ph;
        axisY[iY] = ph;
        axisZ[iZ] = ph;

        this.dynamicEntities.remove(entity);
        this.physicsEntities[entityId] = null; // Free object?
        this.availableIndicesInPhysicalEntitiesArray.push(entityId);
        entity.destroy();
    },

    // Physics update.

    sweepDetectOverlappingPairs()
    {
        // Broad phase.

        // Clear colliding cache.
        this.potentialCollidingPairs.clear();

        // Every object tests against its own extent,
        // So there’s no need to keep track of boundaries.
        // O(dyn n * average n by extent) -> amortized n, worst case n ^ 2
        this.physicsEntities.forEach(entity => {
            if (entity.isPlaceHolder) return;
            const thisId = entity.entityId;
            const neighbors = this.getOverlappingNeighbors(entity);
            for (let n = 0; n < neighbors.length; ++n)
            {
                const otherId = neighbors[n].entityId;

                // Sorted string, ensures unique collision pairs.
                this.potentialCollidingPairs.add(
                    `${Math.min(thisId, otherId)},${Math.max(thisId, otherId)}`
                );
            }
        });
    },

    getOverlappingNeighbors(entity)
    {
        const axisX = this.orderedObjectsByX;
        const axisY = this.orderedObjectsByY;
        const axisZ = this.orderedObjectsByZ;
        const ix = entity.indexOnXArray;
        const iy = entity.indexOnYArray;
        const iz = entity.indexOnZArray;
        const cm = entity.collisionModel;
        const center = cm.aabbCenter;
        const isStatic = cm.isStatic;
        const nbEntities = axisX.length;

        const delta = cm.getP0P1Delta(); // Displacement
        delta.add(cm.getAABBHalf()); // Add half-bounding box

        // Unlock axes.
        const l = this.locks;
        let i;
        for (i = 0; i < 6; ++i) l[i] = false;

        let nbIterations = 0;
        let b = false;
        let overlapping = [];
        do {
            // check x…
            i = ix;
            if (i-- > 0 && this.overlaps(axisX[i], center, delta, isStatic))
                overlapping.push(axisX[i]);
            else l[0] = true;
            i = ix;
            if (i++ < axisX.length && this.overlaps(axisX[i], center, delta, isStatic))
                overlapping.push(axisX[i]);
            else l[1] = true;
            // If left and right are out of range, no one else can overlap!
            if (l[0] && l[1]) break;

            // check y…
            // redundancy is handled by the hashset check
            i = iy;
            if (i-- > 0 && this.overlaps(axisY[i], center, delta, isStatic))
                overlapping.push(axisY[i]);
            else l[2] = true;
            i = iy;
            if (i++ < axisY.length && this.overlaps(axisY[i], center, delta, isStatic))
                overlapping.push(axisY[i]);
            else l[3] = true;
            if (l[2] && l[3]) break;

            // check z…
            i = iz;
            if (i-- > 0 && this.overlaps(axisZ[i], center, delta, isStatic))
                overlapping.push(axisZ[i]);
            else l[2] = true;
            i = iz;
            if (i++ < axisZ.length && this.overlaps(axisZ[i], center, delta, isStatic))
                overlapping.push(axisZ[i]);
            else l[3] = true;
            if (l[2] && l[3]) break;

            b = l[4] && l[5];
        }
        while (!b && nbIterations++ < nbEntities / 2); // loop back if no axis is locked!

        assert(nbIterations < 5, '[Sweeper] more than 5 iterations');
        return overlapping;
    },

    overlaps(otherEntity, currentCenter, delta, isStatic)
    {
        if (otherEntity.isPlaceHolder) return false;
        if (isStatic && otherEntity.isStatic) return false;

        const otherCM = otherEntity.collisionModel;
        const otherCenter = otherCM.aabbCenter;
        const sumOfDeltas = otherCM.getP0P1Delta(); // other displacement
        sumOfDeltas.add(otherCM.getAABBHalf()); // other bounding box

        sumOfDeltas.add(delta); // other dp + this aabb/2 + this dp + this aabb/2

        // test aabb + dp overlaps
        const dx = Math.abs(otherCenter.x - currentCenter.x);
        if (dx > sumOfDeltas.x) return false;
        const dy = Math.abs(otherCenter.y - currentCenter.y);
        if (dy > sumOfDeltas.y) return false;
        const dz = Math.abs(otherCenter.z - currentCenter.z);
        return dz <= sumOfDeltas.z;
    },

    // Post-physics update.

    updateOrderedArraysAfterMove(entityId)
    {
        const axisX = this.orderedObjectsByX;
        const axisY = this.orderedObjectsByY;
        const axisZ = this.orderedObjectsByZ;

        let objects = this.physicsEntities;
        let object = objects[entityId]; // it can be static.
        const length = axisX.length;

        const p = object.center;
        const x = p[0];
        const y = p[1];
        const z = p[2];

        let iXl = object.indexOnXArray - 1;
        let iXr = object.indexOnXArray + 1;
        let iYl = object.indexOnYArray - 1;
        let iYr = object.indexOnYArray + 1;
        let iZl = object.indexOnZArray - 1;
        let iZr = object.indexOnZArray + 1;

        // let hasSwapped = false;
        // let log = /*axis*/() => {
        //     //console.log('\tswap performed on axis ' + axis);
        //     hasSwapped = true;
        // };

        // Resort left X.
        while (iXl > -1 &&
            objects[axisX[iXl].entityId].collisionModel.aabbCenter.x > x)
        {
            this.swap(axisX, iXl, iXl + 1);
            --iXl;
        }
        // Resort right X.
        while (iXr < length &&
            objects[axisX[iXr].entityId].collisionModel.aabbCenter.x < x)
        {
            this.swap(axisX, iXr, iXr - 1);
            ++iXr;
        }

        // Resort left Y.
        while (iYl > -1 &&
            objects[axisY[iYl].entityId].collisionModel.aabbCenter.y > y)
        {
            this.swap(axisY, iYl, iYl + 1);
            --iYl;
        }
        // Resort right Y.
        while (iYr < length &&
            objects[axisY[iYr].entityId].collisionModel.aabbCenter.y < y)
        {
            this.swap(axisY, iYr, iYr - 1);
            ++iYr;
        }

        // Resort left Z.
        while (iZl > -1 &&
            objects[axisZ[iZl].entityId].collisionModel.aabbCenter.z > z)
        {
            this.swap(axisZ, iZl, iZl + 1);
            --iZl;
        }
        // Resort right Z.
        while (iZr < length &&
            objects[axisZ[iZr].entityId].collisionModel.aabbCenter.z < z)
        {
            this.swap(axisZ, iZr, iZr - 1);
            ++iZr;
        }

        // if (hasSwapped) {
        //     console.log('Updated object axis for ' + entityId);
        //     console.log(this.orderedObjectsByX);
        // }
    },

    swap(axisArray, i, j)
    {
        let objects = this.entities;
        SWP(axisArray, i, j);

        if (axisArray === this.orderedObjectsByX) {
            objects[axisArray[i].entityId].indexOnXArray = i;
            objects[axisArray[j].entityId].indexOnXArray = j;
        }
        else if (axisArray === this.orderedObjectsByY) {
            objects[axisArray[i].entityId].indexOnYArray = i;
            objects[axisArray[j].entityId].indexOnYArray = j;
        }
        else if (axisArray === this.orderedObjectsByZ) {
            objects[axisArray[i].entityId].indexOnZArray = i;
            objects[axisArray[j].entityId].indexOnZArray = j;
        }
    },

    refreshEntitiesNeedingMovement()
    {
        this.entitiesNeedingToMove.clear();
        this.dynamicEntities.forEach(e => {
            const cm = e.collisionModel;
            if (!cm.onGround || cm.wantsToMove || cm.isSubjectToContinuousForce)
                this.entitiesNeedingToMove.push(e);
        });
    },

    movePhysicsEntity(entity)
    {
        this.anEntityNeedsToMove(entity);
        // TODO [PHYSICS] notify here when entities should move (force or want movement)
    },
});

let SWP = function(array, i, j)
{
    let t = array[i];
    array[i] = array[j];
    array[j] = t;
    return array;
};

export { Sweeper };
