/**
 * Core methods.
 */

'use strict';

// import * as Ammo from '../../libs/ammo.wasm';
// import '../../libs/ammo.wasm.wasm';

import { LoadingManager } from 'three';
import Stats              from 'three/examples/jsm/libs/stats.module';

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
        this.initializeAnimations();

        // Lazy loading: checks if everything is correctly loaded, every few frames.
        return new Promise(resolve => {
            setTimeout(() =>
                this.resolveIfLoaded(resolve), 500
            );
        });
    },

    initPhysics()
    {
        this.app.engine.physics.preload();
    },

    initLoadingManager()
    {
        this.loadingManager = new LoadingManager();
        this.loadingManager.onProgress =
            function(url, itemsLoaded, itemsTotal)
            {
                console.log(`[Graphics/Loader] Loading file ${url} (${itemsLoaded} of ${itemsTotal}).`);
            };
        this.loadingManager.onStart =
            function(url, itemsLoaded, itemsTotal)
            {
                console.log(`[Graphics/Loader] Started loading ${url} (${itemsLoaded} of ${itemsTotal}).`);
            };
        this.loadingManager.onLoad =
            function()
            {
                console.log('[Graphics/Loader] Loading complete!');
            };
        this.loadingManager.onError =
            function(url)
            {
                console.log(`[Graphics/Loader] There was an error loading ${url}.`);
            };
    },

    resolveIfLoaded(resolve)
    {
        if (this._nbTexturesLoaded === this._nbTexturesToLoad &&
            this._nbMeshesToLoad === this._nbMeshesLoadedOrError &&
            this.app.engine.physics.isLoaded)
        {
            console.log('[Graphics/Core] Everything loaded.');
            resolve();
        }
        else
            setTimeout(() => this.resolveIfLoaded(resolve), 500);
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
        this.animate();

        // Init stats.
        // Benches.
        let fpsElement = this.fps.dom;
        fpsElement.setAttribute('id', 'stats');
        fpsElement.style.left = '300px';
        if (!document.getElementById('stats'))
            document.body.appendChild(fpsElement);
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

        // Request animation frame.
        this.requestId = requestAnimationFrame(this.animate.bind(this));

        // Emulate lower framerate
        this.now = Date.now();
        this.elapsed = this.now - (this.then || 0);
        const fps = 60;
        const fpsInterval = 1000 / fps;
        if (this.elapsed > fpsInterval)
        {
            this.then = this.now - (this.elapsed % fpsInterval);
        } else return;

        this.fps.update();

        // Ping AI
        aiEngine.refresh();

        // Force standalone update at animanionframe
        physicsEngine.refresh();

        // Bench.
        // this.fps.update();

        // Update controls for Touch/Gamepad devices.
        controlsEngine.updateControlsDevice();

        // Render.
        serverModel.refresh();
        this.render();
        clientModel.refresh();
    },

    render()
    {
        let sceneManager = this.sceneManager;
        let cameraManager = this.cameraManager;
        let rendererManager = this.rendererManager;
        let portals = this.app.model.backend.xModel.portals;

        // Refresh portals.
        this.processPortalUpdates();

        // Refresh camera mouse movements.
        cameraManager.refresh();

        // Perform rendering.
        rendererManager.render(sceneManager, cameraManager, portals);
    },

    // Old method to ping bundled server.
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
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }
    },

    cleanupFullGraphics()
    {
        this.sceneManager.cleanup();
        this.cameraManager.cleanup();
        this.rendererManager.cleanup();
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
        this.cameraManager.mainCamera.setThirdPerson();
        this.addToScene(this.cameraManager.mainCamera.get3DObject(), worldId);
        this.addToScene(this.cameraManager.mainRaycasterCamera.get3DObject(), worldId);
        // this.addToScene(this.cameraManager.waterCameraHelper, worldId);
    },

    /**
     * @deprecated
     */
    getCameraInteraction()
    {
        return this.app.model.frontend.getCameraInteraction();
    }
};

export { CoreModule };
