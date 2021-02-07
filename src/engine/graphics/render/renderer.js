/**
 * Renderer, render layers management.
 */

'use strict';

import extend                      from '../../../extend.js';
import {
    DoubleSide,
    MeshBasicMaterial,
    Scene, PlaneBufferGeometry, Mesh, WebGLRenderTarget, LinearFilter, RGBFormat,
    PerspectiveCamera, OrthographicCamera, ShaderMaterial,
} from 'three';
import { ShaderPass }              from 'three/examples/jsm/postprocessing/ShaderPass';
import { RendererFactory }         from './renderer.factory';
import { RendererUpdates }         from './renderer.updates';
import { LightDefaultIntensities } from '../light';
import { RendererPortals }         from './renderer.portals';

let RendererManager = function(graphicsEngine)
{
    this.graphics = graphicsEngine;

    // Graphical settings
    this.selectiveBloom = true;
    this.waterReflection = true;

    // To disable water reflection, but not the moving water texture
    this.shortCircuitWaterReflection = false;

    // Shadows:
    // - not compatible with portals
    // - only for blocks
    // - shadow map =
    //          soft shadows, capped distance, flickering at the edges
    //          ~=CPU load
    //          ++GPU load (adding a render pass + depends on tex resolution).
    // - shadow volumes =
    //          crisp shadows, stable and high-fidelity
    //          not yet working with non-manifold edges
    //          ++CPU load at chunk create/update.
    //          +++GPU load (adding render passes + fill time).
    this.shadowVolumes = false;
    this.shadowMap = true;
    this.highResolutionShadowMap = false;
    if (this.shadowVolumes && this.shadowMap)
    {
        console.error('[Renderer] Cannot use both shadow map and shadow volume.');
        this.shadowVolumes = false;
    }

    // ISSUES
    // Performance issue with Firefox + three (water reflection)
    // const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    // if (isFirefox)
    //     this.shortCircuitWaterReflection = true;
    // Bloom + light intensity issue on mobile
    const isMobile = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0;
    if (isMobile)
    {
        this.selectiveBloom = false;
        LightDefaultIntensities.HEMISPHERE *= 4;
        LightDefaultIntensities.DIRECTIONAL *= 4;
        LightDefaultIntensities.AMBIENT *= 4;
    }
    // \ISSUES

    // No support for AO atm.
    this.ambientOcclusion = false;

    // Main renderer.
    this.renderer = this.createRenderer();
    this.renderer.autoClear = false;
    this.composers = new Map();

    // Scene transitions.
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.mainSceneRenderTarget = new WebGLRenderTarget(width, height, {
        minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat
    });
    this.transitionSceneRenderTarget = new WebGLRenderTarget(width, height, {
        minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat
    });
    this.isTransitioning = true;
    this.transitionScene = new Scene();
    this.transitionCamera = new PerspectiveCamera();
    this.sceneCrossFade = new Scene();
    this.cameraCrossFade = new OrthographicCamera(
        width / -2, width / 2, height / 2, height / -2,
        -10, 10
    );
    this.materialCrossFade = new ShaderMaterial({
        uniforms: {
            tDiffuse1: { value: null },
            tDiffuse2: { value: null },
            mixRatio: { value: 0.0 }
        },
        vertexShader: this.graphics.getCrossFadeVertex(),
        fragmentShader: this.graphics.getCrossFadeFragment(),
    });
    this.geometryCrossFade = new PlaneBufferGeometry(width, height);
    this.quadCrossFade = new Mesh(this.geometryCrossFade, this.materialCrossFade);
    this.sceneCrossFade.add(this.quadCrossFade);
    this.materialCrossFade.uniforms.tDiffuse1.value = this.transitionSceneRenderTarget.texture;
    this.materialCrossFade.uniforms.tDiffuse2.value = this.mainSceneRenderTarget.texture;

    // Lightweight screen, camera and scene manager for portals.
    this.renderRegister = [];
    this.stencilScene = new Scene();
    this.stencilScreen = new Mesh(
        new PlaneBufferGeometry(1, 2),
        new MeshBasicMaterial({ color: 0xaaaaaa, side: DoubleSide, transparent: false })
    );
    this.stencilScene.add(this.stencilScreen);
    this.corrupted = 0;
    this.stop = false;
    // Cap number of passes.
    this.renderMax = 10;

    // Bloom
    this.darkMaterial = new MeshBasicMaterial(
        { color: 'black', side: DoubleSide, morphTargets: true }
    );
    this.darkWater = new MeshBasicMaterial(
        { color: 'black', side: DoubleSide, morphTargets: true }
    );

    // Advanced shadows
    if (this.shadowVolumes)
        this.sceneShadows = new Scene();
};

extend(RendererManager.prototype, {

    addToShadows(mesh)
    {
        this.sceneShadows.add(mesh);
    },

    removeFromShadows(mesh)
    {
        this.sceneShadows.remove(mesh);
    },

    cssToHex(cssColor)
    {
        return 0 | cssColor.replace('#', '0x');
    },

    getRenderRegister()
    {
        return this.renderRegister;
    },

    setRenderRegister(renderRegister)
    {
        this.renderRegister = renderRegister;
    },

    render(sceneManager, cameraManager)
    {
        if (this.stop) return;
        let renderer = this.renderer;
        let renderRegister = this.renderRegister;
        let mainScene = sceneManager.mainScene;
        let mainCamera = cameraManager.mainCamera.getRecorder();

        // Material instancing.
        let materials = {};

        // Update main camera.
        mainCamera.updateProjectionMatrix();
        mainCamera.updateMatrixWorld();
        mainCamera.matrixWorldInverse.copy(mainCamera.matrixWorld).invert();
        mainScene.updateMatrixWorld();

        // Updates.
        try
        {
            this.updateSkies(mainCamera);

            if (this.waterReflection)
                this.updateWaterReflection(cameraManager, renderer, mainScene, mainCamera, renderRegister);

            if (this.shadowVolumes)
                this.updateShadows(cameraManager, renderer, mainScene, mainCamera);
        }
        catch (e)
        {
            console.error(e);
            this.stop = true;
            return;
        }

        const nbPortals = renderRegister.length;
        if (nbPortals > 0)
            this.renderPortals(renderer, cameraManager, sceneManager, materials, renderRegister);

        // Lazy composer creation.
        const id = this.graphics.app.model.backend.selfModel.worldId.toString();
        let composer;
        if (this.composers.has(id)) {
            composer = this.composers.get(id);
        } else {
            const skies = this.graphics.app.model.backend.chunkModel.skies;
            const s = skies.get(id);
            if (s && s.lights)
            {
                composer = this.createMainComposer(renderer, mainScene, mainCamera, s.lights);
                this.composers.set(id, composer);
            }
            else return;
        }

        // MAIN RENDER
        if (this.selectiveBloom)
        {
            mainScene.traverse(obj => this.darkenNonBloomed(obj, materials));
            const bloomComposer = composer[0];
            bloomComposer.render();
            mainScene.traverse(obj => this.restoreMaterial(obj, materials));
            const bloomMergeFXAAComposer = composer[1];
            if (this.isTransitioning)
            {
                // update transition
                const mixRatio = this.materialCrossFade.uniforms.mixRatio;
                mixRatio.value += 0.01; mixRatio.value %= 1;
                // render to bloom merge writeBuffer
                bloomMergeFXAAComposer.renderToScreen = false;
                bloomMergeFXAAComposer.writeBuffer = this.mainSceneRenderTarget;
                bloomMergeFXAAComposer.render();
                // render transition scene
                renderer.setRenderTarget(this.transitionSceneRenderTarget);
                renderer.render(this.transitionScene, this.transitionCamera);
                renderer.setRenderTarget(null);
                renderer.clear();
                renderer.render(this.sceneCrossFade, this.cameraCrossFade);
            }
            else
            {
                bloomMergeFXAAComposer.renderToScreen = true;
                bloomMergeFXAAComposer.render();
            }
        }
        else
        {
            const defaultComposer = composer[2];
            defaultComposer.render();
        }

        // Compute draw calls
        // console.log(renderer.info.render.calls);
        renderer.info.reset();
    },

    resize(width, height)
    {
        if (!width) width = window.innerWidth;
        if (!height) height = window.innerHeight;

        // Main renderer
        this.renderer.setSize(width, height);

        // Scene transition
        this.mainSceneRenderTarget.setSize(width, height);
        this.transitionSceneRenderTarget.setSize(width, height);

        // All composers
        this.composers.forEach(cs => {
            for (let i = 0; i < cs.length; ++i) {
                let c = cs[i];
                c.setSize(width, height);
                let pixelRatio = this.renderer.getPixelRatio();
                let r = 'resolution';
                let passes = c.passes;
                passes.forEach(p => {
                    if (!p || !(p instanceof ShaderPass)) return;
                    if (!p.material || !p.material.uniforms) return;
                    if (!p.material.uniforms[r]) return;
                    p.material.uniforms[r].value.x = 1 / (width * pixelRatio);
                    p.material.uniforms[r].value.y = 1 / (height * pixelRatio);
                });
            }
        });
    },

    // Triggered at the start of a switch-to-world.
    switchAvatarToScene(/*sceneId*/)
    {
        // console.log('Mesh switch');
        // this.renderRegister;
    },

    cleanup()
    {
        this.composers.forEach(function() {
            // XXX [UNLOAD] composer cleanup
        });
        this.composers = new Map();
        this.renderRegister.length = 0;
        this.renderer.renderLists.dispose();
    }

});

extend(RendererManager.prototype, RendererFactory);
extend(RendererManager.prototype, RendererUpdates);
extend(RendererManager.prototype, RendererPortals);

/** Interface with graphics engine. **/

let RenderersModule = {

    hasShadowMap()
    {
        return this.rendererManager.shadowMap;
    },

    hasHighResShadows()
    {
        return this.rendererManager.highResolutionShadowMap;
    },

    hasShadowVolumes()
    {
        return this.rendererManager.shadowVolumes;
    }

};

export { RendererManager, RenderersModule };
