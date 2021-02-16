/**
 * Handles entity updates.
 */

'use strict';

let EntitiesUpdateModule = {

    //
    // Updates from server.

    updateEntities(entities)
    {
        if (!entities)
        {
            console.log('Empty update @ server.sub.entities');
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

    //
    // Updates at model refresh.

    addEntity(id, updatedEntity)
    {
        const graphics = this.app.engine.graphics;
        const entities = this.entitiesIngame;

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

    removeEntity(id)
    {
        const graphics = this.app.engine.graphics;
        const entities = this.entitiesIngame;

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

    // v   Position / rotation are updated from the server here!
    updateEntity(
        id, currentEntity, updatedEntity,
    )
    {
        const graphics = this.app.engine.graphics;
        const entities = this.entitiesIngame;

        const pos = currentEntity.position;
        const rot = currentEntity.rotation;

        let up = updatedEntity.p;
        let ur = updatedEntity.r;
        if (!pos || !rot ||
            pos.x !== up.x || pos.y !== up.y || pos.z !== up.z ||
            rot.x !== ur.x || rot.y !== ur.z || rot.z !== ur.w) // two last are shifted
        {
            currentEntity.position.set(up.x, up.y, up.z);
            currentEntity.rotation.set(ur.x, ur.z, ur.w);
            currentEntity.needsUpdate = true;
        }

        // Switch worlds.
        const worldId = parseInt(updatedEntity.w, 10);
        const oldWorldId = currentEntity.getWorldId();
        if (oldWorldId !== worldId)
        {
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

    //
    // Graphics link.

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

        // XXX [ANIMATION] link animation in 3D case
        let p = object3D.position;
        if (currentEntity.isProjectile)
        {
            this.updateProjectile(currentEntity, object3D, p, newP);
        }
        else
        {
            object3D.rotation.x = newR.z; // ur[3];
            object3D.rotation.z = newR.y; // ur[2];
            object3D.getWrapper().rotation.y = Math.PI + newR.x; // + ur[0];
            object3D.updateMatrixWorld();
        }

        // let animate = p.x !== newP.x || p.y !== newP.y;
        p.copy(newP);

        // Update animation
        // const id = currentEntity.id;
        // let graphics = this.app.engine.graphics;
        // if (animate) graphics.updateAnimation(id);
    },

};

export { EntitiesUpdateModule };
