/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend            from '../../../extend';

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

    this.physicsEntities = [];
    this.availableIndicesInPhysicalEntitiesArray = [];

    // Height maps are horizontal (up=+Z) by default.
    this.heightMaps = new Map();
    // x,y => array of height maps in the current chunk

    // Engine internals.
    this.locks = [!1, !1, !1, !1, !1, !1];
};

extend(Sweeper.prototype, {

    // Init and model

    reorderObjects()
    {
        let objects = this.physicsEntities;
        let axisX = this.orderedObjectsByX;
        let axisY = this.orderedObjectsByY;
        let axisZ = this.orderedObjectsByZ;

        // Init objects order on every axis.
        for (let i = 0; i < objects.length; ++i) {
            axisX[i] = i;
            axisY[i] = i;
            axisZ[i] = i;
        }

        axisX.sort((a, b) => {
            if (objects[a].center.x < objects[b].center.x) return -1;
            else if (objects[a].center.x > objects[b].center.x) return 1;
            else return 0;
        });

        axisY.sort((a, b) => {
            if (objects[a].center.y < objects[b].center.y) return -1;
            else if (objects[a].center.y > objects[b].center.y) return 1;
            else return 0;
        });

        axisZ.sort((a, b) => {
            if (objects[a].center.z < objects[b].center.z) return -1;
            else if (objects[a].center.z > objects[b].center.z) return 1;
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

    insertObject()//entity)
    {
        // TODO dichotomy insert
        // 1. dichotomy insert
        // 2. displacement right
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
        this.entitiesNeedingToMove.add(entity);
    },

    addPhysicsEntity(entity)
    {
        this.physicsEntities[entity.entityId] = entity;
        // TODO [PERF] don’t sort, just insert.
        this.reorderObjects();
        if (!entity.collisionModel.isStatic)
            this.dynamicEntities.add(entity);
    },

    removeEntity(entityId)
    {
        let entity = this.physicsEntities[entityId];
        if (!entity)
            throw Error('[Mad/Sweeper] Trying to remove entity that’s not there.');

        this.dynamicEntities.remove(entity);
        this.physicsEntities[entityId] = null; // Free object?
        this.availableIndicesInPhysicalEntitiesArray.push(entityId);
        entity.destroy();

        // No need to displace all entities.
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
        const center = entity.collisionModel.boundingSphereCenter;
        let radius = entity.collisionModel.boundingSphereRadius;
        const isStatic = entity.collisionModel.isStatic;
        const nbEntities = axisX.length;

        // Take displacement into account
        const dTarget = entity.collisionModel.getDistanceToTarget();
        radius += dTarget;

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
            if (i-- > 0 && this.overlaps(axisX[i], center, radius, isStatic))
                overlapping.push(axisX[i]);
            else l[0] = true;
            i = ix;
            if (i++ < axisX.length && this.overlaps(axisX[i], center, radius, isStatic))
                overlapping.push(axisX[i]);
            else l[1] = true;
            // If left and right are out of range, no one else can overlap!
            if (l[0] && l[1]) break;

            // check y…
            // redundancy is handled by the hashset check
            i = iy;
            if (i-- > 0 && this.overlaps(axisY[i], center, radius, isStatic))
                overlapping.push(axisY[i]);
            else l[2] = true;
            i = iy;
            if (i++ < axisY.length && this.overlaps(axisY[i], center, radius, isStatic))
                overlapping.push(axisY[i]);
            else l[3] = true;
            if (l[2] && l[3]) break;

            // check z…
            i = iz;
            if (i-- > 0 && this.overlaps(axisZ[i], center, radius, isStatic))
                overlapping.push(axisZ[i]);
            else l[2] = true;
            i = iz;
            if (i++ < axisZ.length && this.overlaps(axisZ[i], center, radius, isStatic))
                overlapping.push(axisZ[i]);
            else l[3] = true;
            if (l[2] && l[3]) break;

            b = l[4] && l[5];
        }
        while (!b && nbIterations++ < nbEntities / 2); // loop back if no axis is locked!

        return overlapping;
    },

    overlaps(otherEntity, currentCenter, currentRadius, isStatic)
    {
        if (isStatic && otherEntity.isStatic) return false;

        const otherCenter = otherEntity.collisionModel.boundingSphereCenter;
        const dx = otherCenter.x - currentCenter.x;
        const dy = otherCenter.y - currentCenter.y;
        const dz = otherCenter.z - currentCenter.z;
        const distanceBetweenCenters = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const otherRadius =
            otherEntity.collisionModel.boundingSphereRadius +
            otherEntity.getDistanceToTarget();

        return distanceBetweenCenters < currentRadius + otherRadius;
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
        while (iXl > -1 && objects[axisX[iXl].entityId].center.x > x) {
            // log('x-');
            this.swap(axisX, iXl, iXl + 1);
            --iXl;
        }
        // Resort right X.
        while (iXr < length && objects[axisX[iXr].entityId].center.x < x) {
            // log('x+');
            this.swap(axisX, iXr, iXr - 1);
            ++iXr;
        }

        // Resort left Y.
        while (iYl > -1 && objects[axisY[iYl].entityId].center.y > y) {
            // log('y-');
            this.swap(axisY, iYl, iYl + 1);
            --iYl;
        }
        // Resort right Y.
        while (iYr < length && objects[axisY[iYr].entityId].center.y < y) {
            // log('y+');
            this.swap(axisY, iYr, iYr - 1);
            ++iYr;
        }

        // Resort left Z.
        while (iZl > -1 && objects[axisZ[iZl].entityId].center.z > z) {
            // log('z-');
            this.swap(axisZ, iZl, iZl + 1);
            --iZl;
        }
        // Resort right Z.
        while (iZr < length && objects[axisZ[iZr].entityId].center.z < z) {
            // log('z+');
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
        // TODO [Physics] notify here when entities should move.
        //  (force or want movement)
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