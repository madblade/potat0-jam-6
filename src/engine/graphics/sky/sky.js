/**
 * Sky object.
 */

'use strict';

import { ShadersModule }  from '../shaders/shaders';
import {
    UniformsUtils, DoubleSide,
    BoxBufferGeometry, Mesh, ShaderMaterial, Vector3
} from 'three';

// turbidity, 1.0, 20.0, 0.1
// rayleigh, 0.0, 4, 0.001
// mieCoefficient, 0.0, 0.1, 0.001
// mieDirectionalG, 0.0, 1, 0.001
// inclination, 0, 1, 0.0001
// azimuth, 0, 1, 0.0001

let SkyFlat = function()
{
    let shader = {
        uniforms: {
            turbidity: { value: 10 },
            rayleigh: { value: 3 },
            mieCoefficient: { value: 0.005 },
            mieDirectionalG: { value: 0.7 },
            sunPosition: { value: new Vector3() },
            cameraPos: { value: new Vector3() }
        },
        vertexShader: ShadersModule.getSkyFlatVertexShader(),
        fragmentShader: ShadersModule.getSkyFlatFragmentShader()
    };

    let material = new ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: UniformsUtils.clone(shader.uniforms),
        side: DoubleSide
    });

    let geometry = new BoxBufferGeometry(1, 1, 1);

    Mesh.call(this, geometry,
        material
    );
};

SkyFlat.prototype = Object.create(Mesh.prototype);

export { SkyFlat };
