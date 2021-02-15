/**
 * Projectile update routines.
 */

'use strict';

let ProjectileUpdateModule = {

    updateProjectile(
        currentEntity,
        object3D,
        p,
        newP)
    {
        let graphics = this.app.engine.graphics;

        const dx = newP.x - p.x;
        const dy = newP.y - p.y;
        const dz = newP.z - p.z;
        let v1;
        let v2;
        const pi = Math.PI;
        const dxxdyy = dx * dx + dy * dy;
        if (dxxdyy + dz * dz < 1e-12)
        {
            const selfRotation = this.app.model.backend.selfModel.rotation;
            v1 = selfRotation[2];
            v2 = selfRotation[3];
            let rr = currentEntity.currentRFromServer;
            object3D.rotation.x = Math.PI + rr[3]; // newR.z; // ur[3];
            object3D.rotation.z = rr[2]; // newR.y; // ur[2];
            // object3D.getWrapper().rotation.y = selfRotation[0];
        }
        else
        {
            if (dy > 0) {
                v1 = Math.atan(-dx / dy);
            } else if (dy < 0) {
                v1 = dx < 0 ?
                    pi - Math.atan(dx / dy) : dx > 0 ?
                        -pi + Math.atan(-dx / dy) : /*x === 0 ?*/ pi;
            } else /*if (y === 0)*/ {
                v1 = dx < 0 ? pi / 2 : dx > 0 ? -pi / 2 : /*x === 0*/ 0;
            }

            if (dz < 0) {
                v2 = -Math.atan(Math.sqrt(dxxdyy) / dz);
            } else if (dz > 0) {
                v2 = pi - Math.atan(Math.sqrt(dxxdyy) / dz);
            } else /*if (z === 0)*/ {
                v2 = pi / 2;
            }
            // this.newRot = Date.now();
            // this.elapsed  = this.newRot - (this.lastRot || 0);
            // this.lastRot = this.newRot;
            // console.log(this.elapsed);

            object3D.rotation.x = Math.PI + v2; // newR.z; // ur[3];
            object3D.rotation.z = v1; // newR.y; // ur[2];
            //object3D.getWrapper().rotation.y = Math.PI + newR.x; // + ur[0];
            if (!currentEntity.inScene)
            {
                currentEntity.inScene = true;
                graphics.addToScene(object3D, currentEntity.getWorldId());
            }
            let helper = currentEntity.getHelper();
            if (helper && helper.geometry)
            {
                let positions = helper.geometry.attributes.position.array;
                const MAX_POINTS = positions.length / 3;
                let drawRange = helper.geometry.drawRange.count;
                let index = 3 * drawRange;
                if (drawRange < MAX_POINTS)
                {
                    positions[index++] = newP.x;
                    positions[index++] = newP.y;
                    positions[index++] = newP.z;
                    helper.computeLineDistances();
                    helper.geometry.setDrawRange(0, drawRange + 1);
                    helper.geometry.attributes.position.needsUpdate = true;
                    helper.geometry.computeBoundingSphere();
                    // console.log(helper.geometry.attributes.position.array);
                }
                else
                {
                    index = 0;
                    for (let i = 0; i < MAX_POINTS - 1; ++i)
                    {
                        positions[index]     = positions[index + 3];
                        positions[index + 1] = positions[index + 4];
                        positions[index + 2] = positions[index + 5];
                        index += 3;
                    }
                    positions[index] = newP.x;
                    positions[index + 1] = newP.y;
                    positions[index + 2] = newP.z;

                    helper.computeLineDistances();
                    helper.geometry.setDrawRange(0, drawRange + 1);
                    helper.geometry.attributes.position.needsUpdate = true;
                    helper.geometry.computeBoundingSphere();
                }
            }
        }

        object3D.updateMatrixWorld();
    }

};

export { ProjectileUpdateModule };
