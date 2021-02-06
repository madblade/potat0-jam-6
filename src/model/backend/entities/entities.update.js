/**
 * Handles entity updates.
 */

'use strict';

let EntitiesUpdateModule = {

    updateEntities(entities)
    {
        if (!entities)
        {
            console.log('Empty update @ server.sub.entities.js');
            return;
        }

        let pushes = this.entitiesOutdated;
        for (let eid in entities) {
            if (!entities.hasOwnProperty(eid)) continue;
            pushes.set(eid, entities[eid]);
        }

        // Set dirty flag.
        this.needsUpdate = true;
    },

    directUpdateEntities()
    {
        let entities = this.entitiesIngame;
        entities.forEach(entity => {
            if (!entity.needsUpdate) return;
            this.directUpdateEntity(entity);
        });
    },

    directUpdateEntity(entity)
    {
        let upToDatePosition = entity.position;
        let upToDateRotation = entity.rotation;
        this.updateGraphicalEntity(entity, upToDatePosition, upToDateRotation);
    },

    updateGraphicalEntity(currentEntity, newP, newR) //, oldP)
    {
        // Update positions and rotation
        let object3D = currentEntity.getObject3D();
        let graphics = this.app.engine.graphics;

        let p = object3D.position;
        let animate = p.x !== newP.x || p.y !== newP.y;
        // XXX [ANIMATION] link animation in 3D case
        if (currentEntity.isProjectile)
        {
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
        else
        {
            object3D.rotation.x = newR.z; // ur[3];
            object3D.rotation.z = newR.y; // ur[2];
            object3D.getWrapper().rotation.y = Math.PI + newR.x; // + ur[0];
            object3D.updateMatrixWorld();
        }
        p.copy(newP);


        // Update animation
        const id = currentEntity.id;
        if (animate) graphics.updateAnimation(id);
    },

    addEntity(id, updatedEntity, graphics, entities)
    {
        this.entitiesLoading.add(id);

        switch (updatedEntity.k)
        {
            case 'ia':
            case 'player':
                this.loadPlayer(id, updatedEntity, graphics, entities);
                break;

            case 'projectile':
                this.loadArrow(id, updatedEntity, graphics, entities);
                break;
            case 'cube':
                this.loadCube(id, updatedEntity, graphics, entities);
                break;

            default:
                console.log(`
                    ServerModel::addEntity: Unknown entity type '${updatedEntity.k}'.
                `);
        }
    },

    removeEntity(id, graphics, entities)
    {
        let entity = entities.get(id);
        if (entity) {
            const wid = entity.getWorldId();
            graphics.removeFromScene(entity.getObject3D(), wid);
            if (entity.helper)
            {
                graphics.removeFromScene(entity.getHelper(), wid);
            }
        }
        entities.delete(id);
    },

    updateEntity(id, currentEntity, updatedEntity, graphics, entities)
    {
        let pos = currentEntity.position;
        let rot = currentEntity.rotation;

        let up = updatedEntity.p;
        let ur = updatedEntity.r;
        if (!pos || !rot ||
            pos[0] !== up[0] || pos[1] !== up[1] || pos[2] !== up[2] ||
            rot[0] !== ur[0] || rot[1] !== ur[2] || rot[2] !== ur[3]) // shifted
        {
            currentEntity.position.set(up[0], up[1], up[2]);
            currentEntity.rotation.set(ur[0], ur[2], ur[3]);
            currentEntity.needsUpdate = true;
        }

        // Switch worlds.
        const worldId = parseInt(updatedEntity.w, 10);
        const oldWorldId = currentEntity.getWorldId();
        if (oldWorldId !== worldId) {
            graphics.removeFromScene(currentEntity.getObject3D(), oldWorldId, true);
            currentEntity.setWorldId(worldId);
            graphics.addToScene(currentEntity.getObject3D(), worldId);

            let helper = currentEntity.getHelper();
            if (helper)
            {
                graphics.removeFromScene(helper, oldWorldId, true);
                graphics.addToScene(helper, worldId);
                console.log(helper);
            }
        }

        // Update current "live" entities.
        entities.set(id, currentEntity);

        if (updatedEntity.d)
        {
            let hasJustMeleed = updatedEntity.d[1];
            if (hasJustMeleed)
            {
                console.log('Someone meleed.');
            }
            // console.log(updatedEntity.d);
        }
    },

};

export { EntitiesUpdateModule };
