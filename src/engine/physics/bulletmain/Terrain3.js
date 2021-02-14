/**
 * Legacy Terrain.
 */

'use strict';

import extend, { inherit }  from '../../../extend';

import { Geometry }         from 'three/examples/jsm/deprecated/Geometry';
import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshLambertMaterial,
    MeshPhongMaterial,
    PlaneBufferGeometry,
    PlaneGeometry,
    Vector2,
    Vector3,
}                           from 'three';

let Terrain3 = function(a)
{
    a = void 0 === a ? {} : a;
    this.ttype = a.terrainType || 'terrain';
    this.needsUpdate = !1;
    this.callback = null;
    this.physicsUpdate = function()
    {
    }
    ;
    this.uvx = [a.uv || 18, a.uv || 18];
    this.sample = void 0 === a.sample ? [64, 64] : a.sample;
    this.size = void 0 === a.size ? [100, 10, 100] : a.size;
    this.data = {
        level: a.level || [1, .2, .05],
        frequency: a.frequency || [.016, .05, .2],
        expo: a.expo || 1
    };
    this.isBorder = !1;
    this.wantBorder = a.border || !1;
    this.isBottom = !1;
    this.wantBottom = a.bottom || !1;
    this.colorBase = {
        r: 1,
        g: .7,
        b: 0
    };
    this.maxspeed = a.maxSpeed || .1;
    this.acc = void 0 === a.acc ? .01 : a.acc;
    this.dec = void 0 === a.dec ? .01 : a.dec;
    this.deep = void 0 === a.deep ? 0 : a.deep;
    this.ease = new Vector2();
    this.complexity = void 0 === a.complexity ? 30 : a.complexity;
    this.complexity2 = void 0 === a.complexity2 ? null : a.complexity2;
    this.local = new Vector3();
    a.local && this.local.fromArray(a.local);
    this.pp = new Vector3();
    this.lng = this.sample[0] * this.sample[1];
    var c = this.sample[1] - 1;
    this.rx = (this.sample[0] - 1) / this.size[0];
    this.rz = c / this.size[2];
    this.ratio = 1 / this.sample[0];
    this.ruvx = 1 / (this.size[0] / this.uvx[0]);
    this.ruvy = -(1 / (this.size[2] / this.uvx[1]));
    this.is64 = a.is64;
    this.heightData = this.is64 || !1 ? new Float64Array(this.lng) : new Float32Array(this.lng);
    this.height = [];
    this.isAbsolute = a.isAbsolute || !1;
    (this.isReverse = a.isReverse || !1) && this.getReverseID();
    this.colors = new Float32Array(3 * this.lng);
    this.geometry = new PlaneBufferGeometry(this.size[0], this.size[2], this.sample[0] - 1, this.sample[1] - 1);
    this.geometry.rotateX(-Math.PI / 2);
    this.geometry.computeBoundingSphere();
    this.geometry.setAttribute('color', new BufferAttribute(this.colors, 3));
    this.vertices = this.geometry.attributes.position.array;
    c = {
        name: 'terrain',
        vertexColors: true,
        metalness: .2,
        roughness: .6,
        normalScale: a.normalScale || [2, 2],
        transparent: !1,
        opacity:  1,
        premultipliedAlpha: 0
    };
    this.maps = a.maps || 'sand grass rock sand_n grass_n rock_n'.split(' ');
    let d = {};
    c.map = d[this.maps[0]];
    c.normalMap = d[`${this.maps[0]}_n`];
    this.isDIS = this.isORM = !1;
    this.maps.length > 6 && (
        this.isORM = !0,
        c.aoMapIntensity = a.ao || 1,
        c.metalness = 1,
        c.roughness = 1,
        c.roughnessMap = d[`${this.maps[0]}_orm`],
        c.aoMap = d[`${this.maps[0]}_orm`]
    );
    this.maps.length > 9 && (
        this.isDIS = !0,
        c.displacementBias = 0,
        c.displacementScale = a.displacementScale || 1,
        c.displacementMap = d[`${this.maps[0]}_d`]
    );
    let h = this;
    c.extraCompile = function(b)
    {
        let g = b.uniforms;
        g.map1 = {
            value: d[h.maps[1]]
        };
        g.map2 = {
            value: d[h.maps[2]]
        };
        g.normalMap1 = {
            value: d[`${h.maps[1]}_n`]
        };
        g.normalMap2 = {
            value: d[`${h.maps[2]}_n`]
        };
        h.isORM && (g.roughnessMap1 = {
            value: d[`${h.maps[1]}_orm`]
        },
        c.roughnessMap2 = {
            value: d[`${h.maps[2]}_orm`]
        });
        h.isDIS && (g.displacementMap1 = {
            value: d[`${h.maps[1]}_d`]
        },
        g.displacementMap2 = {
            value: d[`${h.maps[2]}_d`]
        });
        b.uniforms = g;
        g = b.vertexShader;
        let e = b.fragmentShader;
        let f = TerrainShader;
        e = e.replace('#include <map_pars_fragment>', f.map_pars);
        e = e.replace('#include <normalmap_pars_fragment>', f.normal_pars);
        e = e.replace('#include <map_fragment>', f.map);
        e = e.replace('#include <normal_fragment_maps>', f.normal);
        e = e.replace('#include <color_fragment>', '');
        h.isORM && (
            e = e.replace('#include <roughnessmap_pars_fragment>', f.rough_pars),
            e = e.replace('#include <metalnessmap_pars_fragment>', ''),
            e = e.replace('#include <aomap_pars_fragment>', ''),
            e = e.replace('#include <roughnessmap_fragment>', f.rough),
            e = e.replace('#include <metalnessmap_fragment>', ''),
            e = e.replace('#include <aomap_fragment>', f.ao)
        );
        h.isDIS && (g = g.replace('#include <displacementmap_pars_vertex>', f.displacement_part),
        g = g.replace('#include <displacementmap_vertex>', f.displacement));
        b.fragmentShader = b;
        b.vertexShader = g;
        return b;
    };

    this.material = new MeshLambertMaterial({color: 0x00ff00});
    Mesh.call(this, this.geometry, this.material);
    this.wantBorder && this.addBorder(a);
    this.wantBottom && this.addBottom(a);
    this.update();
    this.name = void 0 === a.name ? 'terrain' : a.name;
    a.pos && this.position.fromArray(a.pos);
    this.castShadow = !1;
    this.receiveShadow = !0;
};

inherit(Terrain3, Mesh);

extend(Terrain3.prototype, {

    constructor: Terrain3,

    addBottom(a)
    {
        a = new PlaneBufferGeometry(this.size[0], this.size[2], 1, 1);
        a.rotateX(Math.PI / 2);
        this.bottomMesh = new Mesh(a, this.material);
        this.add(this.bottomMesh);
        this.isBottom = !0;
    },

    addBorder(a)
    {
        this.borderMaterial = new MeshPhongMaterial({
            vertexColors: true,
            metalness: .4,
            roughness: .6,
            normalScale: [-1, -1],
            transparent: !1,
            opacity: 1
        });
        a = new PlaneGeometry(this.size[0], 2, this.sample[0] - 1, 1);
        let c = new PlaneGeometry(this.size[0], 2, this.sample[0] - 1, 1);
        let d = new PlaneGeometry(this.size[2], 2, this.sample[1] - 1, 1);
        let e = new PlaneGeometry(this.size[2], 2, this.sample[1] - 1, 1);
        a.translate(0, 1, .5 * this.size[2]);
        c.rotateY(-Math.PI);
        c.translate(0, 1, .5 * -this.size[2]);
        d.rotateY(-Math.PI / 2);
        d.translate(.5 * -this.size[0], 1, 0);
        e.rotateY(Math.PI / 2);
        e.translate(.5 * this.size[0], 1, 0);
        var f = new Geometry();
        f.merge(a);
        f.merge(c);
        f.merge(d);
        f.merge(e);
        f.mergeVertices();
        this.borderGeometry = new BufferGeometry().fromGeometry(f);
        this.borderVertices = this.borderGeometry.attributes.position.array;
        this.lng2 = this.borderVertices.length / 3;
        this.list = Array(this.lng2);
        this.borderColors = new Float32Array(3 * this.lng);
        this.borderGeometry.setAttribute('color', new BufferAttribute(this.borderColors, 3));
        this.borderMesh = new Mesh(this.borderGeometry, this.borderMaterial);
        for (a = this.lng2; a--;)
            // eslint-disable-next-line no-sequences
            c = 3 * a,
            c = this.borderVertices[c + 1] > 0 ? this.findPoint(this.borderVertices[c], this.borderVertices[c + 2]) : -1,
            this.list[a] = c;
        this.add(this.borderMesh);
        this.isBorder = !0;
    },
    dispose()
    {
        this.geometry.dispose();
        this.material.dispose();
    },
    getHeight(a, c)
    {
        a *= this.rx;
        c *= this.rz;
        a += .5 * this.sample[0];
        c += .5 * this.sample[1];
        a = Math.floor(a);
        c = Math.floor(c);
        return (this.height[this.findId(a, c)] || 1) * this.size[1] + this.position.y;
    },
    findId(a, c)
    {
        return a + c * this.sample[1];
    },
    findPoint(a, c)
    {
        for (var d = this.lng, e; d--;)
            if (
                // eslint-disable-next-line no-sequences
                e = 3 * d,
                this.vertices[e] === a && this.vertices[e + 2] === c
            )
                return d;
        return -1;
    },
    getReverseID()
    {
        this.invId = [];
        for (var a = this.lng, c, d, e = this.sample[1] - 1; a--;)
            // eslint-disable-next-line no-sequences
            c = a % this.sample[0],
            d = Math.floor(a * this.ratio),
            d = e - d,
            this.invId[a] = this.findId(c, d);
    },
    update(a)
    {
        this.material.map.offset.x = this.local.x * this.ruvx;
        this.material.map.offset.y = this.local.z * this.ruvy;
        for (var c = this.pp, d, e = this.lng, f, h, m, k, n; e--;)
            // eslint-disable-next-line no-sequences
            f = 3 * e,
            h = e % this.sample[0],
            m = Math.floor(e * this.ratio),
            c.set(h + this.local.x * this.rx, this.local.y, m + this.local.z * this.rz),
            d = Math.noise(c, this.data),
            d = Math.pow(d, this.data.expo),
            d = d > 1 ? 1 : d,
            d = d < 0 ? 0 : d,
            this.ttype === 'road' && (k === m ? d = h === 1 || h === 2 || h === 29 || h === 30 ? n + .1 : n : (k = m,
            n = d)),
            this.height[e] = d,
            h = this.isReverse ? this.invId[e] : e,
            m = this.isAbsolute ? d : d * this.size[1],
            this.heightData[h] = m,
            h = d * this.size[1] + this.deep,
            this.vertices[f + 1] = h,
            d = [d, 0, 0],
            this.colors[f] = d[0],
            this.colors[f + 1] = d[1],
            this.colors[f + 2] = d[2];
        if (this.isBorder)
            for (c = this.lng2; c--;)
                // eslint-disable-next-line no-sequences
                f = 3 * c,
                this.list[c] !== -1 ? (e = this.height[this.list[c]],
                this.borderVertices[f + 1] = e * this.size[1] + this.deep,
                this.borderColors[f] = e * this.colorBase.r,
                this.borderColors[f + 1] = e * this.colorBase.g,
                this.borderColors[f + 2] = e * this.colorBase.b) : (this.borderColors[f] = this.colorBase.r,
                this.borderColors[f + 1] = this.colorBase.g,
                this.borderColors[f + 2] = this.colorBase.b);
        this.physicsUpdate(this.name, this.heightData);
        this.needsUpdate = !0;
        void 0 === a && this.updateGeometry();
    },
    updateGeometry()
    {
        this.geometry.attributes.position.needsUpdate = !0;
        this.geometry.attributes.color.needsUpdate = !0;
        this.geometry.computeVertexNormals();
        this.isBorder && (this.borderGeometry.attributes.position.needsUpdate = !0,
        this.borderGeometry.attributes.color.needsUpdate = !0);
    }
});

let TerrainShader = {
    rough_pars: '#ifdef USE_ROUGHNESSMAP\n    uniform sampler2D roughnessMap;\n    uniform sampler2D roughnessMap1;\n    uniform sampler2D roughnessMap2;\n    uniform float aoMapIntensity;\n#endif',
    rough: 'float roughnessFactor = roughness;\nfloat metalnessFactor = metalness;\n#ifdef USE_ROUGHNESSMAP\nfloat slopeR = vColor.r;\nvec4 baseColorR = vec4(0.0);\nvec4 sandR = texture2D( roughnessMap, vUv );\nvec4 grassR = texture2D( roughnessMap1, vUv );\nvec4 rockR = texture2D( roughnessMap2, vUv );\nif (slopeR < .5) baseColorR = grassR;\nif (slopeR > .8) baseColorR = rockR;\nif ((slopeR<.8) && (slopeR >= .5)) baseColorR = mix( grassR , rockR, (slopeR - .5) * (1. / (.8 - .5)));\nif (slopeR < .2) baseColorR = mix( sandR, grassR, slopeR * (1.0/0.2) );\nfloat ambientOcclusion =( baseColorR.r - 1.0 ) * aoMapIntensity + 1.0;\nroughnessFactor *= baseColorR.g;\nmetalnessFactor *= baseColorR.b;\n#endif',
    ao: 'reflectedLight.indirectDiffuse *= ambientOcclusion;\n#if defined( USE_ENVMAP ) && defined( STANDARD )\n    float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n    reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );\n#endif',
    map_pars: '#ifdef USE_MAP\n    uniform sampler2D map;\n    uniform sampler2D map1;\n    uniform sampler2D map2;\n#endif',
    map: '#ifdef USE_MAP\nfloat slope = vColor.r;\nvec4 baseColor = vec4(1.0);\nvec4 sand = texture2D( map, vUv );\nvec4 grass = texture2D( map1, vUv );\nvec4 rock = texture2D( map2, vUv );\nif (slope < .5) baseColor = grass;\nif (slope > .8) baseColor = rock;\nif ((slope<.8) && (slope >= .5)) baseColor = mix( grass , rock, (slope - .5) * (1. / (.8 - .5)));\nif (slope < .2) baseColor = mix( sand, grass, slope * (1.0/0.2) );\ndiffuseColor *= mapTexelToLinear( baseColor );\n#endif',
    displacement_part: '#ifdef USE_DISPLACEMENTMAP\n    uniform sampler2D displacementMap;\n    uniform sampler2D displacementMap1;\n    uniform sampler2D displacementMap2;\n    uniform float displacementScale;\n    uniform float displacementBias;\n#endif',
    displacement: '#ifdef USE_MAP\nfloat slope = vColor.r;\nvec4 baseColor = vec4(1.0);\nvec4 sand = texture2D( displacementMap, vUv );\nvec4 grass = texture2D( displacementMap1, vUv );\nvec4 rock = texture2D( displacementMap2, vUv );\nif (slope < .5) baseColor = grass;\nif (slope > .8) baseColor = rock;\nif ((slope<.8) && (slope >= .5)) baseColor = mix( grass , rock, (slope - .5) * (1. / (.8 - .5)));\nif (slope < .2) baseColor = mix( sand, grass, slope * (1.0/0.2) );\ntransformed += normalize( objectNormal ) * ( baseColor.x * displacementScale + displacementBias );\n#endif',
    normal_pars: '#ifdef USE_NORMALMAP\nuniform sampler2D normalMap;\nuniform sampler2D normalMap1;\nuniform sampler2D normalMap2;\nuniform vec2 normalScale;\nvec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 n_color ) {\nvec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );\nvec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );\nvec2 st0 = dFdx( vUv.st );\nvec2 st1 = dFdy( vUv.st );\nvec3 S = normalize( q0 * st1.t - q1 * st0.t );\nvec3 T = normalize( -q0 * st1.s + q1 * st0.s );\nvec3 N = normalize( surf_norm );\nvec3 mapN = n_color.xyz * 2.0 - 1.0;\nmapN.xy = normalScale * mapN.xy;\nmat3 tsn = mat3( S, T, N );\nreturn normalize( tsn * mapN );\n}\n#endif',
    normal: '#ifdef USE_NORMALMAP\nvec4 extraNormal = vec4(1.0);\nvec4 sandN =  texture2D( normalMap, vUv );\nvec4 grassN = texture2D( normalMap1, vUv );\nvec4 rockN = texture2D( normalMap2, vUv );\nfloat slopeN = vColor.r;\nif (slopeN < .5) extraNormal = grassN;\nif (slopeN > .8) extraNormal = rockN;\nif ((slopeN<.8) && (slopeN >= .5)) extraNormal = mix( grassN , rockN, (slopeN - .5) * (1. / (.8 - .5)));\nif (slopeN < .2) extraNormal = mix( sandN, grassN, slopeN * (1.0/0.2) );\nnormal = perturbNormal2Arb( -vViewPosition.xyz, normal.xyz, extraNormal.xyz );\n#endif'
};

export { Terrain3 };
