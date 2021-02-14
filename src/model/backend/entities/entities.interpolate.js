/**
 * Handles entities position / rotation interpolation.
 */

'use strict';

import { Vector3 } from 'three';

let EntitiesInterpolationModule = {

    interpolatePredictEntities()
    {
        const updateTime = this.getTime();
        // let entities = this.entitiesIngame;
        let entities = this.entitiesNeedingInterpolation;
        entities.forEach(entity => {
            if (!entity.needsUpdate) return;
            this.interpolatePredictEntity(entity, updateTime);
        });
    },

    interpolatePredictEntity(entity, updateTime)
    {
        let upToDatePosition = entity.position;
        let upToDateRotation = entity.rotation;
        let currentP = entity.currentPFromServer;
        let currentR = entity.currentRFromServer;
        let lastP = entity.lastPFromServer;
        let lastR = entity.lastRFromServer;
        if (currentP.distanceTo(upToDatePosition) > 0 ||
            currentR.distanceTo(upToDateRotation) > 0)
        {
            lastP.copy(currentP);
            currentP.copy(upToDatePosition);
            lastR.copy(currentR);
            currentR.copy(upToDateRotation);
            entity.lastUpdateTime = updateTime;

            // if (this.averageDeltaT < 16 || this.averageDeltaT > 100) {
            entity.averageDeltaT = updateTime - entity.lastServerUpdateTime;
            // }
            entity.lastServerUpdateTime = updateTime;
        }
        const deltaServer = entity.averageDeltaT;

        const t = updateTime - entity.lastUpdateTime;
        if (t < deltaServer)
        {
            // interpolate
            const tdt = t / deltaServer;
            const dpx = currentP.x - lastP.x;
            let drx = currentR.x - lastR.x;
            if (drx > Math.PI) drx = 2 * Math.PI - drx;
            if (drx < -Math.PI) drx += 2 * Math.PI;
            const dpy = currentP.y - lastP.y;
            const dry = currentR.y - lastR.y;
            const dpz = currentP.z - lastP.z;
            const drz = currentR.z - lastR.z;
            this.setLerp(
                entity,
                lastP.x + tdt * dpx, lastP.y + tdt * dpy, lastP.z + tdt * dpz,
                lastR.x + tdt * drx, lastR.y + tdt * dry, lastR.z + tdt * drz,
            );
        }
        else if (
            entity.interpolatingP.distanceTo(currentP) > 0 ||
            entity.interpolatingR.distanceTo(currentR) > 0)
        {
            this.setLerp(
                entity,
                currentP.x, currentP.y, currentP.z,
                currentR.x, currentR.y, currentR.z
            );
            entity.needsUpdate = false;
        }
    },

    setLerp(
        entity, px, py, pz, rx, ry, rz
    )
    {
        let v = new Vector3();
        entity.interpolatingP.set(px, py, pz);
        entity.interpolatingR.set(rx, ry, rz);
        this.updateGraphicalEntity(entity, entity.interpolatingP, entity.interpolatingR, v);
    },

    // Catmull interpolation, could come in handy
    cerp(a, b, c, d, t)
    {
        const m0 = a ? [c[0] - a[0], c[1] - a[1], c[2] - a[2]] : [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
        const m1 = d ? [d[0] - b[0], d[1] - b[1], d[2] - b[2]] : [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
        return this.catmull(b, c, m0, m1, t);
    },

    catmull(p0, p1, m0, m1, t)
    {
        const t2 = t * t;
        const a = 1 + t2 * (2 * t - 3);
        const b = t * (1 + t2 * (t - 2));
        const c = t2 * (3 - 2 * t);
        const d = t2 * (t - 1);
        return [
            a * p0[0] + b * m0[0] + c * p1[0] + d * m1[0],
            a * p0[1] + b * m0[1] + c * p1[1] + d * m1[1],
            a * p0[2] + b * m0[2] + c * p1[2] + d * m1[2],
        ];
    },

};

export { EntitiesInterpolationModule };
