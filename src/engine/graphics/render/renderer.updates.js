/**
 * Functions called at every render pass.
 */

'use strict';

let RendererUpdates = {

    darkenNonBloomed(obj, materials)
    {
        if (obj.isMesh && obj.userData.bloom !== true)
        {
            materials[obj.uuid] = obj.material;
            obj.material = this.darkMaterial;
        }
    },

    restoreMaterial(obj, materials)
    {
        if (materials[obj.uuid])
        {
            obj.material = materials[obj.uuid];
            delete materials[obj.uuid];
        }
    },

    selectObjectsWithReflection(scene)
    {
        scene.traverse(obj => {
            if (!obj.isMesh) return;

            if (obj.userData.hasReflection === true) // enforce type
                obj.visible = true;
            else
                obj.visible = false;
        });
    },

    selectObjectsWithPrimaryImage(scene)
    {
        scene.traverse(obj => {
            if (!obj.isMesh) return;

            if (obj.userData.hasPrimaryImage === true)
            {
                obj.visible = true;
            }
            else
                obj.visible = false;
        });
    },

    updateSkies(mainCamera)
    {
        let skies = this.graphics.app.model.backend.chunkModel.skies;
        skies.forEach((sky, worldId) => {
            this.graphics.updateSunPosition(mainCamera, sky, worldId);
        });
    },

    updateFootsteps(deltaT)
    {
        let sm = this.graphics.app.model.backend.selfModel;
        let footsteps = sm.footstepMeshes;
        if (!footsteps) return;
        else
        {
            for (let i = 0; i < footsteps.length; ++i)
            {
                let fs = footsteps[i];
                let us = fs.getMesh().material.uniforms;
                const deltaTInSecs = deltaT / 1e3;
                // deltaT in seconds
                const maxT = 1.; // max animation time
                // time from 0 to 1
                us.time.value += deltaTInSecs / maxT;
            }
        }
    },

    updateWaterReflection(
        cameraManager, renderer, mainScene, mainCamera, renderRegister
    )
    {
        // get main
        const backend = this.graphics.app.model.backend;
        let currentWid = backend.selfModel.worldId.toString();
        if (currentWid === '-1')
            this.updateWaters(cameraManager, renderer, mainScene, mainCamera);
        else
        {
            for (let j = 0, m = renderRegister.length; j < m; ++j)
            {
                const pass = renderRegister[j];
                const sc = pass.scene;
                if (!sc) continue;
                const sceneId = pass.sceneId.toString();
                if (sceneId === '-1')
                {
                    let cm = pass.camera.cameraObject;
                    this.updateWaters(cameraManager, renderer, sc, cm);
                    break;
                }
            }
        }
    },

    updateWaters(cameraManager, renderer, mainScene, mainCam)
    {
        // Update uniforms
        let worlds = this.graphics.app.model.backend.chunkModel.worlds;
        let skies = this.graphics.app.model.backend.chunkModel.skies;
        // let eye = cameraManager.waterCamera.eye;
        let eye = cameraManager.mainCamera.getCameraPosition();
        // let instancedMaterials = this.graphics.instancedMaterials;
        let waterMaterials = this.graphics.waterMaterials;
        let darkWater = this.darkWater;

        worlds.forEach(w =>
        {
            // const materialsFoWorld = instancedMaterials.get(wid);
            // const materialForWater = materialsFoWorld[1];

            // let sky = skies.get(wid);
            // let sdir = this.graphics.getSunDirection(sky);
            w.forEach(chunk => { let m = chunk.meshes; for (let i = 0; i < m.length; ++i) {
                if (!chunk.water[i]) continue;
                let mi = m[i];
                mi.visible = false;
                if (mi.material)
                {
                    // mi.material = materialForWater;
                    mi.material = darkWater;
                }
                // if (mi.material && mi.material.uniforms && mi.material.uniforms.time)
                // {
                //     mi.material.uniforms.eye.value = eye;
                //     mi.material.uniforms.sunDirection.value = sdir;
                //     mi.material.uniforms.time.value += 0.01;
                // }
            }});
        });

        // Update main camera
        this.updateWaterCamera(cameraManager, renderer, mainScene, mainCam);

        // Update display
        worlds.forEach((w, wid) =>
        {
            let sky = skies.get(wid);
            let sdir = this.graphics.getSunDirection(sky);

            const materialForWater = waterMaterials.get(wid);
            if (!materialForWater)
            {
                // console.error('[Renderer/Updates] Material not found.');
                // Possibly has no water -> it’s not an error
            }

            w.forEach(chunk => { let m = chunk.meshes; for (let i = 0; i < m.length; ++i) {
                if (!chunk.water[i]) continue;
                let mi = m[i];
                mi.visible = true;
                if (mi.material)
                {
                    mi.material = materialForWater;
                }
            }});

            if (materialForWater && materialForWater.uniforms && materialForWater.uniforms.eye)
            {
                materialForWater.uniforms.eye.value.copy(eye);
                materialForWater.uniforms.sunDirection.value = sdir;
                materialForWater.uniforms.time.value += 0.01;
            }
        });
    },

    updateWaterCamera(cameraManager, renderer, mainScene, mainCamera)
    {
        // Update mirror camera
        cameraManager.updateWaterCamera(mainCamera);

        if (this.shortCircuitWaterReflection)
            return;

        // Perform render
        let scene = mainScene;
        let waterCamera = cameraManager.waterCamera;
        let renderTarget = waterCamera.waterRenderTarget;
        let mirrorCamera = cameraManager.waterCamera.camera;

        // Save
        let currentRenderTarget = renderer.getRenderTarget();
        let currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
        // let currentXrEnabled = renderer.xr.enabled;
        // scope.visible = false; // single side, no need
        // renderer.xr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        renderer.setRenderTarget(renderTarget);
        if (renderer.autoClear === false) renderer.clear();
        renderer.render(scene, mirrorCamera);

        // Restore
        // scope.visible = true; // single side, no need
        // renderer.xr.enabled = currentXrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
        renderer.setRenderTarget(currentRenderTarget);
        // let viewport = camera.viewport;
        // if (viewport !== undefined) {
        //     renderer.state.viewport(viewport);
        // }
    },

    updateShadows() // cameraManager)
    {
        let graphics = this.graphics;
        let worlds = graphics.app.model.backend.chunkModel.worlds;
        let skies = graphics.app.model.backend.chunkModel.skies;
        let eye = graphics.cameraManager.waterCamera.eye;
        // let eye = graphics.cameraManager.getCameraCoordinates();
        // let eyedir = cameraManager.mainCamera.getCameraForwardVector();
        worlds.forEach((w, wid) => {
            let sky = skies.get(wid);
            let sdir = graphics.getSunDirection(sky);
            sdir.set(-sdir.x, sdir.y, sdir.z).negate();
            w.forEach(chunk => {
                if (!chunk.shadow) return;
                let mi = chunk.shadow;
                if (mi.material && mi.material.uniforms)
                {
                    mi.material.uniforms.lightPosition.value = sdir;
                    mi.material.uniforms.eyePosition.value = eye;
                }
            });
        });
    }

};

export { RendererUpdates };
