/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend            from '../../../extend';

let Sweeper = function(physics)
{
    this.physics = physics;

    this.orderedObjectsByX = [];
    this.orderedObjectsByY = [];
    this.orderedObjectsByZ = [];

    this.entitiesNeedingToMove = new Set();
    this.dynamicEntities = new Set();
    this.potentialCollidingPairs = [];

    this.physicalEntities = [];
    this.availableIndicesInPhysicalEntitiesArray = [];
};

extend(Sweeper.prototype, {

    // Init and model

    reorderObjects()
    {
        let objects = this.physicalEntities;
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

    reserveEntityId()
    {
        if (this.availableIndicesInPhysicalEntitiesArray.length)
            return this.availableIndicesInPhysicalEntitiesArray.pop();
        else
            return this.physicalEntities.length;
    },

    getNumberOfEntities()
    {
        return this.physicalEntities.length;
    },

    // Pre-physics update.

    anEntityNeedsToMove(entity)
    {
        this.entitiesNeedingToMove.add(entity);
    },

    addPhysicsEntity(entity)
    {
        // XXX I should check that!
        this.physicalEntities[entity.entityId] = entity;
    },

    // Physics update.

    sweepDetectOverlappingPairs()
    {

    },

    updateObjectAxis(entityId)
    {
        let axisX = this.orderedObjectsByX;
        let axisY = this.orderedObjectsByY;
        let axisZ = this.orderedObjectsByZ;

        let objects = this.physicalEntities;
        let object = objects[entityId];
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

    // XXX [PERF] distinguish between 'e' and 'x'
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
            if (!e.onGround || e.wantsToMove || e.isSubjectToContinuousForce)
                this.entitiesNeedingToMove.push(e);
        });
    },

    // Post-physics update.

    movePhysicsEntity(entity)
    {
        this.anEntityNeedsToMove(entity);
        // TODO
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
