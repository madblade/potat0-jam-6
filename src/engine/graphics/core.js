/**
 * Core methods.
 */

'use strict';

import Stats              from 'three/examples/jsm/libs/stats.module';
import { LoadingManager } from 'three';

let CoreModule = {

    preload()
    {
        // Using three’s loading manager.
        this.initLoadingManager();

        // Textures
        this.loadTextures();

        // Meshes
        this.loadReferenceMeshes();

        // Load physics
        this.initPhysics();

        // Animations
        this.animationManager.initializeAnimations();

        // Audio
        this.initAudio();

        // Lazy loading: checks if everything is correctly loaded, every few frames.
        return new Promise(resolve => {
            setTimeout(() =>
                this.resolveIfLoaded(resolve), 100
            );
        });
    },

    initPhysics()
    {
        this.app.engine.physics.preload();
    },

    initAudio()
    {
        this.app.engine.audio.preload(this.loadingManager);
    },

    initLoadingManager()
    {
        const loadingState = this.app.state.getState('loading');
        this.loadingManager = new LoadingManager();
        this.loadingManager.onProgress =
            (url, itemsLoaded, itemsTotal) =>
            {
                if (loadingState) loadingState.notifyProgress(url, itemsLoaded, itemsTotal);
                console.log(`[Graphics/Loader] Loading file ${url} (${itemsLoaded} of ${itemsTotal}).`);
            };
        this.loadingManager.onStart =
            (url, itemsLoaded, itemsTotal) =>
            {
                if (loadingState) loadingState.notifyProgress(url, itemsLoaded, itemsTotal);
                console.log(`[Graphics/Loader] Started loading ${url} (${itemsLoaded} of ${itemsTotal}).`);
            };
        this.loadingManager.onLoad =
            () =>
            {
                console.log('[Graphics/Loader] Loading complete!');
            };
        this.loadingManager.onError =
            url =>
            {
                if (loadingState) loadingState.notifyError(url);
                console.log(`[Graphics/Loader] There was an error loading ${url}.`);
            };
    },

    resolveIfLoaded(resolve)
    {
        if (this._nbTexturesLoaded === this._nbTexturesToLoad &&
            this._nbMeshesToLoad === this._nbMeshesLoadedOrError &&
            this.app.engine.physics.isLoaded && this.app.engine.audio.isDoneLoadingSounds()
        )
        {
            console.log('[Graphics/Core] Everything loaded.');
            resolve();
        }
        else
            setTimeout(() => this.resolveIfLoaded(resolve), 100);
    },

    run()
    {
        // Initialize DOM element
        this.initializeDOM();
        this.fps = this.fps || new Stats();

        // Controls are tightly linked to camera.
        this.initializeCameras();

        // Init animation.
        this.resize();
        // Cleanup previous animation requests.
        if (this.requestId)
            cancelAnimationFrame(this.requestId);
        this.animate();

        // Init stats.
        // Benches.
        // let fpsElement = this.fps.dom;
        // fpsElement.setAttribute('id', 'stats');
        // fpsElement.style.left = '300px';
        // if (!document.getElementById('stats'))
        //     document.body.appendChild(fpsElement);
    },

    initializeDOM()
    {
        this.container = document.getElementById('container');
        this.container.appendChild(this.rendererManager.renderer.domElement);
    },

    /** Main loop. **/

    animate()
    {
        let clientModel = this.app.model.frontend;
        let serverModel = this.app.model.backend;
        let controlsEngine = this.app.engine.controls;
        let physicsEngine = this.app.engine.physics;
        let aiEngine = this.app.engine.ai;
        let animationEngine = this.animationManager;
        let ux = this.app.engine.ux;

        // Request animation frame.
        this.requestId = requestAnimationFrame(this.animate.bind(this));

        // Ping UX.
        ux.refresh();
        const paused = ux.isGamePaused();
        if (paused)
        {
            // always refresh gamepads.
            controlsEngine.updateControlsDevice(0);
            return;
        }

        // Uncomment to emulate lower framerate
        this.now = Date.now();
        this.elapsed = this.now - (this.then || 0);
        const fps = 60;
        const fpsInterval = 1000 / fps;
        if (this.elapsed > fpsInterval)
        {
            this.then = this.now - (this.elapsed % fpsInterval);
        }
        else return;

        // Ping AI components / compute their inputs.
        // aiEngine holds
        //   - intelligent component
        aiEngine.refresh();

        // Update keyboard / mouse  inputs.
        // (all inputs except from camera)
        clientModel.refresh();

        // Ping physics engines.
        // madEngine/sweeper holds
        //   - out-of-date entities that can interact w/ one another
        //   - projectiles that cannot interact w/ one another
        // bulletEngine holds all cosmetic entities mapped by name
        const deltaT = physicsEngine.refresh();

        // Update model.
        // serverModel holds
        //   - all entities/chunks
        //   - out-of-date entities/chunks (input by physics)
        // Note: might want to manage chunk loading here
        serverModel.refresh();

        // Update inputs for Touch/Gamepad devices.
        // Note: camera cannot rotate bw/ this call and render.
        controlsEngine.updateControlsDevice(deltaT);
        // controlsEngine.stamp();

        // Update camera state from direct user inputs.
        this.refreshMainCamera(deltaT);

        // Update animation mixers.
        // animationEngine holds
        //   - list of mixers for skinned/morphed entities
        //   - list of labelled entities
        // Note: can modify zBounce bw/ model update and render.
        // Note: also manages animated feedback (e.g. camera shake).
        animationEngine.refresh(deltaT);

        // Render.
        this.render(deltaT);

        // Restore feedback / perturbation effects.
        animationEngine.restore();

        // Bench.
        this.fps.update();
    },

    refreshMainCamera(deltaT)
    {
        // (Late) Refresh portal graphics.
        this.processPortalUpdates();

        // Refresh camera mouse movements.
        let cameraManager = this.cameraManager;
        cameraManager.refresh(deltaT);
    },

    render(deltaT)
    {
        let sceneManager = this.sceneManager;
        let cameraManager = this.cameraManager;
        let rendererManager = this.rendererManager;

        // Perform rendering.
        rendererManager.render(
            sceneManager, cameraManager, deltaT
        );
    },

    // Old method to ping bundled server.
    /** @deprecated */
    pingStandalone()
    {
        let standalone = this.app.standalone;
        if (!standalone) return;
        let server = standalone.server;
        if (!server) return;
        if (!standalone.isRunning()) return;
        this.now = Date.now();
        this.elapsed = this.now - (this.then || 0);
        const fpsInterval = 16; // 16ms -> 60fps physics (20fps network entity update)
        if (this.elapsed > fpsInterval)
        {
            this.then = this.now - (this.elapsed % fpsInterval);
            server._updateGameLoops();
        }
    },

    stop()
    {
        // if (this.requestId) {
        //     cancelAnimationFrame(this.requestId);
        // }
    },

    cleanupFullGraphics()
    {
        this.sceneManager.cleanup();
        this.cameraManager.cleanup();
        this.rendererManager.cleanup();
        this.animationManager.cleanup();
    },

    resize()
    {
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Update aspects.
        this.cameraManager.resize(width, height);

        // Update main renderer.
        this.rendererManager.resize(width, height);

        // Resize render targets.
        this.sceneManager.resize(width, height);
    },

    initializeCameras()
    {
        let selfModel = this.app.model.backend.selfModel;
        let worldId = selfModel.worldId;
        const mainCamera = this.cameraManager.mainCamera;
        mainCamera.setThirdPerson();
        this.animationManager.currentCameraPosition.copy(mainCamera.getCameraPosition());
        this.addToScene(mainCamera.get3DObject(), worldId);
        this.addToScene(this.cameraManager.mainRaycasterCamera.get3DObject(), worldId);
        // this.addToScene(this.cameraManager.waterCameraHelper, worldId);
    },

    /** @deprecated */
    getCameraInteraction()
    {
        return this.app.model.frontend.getCameraInteraction();
    }
};

export { CoreModule };
