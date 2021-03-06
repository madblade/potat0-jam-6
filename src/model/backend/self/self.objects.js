/**
 * Handles loading and updates for objects attached to avatar.
 */

'use strict';

import { ItemsModelModule }     from './items';
import {
    MeshBasicMaterial,
    Object3D
}                               from 'three';

let SelfObjectsModule = {

    loadSelfGraphics()
    {
        const selfModel = this;
        const graphics = this.app.engine.graphics;
        const worldId = selfModel.worldId;

        const up = graphics.loadReferenceMeshFromMemory(
            'tato', false, true
        );
        selfModel.avatar = up;

        // Init animation mixer.
        const animations = graphics.animationManager;
        animations.addSkinnedEntityAnimation(
            0, up, selfModel.animationComponent
        );
        // animations.addLabelledEntity(
        //     'hello.', 0, selfModel
        // );

        // footsteps
        this.footstepMeshes = [];
        let em = this.app.model.backend.entityModel;
        for (let i = 0; i < 4; ++i)
        {
            const footstepMesh = em.createFootStepMesh();
            graphics.addToScene(footstepMesh);
            this.footstepMeshes.push(footstepMesh);
        }

        // XXX Init IK targets here as well.

        // Change eye color.
        try
        {
            const inner = up.children[0];
            const gltf = inner.children[0];
            const rootBone = gltf.children[0];
            // const mesh = gltf.children[1];
            // mesh.userData.bloom = true;
            const waist = rootBone.children[0];
            const ab = waist.children[0];
            const torso = ab.children[0];
            const neck = torso.children[0];
            const head = neck.children[0];
            const eyes = head.children[0];
            // eyes.material.color.set(0xffffff);
            // eyes.material.emissive.set(0xffffff);
            eyes.material = new MeshBasicMaterial({
                color: '#9d9d9d',
            });
            // eyes.userData.bloom = true;
        } catch (e)
        {
            console.error('[Self/Objetts] Invalid skeleton hierarchy.');
        }

        // Add player to scene.
        graphics.addToScene(selfModel.avatar, worldId);
    },

    /** @deprecated */
    loadSelf()
    {
        let selfModel = this;
        let graphics = this.app.engine.graphics;

        // Player id '-1' never used by any other entity.
        // let entityId = this.entityId;
        let worldId = this.worldId;

        // let createdEntity = graphics.initializeEntity(
        //     entityId, 'steve',
        //     0xffff00
        // );
        // let object3d = graphics.finalizeEntity(
        //     entityId, createdEntity,
        //     0xffff00
        // );
        // selfModel.avatar = object3d;

        let createdEntity = graphics.createMesh(
            graphics.createGeometry('box'),
            graphics.createMaterial(
                'flat-phong',
                {color: 0x00ffff}
            )
        );

        let up = new Object3D();
        let wrapper = new Object3D();
        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.add(createdEntity); // Body.

        up.getWrapper = function()
        {
            return wrapper;
        };

        createdEntity.scale.multiplyScalar(1.);
        selfModel.avatar = up;
        graphics.addToScene(selfModel.avatar, worldId);

        // this.updateHandItem();
    },

    initMelee()
    {
        let graphics = this.app.engine.graphics;
        if (!this.meleeEffectMesh)
        {
            let em = this.app.model.backend.entityModel;
            this.meleeEffectMesh = em.createMeleeMesh();
        }

        let worldId = this.worldId;
        let mesh = this.meleeEffectMesh;
        if (this.meleeWorld !== null && this.meleeWorld !== worldId)
        {
            graphics.removeFromScene(mesh, this.meleeWorld, true);
        }

        this.meleeWorld = worldId;
        this.isHittingMelee = true;
        let us = mesh.getMesh().material.uniforms;
        us.time.value = 0;

        let p = // this.currentPositionFromServer;
            // graphics.cameraManager.mainCamera.up.position;
            this.avatar.position;
        mesh.position.copy(p);

        graphics.addToScene(mesh, worldId);
    },

    updateMelee()
    {
        let graphics = this.app.engine.graphics;
        let mesh = this.meleeEffectMesh;
        let us = mesh.getMesh().material.uniforms;
        us.time.value += 0.1;
        if (us.time.value < 2.0)
        {
            this.isHittingMelee = true;
            let mc = graphics.cameraManager.mainCamera;
            let p = // this.currentPositionFromServer;
                // this.avatar.position;
                graphics.cameraManager.mainCamera.up.position;
            mesh.position.copy(p);

            mesh.rotation.copy(mc.up.rotation);
            mesh.getWrapper().rotation.x = -Math.PI / 2 + 0.2 + mc.pitch.rotation.x;
            mesh.getWrapper().rotation.z = mc.yaw.rotation.z;
        }
        else
        {
            this.isHittingMelee = false;
            this.meleeWorld = null;
            graphics.removeFromScene(mesh, this.meleeWorld, true);
        }
    },

    /** @deprecated */
    updateBow()
    {
        const graphics = this.app.engine.graphics;
        const am = graphics.animationManager;
        const times = am.times;
        const mixers = am.mixers;
        const clips = am.clips;
        const mixer = mixers.get('yumi');
        if (!mixer) return;
        if (this.needsStartLoadingBow)
        {
            mixer.setTime(0);
            mixer.update(0);
            let yumiClip = clips.get('yumi');
            yumiClip.reset();
            yumiClip.play();
            times.set('yumi', Date.now());
            this.needsStartLoadingBow = false;
            this.needsStopLoadingBow = false;
            this.loadingBow = true;
        }
        else if (this.needsStopLoadingBow)
        {
            this.needsStartLoadingBow = false;
            this.needsStopLoadingBow = false;
            mixer.setTime(0);
            mixer.update(0);
            this.isLoadingBow = false;
        }
        else if (this.isLoadingBow)
        {
            // console.log(mixer._root.morphTargetInfluences);
            let prevTime = times.get('yumi') || Date.now();
            let time = Date.now();
            const delta = (time - prevTime) * 0.001;
            mixer.update(delta);
            times.set('yumi', time);
        }
    },

    /** @deprecated */
    updateHandItem()
    {
        let selfModel = this;
        let graphics = this.app.engine.graphics;

        let worldId = this.worldId;
        let handItemID = this.app.model.frontend.selfComponent.getCurrentItemID();
        let handItem;

        if (ItemsModelModule.isItemNaught(handItemID)) handItem = null;
        else if (ItemsModelModule.isItemRanged(handItemID) || ItemsModelModule.isItemMelee(handItemID) ||
            ItemsModelModule.isItemX(handItemID) || ItemsModelModule.isItemBlock(handItemID)
        ) {
            handItem = graphics.getItemMesh(handItemID, true, false);
        } else {
            console.warn('[ServerSelf] Handheld item unrecognized.');
            handItem = null;
        }

        // Third person camera stuff needed here (held items).
        if (selfModel.handItem !== handItem)
        {
            let handItemWrapper = selfModel.handItemWrapper;
            if (selfModel.handItem) // is it possible that it is in another world?
                handItemWrapper.remove(selfModel.handItem);

            selfModel.handItem = handItem;

            if (handItem) {
                handItemWrapper.position.copy(graphics.cameraManager.mainCamera.up.position);
                this.cameraMoved(graphics.cameraManager.mainCamera);
                handItemWrapper.add(handItem);
                if (selfModel.displayHandItem)
                {
                    graphics.addToScene(handItemWrapper, worldId);
                }
            }
        }

        this.needsStopLoadingBow = true;
        this.needsStartLoadingBow = false;
    }

};

export { SelfObjectsModule };
