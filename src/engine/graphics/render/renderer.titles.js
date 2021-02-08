import {
    LinearFilter,
    Mesh,
    OrthographicCamera,
    PlaneBufferGeometry,
    RGBFormat,
    Scene, ShaderMaterial, WebGLRenderTarget
} from 'three';

/**
 * Title scenes and cross-fade manager.
 */

let RendererTitles = {

    /**
     * @param toTitle whether it is from a playable scene (true)
     *              or from the titles scene (false).
     */
    startSceneTransition(toTitle)
    {
        this.isTransitioning = true;
        this.toTitle = toTitle;

        const mixRatio = this.materialCrossFade.uniforms.mixRatio;
        if (toTitle) mixRatio.value = 0.;
        else mixRatio.value = 1.;
    },

    endSceneTransition()
    {
        this.isTransitioning = false;
    },

    setTransitionDuration(duration)
    {
        this.transitionDuration = duration;
    },

    setupTitles()
    {
        this.isInTitleScene = true;
        this.isTransitioning = false;
        this.toTitle = false;
        this.transitionDuration = 1000; // seconds

        const width = window.innerWidth;
        const height = window.innerHeight;
        this.mainSceneRenderTarget = new WebGLRenderTarget(width, height, {
            minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat
        });
        this.transitionSceneRenderTarget = new WebGLRenderTarget(width, height, {
            minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat
        });
        this.titleScene = new Scene();
        this.titleCamera = new OrthographicCamera(1, 1, 1, 1);
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
    },

    setupTitlesAfterWindowResize(width, height)
    {
        this.mainSceneRenderTarget.setSize(width, height);
        this.transitionSceneRenderTarget.setSize(width, height);
    },

    updateTransition()
    {
        const duration = this.transitionDuration;
        const delta = this.graphics.app.engine.ux.getElapsed();
        const normalizedDelta = delta / duration;
        const mixRatio = this.materialCrossFade.uniforms.mixRatio;
        if (this.toTitle)
        {
            mixRatio.value += normalizedDelta;
            if (mixRatio.value >= 1)
            {
                this.endSceneTransition();
                mixRatio.value = 1.;
            }
        }
        else
        {
            mixRatio.value -= normalizedDelta;
            if (mixRatio.value <= 0.)
            {
                this.endSceneTransition();
                mixRatio.value = 0.;
            }
        }
    },

    renderCrossFadeScene(renderer, finalEffectComposer)
    {
        // update transition
        this.updateTransition();

        // render to (bloom merge / only composer) writeBuffer
        finalEffectComposer.renderToScreen = false;
        finalEffectComposer.writeBuffer = this.mainSceneRenderTarget;
        finalEffectComposer.render();

        // render transition scene
        renderer.setRenderTarget(this.transitionSceneRenderTarget);
        renderer.render(this.titleScene, this.titleCamera);
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(this.sceneCrossFade, this.cameraCrossFade);
    },

    renderTitleScene(renderer)
    {
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(this.titleScene, this.titleCamera);
    }

};

export { RendererTitles };
