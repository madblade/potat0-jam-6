/**
 * Manages different composers (for different scenes),
 * stencil operators and render register (holds the order in which
 * portals should be rendered)
 */

'use strict';

let RendererPortals = {

    renderPortals(
        renderer,
        cameraManager, sceneManager,
        materials,
        renderRegister
    )
    {
        // Render every portal.
        let renderCount = 0;
        const renderMax = this.renderMax;

        let currentPass; let screen1; let screen2; let camera;
        let bufferScene; let bufferCamera; let bufferTexture;
        let otherEnd;
        // let otherSceneId;

        // This fixes the 1-frame lag for inner-most scenes.
        for (let j = 0, m = renderRegister.length; j < m; ++j)
        {
            currentPass = renderRegister[j];
            bufferScene = currentPass.scene;
            if (!bufferScene) continue;

            // Latencx fix for inner scenes.
            bufferScene.updateMatrixWorld();

            // Flickering fix for linking to the same scene.
            // bufferCamera = currentPass.camera.getRecorder();
            // bufferCamera.updateProjectionMatrix();
            // bufferCamera.updateMatrixWorld();
        }

        let stencilCamera = cameraManager.stencilCamera;
        this.stencilScene.updateMatrixWorld();
        this.graphics.cameraManager.moveCameraFromMouse(0, 0, 0, 0);

        let worlds = this.graphics.app.model.backend.chunkModel.worlds;
        let pathId;
        let sceneId;
        let instancedMaterials = this.graphics.instancedMaterials;
        let waterMaterials = this.graphics.waterMaterials;
        for (let i = 0, n = renderRegister.length; i < n; ++i)
        {
            if (renderCount++ > renderMax) break;
            currentPass = renderRegister[i];
            screen1 = currentPass.screen1;
            screen2 = currentPass.screen2;
            camera = currentPass.camera;
            sceneId = currentPass.sceneId.toString();
            pathId = currentPass.id;
            let defaultMaterials = instancedMaterials.get(sceneId);
            let defaultMaterial;
            let defaultWaterMaterial;
            if (!defaultMaterials) {
                // console.error('[Renderer] Default material not found!');
            } else {
                defaultMaterial = defaultMaterials[0];
                defaultWaterMaterial = waterMaterials.get(sceneId);
            }
            let passMaterial = instancedMaterials.get(pathId);
            let passWaterMaterial = waterMaterials.get(pathId);
            if (!passMaterial && defaultMaterial)
            {
                passMaterial = defaultMaterial.clone();
                instancedMaterials.set(pathId, passMaterial);
                if (defaultWaterMaterial)
                {
                    passWaterMaterial = defaultWaterMaterial.clone();
                    waterMaterials.set(pathId, passWaterMaterial);
                }
            }
            let chks = worlds.get(sceneId);
            if (!chks)
            {
                // console.log('No chunks there.');
            }

            bufferScene = currentPass.scene;
            if (!camera) continue;
            bufferCamera = camera.getRecorder();
            bufferTexture = screen1.getRenderTarget();

            if (!bufferScene)
            {
                if (this.corrupted < 5)
                {
                    // console.log(`[Renderer] Could not get buffer scene ${currentPass.sceneId}.`);
                    // Happens while loading other worlds.
                    this.corrupted++;
                }

                // Sometimes the x model would be initialized before the w model.
                if (currentPass.sceneId) { currentPass.scene = sceneManager.getScene(currentPass.sceneId); }
                continue;
            }
            if (!bufferCamera)  { console.log('Could not get buffer camera.'); continue; }
            if (!bufferTexture) { console.log('Could not get buffer texture.'); continue; }

            if (screen2)
            {
                otherEnd = screen2.getMesh();
                otherEnd.visible = false;
            }

            // Render scene into screen1
            const s1 = screen1.getMesh();
            let sts = this.stencilScreen;
            let t = camera.getCameraTransform();
            sts.position.copy(s1.position);
            sts.position.x += t[0];
            sts.position.y += t[1];
            sts.position.z += t[2];
            sts.rotation.copy(s1.rotation);
            sts.updateMatrixWorld();

            stencilCamera.matrixWorld.copy(bufferCamera.matrixWorld);

            let id = currentPass.id.toString();
            let bufferComposer;
            if (this.composers.has(id)) {
                bufferComposer = this.composers.get(id);
            } else {
                bufferComposer = this.createPortalComposer(
                    renderer, bufferScene, bufferCamera, bufferTexture, this.stencilScene, stencilCamera
                );
                this.composers.set(id, bufferComposer);
            }

            if (chks && defaultMaterial && passMaterial)
                chks.forEach(c => { let m = c.meshes; for (let cc = 0; cc < m.length; ++cc) {
                    let mi = m[cc];
                    if (!mi) continue;
                    if (c.water[cc])
                    {
                        // mi.material = passWaterMaterial;
                    }
                    else if (mi.material)
                    {
                        mi.material = passMaterial;
                    }
                }});
            s1.visible = false;
            if (this.selectiveBloom)
            {
                bufferScene.traverse(obj => this.darkenNonBloomed(obj, materials));
                bufferComposer[0].render();
                bufferScene.traverse(obj => this.restoreMaterial(obj, materials));
                bufferComposer[1].render();
            } else {
                bufferComposer[2].render();
            }
            s1.visible = true;
            if (chks && defaultMaterial && passMaterial)
                chks.forEach(c => { let m = c.meshes; for (let cc = 0; cc < m.length; ++cc) {
                    let mi = m[cc];
                    if (!mi) continue;
                    if (c.water[cc])
                    {
                        // mi.material = defaultWaterMaterial;
                    }
                    else if (mi.material)
                    {
                        mi.material = defaultMaterial;
                    }
                }});

            if (screen2) {
                // sceneManager.addObject(otherEnd, otherSceneId);
                otherEnd.visible = true;
            }
        }
    }

};

export { RendererPortals };
