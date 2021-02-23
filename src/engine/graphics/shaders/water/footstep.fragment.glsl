
uniform float time;
varying vec3 vPosition;

uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
varying vec3 vNormal;
#endif

vec3 c1 = vec3(0.);
vec3 c2 = vec3(0., 0.1, 0.);
vec3 c3 = vec3(0.1, -0.01, 0.);
vec3 c4 = vec3(-0.02, 0.03, 0.);
vec3 c5 = vec3(-0.1, 0.02, 0.);

#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

float sumCircle(vec3 center, float maxCircleRadius, float fade)
{
    float currentCircleRadius = time * maxCircleRadius;
    float fragmentDistanceToCenter = distance(center, vPosition);
    float ifIAmSmallThenWhite = abs(currentCircleRadius - fragmentDistanceToCenter);
    float toNaught = .05 - clamp(ifIAmSmallThenWhite, 0., .05);
    float res = pow(20. * toNaught, 2.) * 0.25;
    return res * fade;
}

void main() {
    #include <clipping_planes_fragment>
    vec4 diffuseColor = vec4( diffuse, opacity );
    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    // accumulation (baked indirect lighting only)
    #ifdef USE_LIGHTMAP

    vec4 lightMapTexel= texture2D( lightMap, vUv2 );
    reflectedLight.indirectDiffuse += lightMapTexelToLinear( lightMapTexel ).rgb * lightMapIntensity;
    #else
    reflectedLight.indirectDiffuse += vec3( 1.0 );
    #endif
    // modulation
    #include <aomap_fragment>
    reflectedLight.indirectDiffuse *= diffuseColor.rgb;
    vec3 outgoingLight = reflectedLight.indirectDiffuse;
    #include <envmap_fragment>

    //    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    //    vec3 center = vec3(0.);
    float maxCircleRadius = 1.;
    float fadeFactor = 2. * clamp(time, 0., 0.5);
    float fade = 1. - fadeFactor;

    float sum = 0.;
    sum = max(sum, sumCircle(c1, maxCircleRadius, fade));
    sum = max(sum, sumCircle(c2, maxCircleRadius * 0.5, fade));
    sum = max(sum, sumCircle(c3, maxCircleRadius * 0.8, fade));
    sum = max(sum, sumCircle(c4, maxCircleRadius * 1., fade));
    sum = max(sum, sumCircle(c5, maxCircleRadius * 0.9, fade));
    // sum = max(sum, sumCircle(c1, maxCircleRadius * 0.5, fade));

    gl_FragColor = vec4( 1., 1., 1., sum);

    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>
}
