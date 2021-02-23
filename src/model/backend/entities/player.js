/**
 * Player graphics link.
 */

'use strict';

import { Entity }           from './entity';

let PlayerModule = {

    loadSkeletalEntity(id, updatedEntity, entities)
    {
        const graphics = this.app.engine.graphics;
        const object3D = graphics.loadReferenceMeshFromMemory(
            'tato', false, true
        );
        object3D.traverse(o => {
            if (!o.isMesh) return;
            o.userData.hasPrimaryImage = true;
        });

        // model
        let entity = new Entity(id, object3D, parseInt(updatedEntity.w, 10));

        // init mixer
        const animations = graphics.animationManager;
        animations.addSkinnedEntityAnimation(
            id, object3D, entity.animationComponent
        );

        // add to graphics
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        // update model
        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);

        // notify physics
        let physics = this.app.engine.physics;
        physics.addCharacterController(entity);
    },

};

export { PlayerModule };
