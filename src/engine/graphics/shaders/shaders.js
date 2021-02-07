/**
 *
 */

'use strict';

// Portals
import PortalFragment       from './portal/portal.fragment.glsl';
import PortalVertex         from './portal/portal.vertex.glsl';

// Effects
import SwordTrailVertex         from './sword/trail.vertex.glsl';
import SwordTrailFragment       from './sword/trail.fragment.glsl';

// Sky
import SkyFlatFragment      from './sky/skyFlat.fragment.glsl';
import SkyFlatVertex        from './sky/skyFlat.vertex.glsl';

// Water
import WaterFragment        from './water/water.fragment.glsl';
import WaterVertex          from './water/water.vertex.glsl';
import OceanFragment        from './water/ocean.fragment.glsl';
import OceanVertex          from './water/ocean.vertex.glsl';

// Post-proc
import BloomSelectiveFragment   from './postprocessing/bloom.selective.fragment.glsl';
import BloomSelectiveVertex     from './postprocessing/bloom.selective.vertex.glsl';

import ShadowVertex             from './shadow/shadow.vertex.glsl';
import ShadowFragment           from './shadow/shadow.fragment.glsl';

// Scene transitions
import CrossFadeVertex          from './crossfade/crossfade.vertex.glsl';
import CrossFadeFragment        from './crossfade/crossfade.fragment.glsl';

let ShadersModule = {

    // Scene crossfade
    getCrossFadeVertex()
    {
        return CrossFadeVertex;
    },

    getCrossFadeFragment()
    {
        return CrossFadeFragment;
    },

    // Portal
    getPortalVertexShader()
    {
        return PortalVertex;
    },

    getPortalFragmentShader()
    {
        return PortalFragment;
    },

    // Melee
    getSwordTrailVertexShader()
    {
        return SwordTrailVertex;
    },

    getSwordTrailFragmentShader()
    {
        return SwordTrailFragment;
    },

    // Sky
    getSkyFlatVertexShader()
    {
        return SkyFlatVertex;
    },

    getSkyFlatFragmentShader()
    {
        return SkyFlatFragment;
    },

    // Water
    getWaterFragmentShader()
    {
        return `
            #include <common>
            ${WaterFragment}
        `;
    },

    getWaterVertexShader()
    {
        return `
            #include <common>
            ${WaterVertex}
        `;
    },

    getOceanFragmentShader()
    {
        return `
            #include <common>
            ${OceanFragment}
        `;
    },

    getOceanVertexShader()
    {
        return `
            #include <common>
            ${OceanVertex}
        `;
    },

    // Post-proc
    getBloomSelectiveVertexShader()
    {
        return BloomSelectiveVertex;
    },

    getBloomSelectiveFragmentShader()
    {
        return BloomSelectiveFragment;
    },

    getShadowVertexShader()
    {
        return `
            #include <common>
            ${ShadowVertex}
        `;
    },

    getShadowFragmentShader()
    {
        return `
            ${ShadowFragment}
        `;
    }

};

export { ShadersModule };
