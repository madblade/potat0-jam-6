/**
 * Tubular mesh from legacy THREE.
 */

'use strict';

import extend, { inherit }  from '../../../extend';

import { Geometry }         from 'three/examples/jsm/deprecated/Geometry';
import  {
    BufferGeometry,
    CatmullRomCurve3,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Matrix4,
    Quaternion,
    Uint16BufferAttribute,
    Uint32BufferAttribute,
    Vector2,
    Vector3
}                           from 'three';

let Tubular = function(a, c, d, e, f, h)//, m)
{
    BufferGeometry.call(this);
    this.debug = !1;
    this.type = 'Tubular';
    this.geoType = h || 'tube';
    this.tubularSegments = c || 64;
    this.radius = d || 1;
    this.radialSegments = e || 8;
    this.closed = f || !1;
    this.scalar = 1;
    if (a instanceof Array)
        this.positions = a;
    else {
        this.positions = [];
        c = new Vector3().fromArray(a.start);
        d = new Vector3().fromArray(a.end);
        e = d.clone().sub(c);
        a = a.numSegment - 1;
        this.positions.push(c);
        for (f = 1; f < a; f++)
            this.positions.push(new Vector3(e.x / a * f, e.y / a * f, e.z / a * f).add(c));
        this.positions.push(d);
    }
    this.rotations = [];
    for (f = 1; f < this.positions.length + 1; f++)
        this.rotations.push(new Quaternion());
    this.path = new CatmullRomCurve3(this.positions);
    this.path.type = 'catmullrom';
    this.path.closed = this.closed;
    this.frames = computeFrenetFrames(this.tubularSegments, this.closed, this.rotations);
    this.vertex = new Vector3();
    this.normal = new Vector3();
    this.uv = new Vector2();
    this.vertices = [];
    this.colors = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.generatePath();
    this.setIndex(new (this.indices.length > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute)(this.indices, 1));
    this.setAttribute('position', new Float32BufferAttribute(this.vertices, 3));
    this.setAttribute('color', new Float32BufferAttribute(this.colors, 3));
    this.setAttribute('normal', new Float32BufferAttribute(this.normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(this.uvs, 2));
};

inherit(Tubular, BufferGeometry);

extend(Tubular.prototype, {

    addDebug(a)
    {
        this.path.g = new Geometry();
        for (var c = 0; c < this.tubularSegments + 1; c++)
            this.path.g.vertices.push(new Vector3());
        this.path.mesh = new Line(this.path.g, new LineBasicMaterial({
            color: 16746496,
            linewidth: 1,
            depthTest: !1,
            depthWrite: !1,
            transparent: !0
        }));
        a.add(this.path.mesh);
        this.debug = !0;
    },

    setTension(a)
    {
        this.path.tension = a;
    },

    generateSegment(a)
    {
        let c = a / this.tubularSegments;
        let d = this.scalar;
        this.geoType === 'sphere' && (d = 2 * Math.sqrt(Math.pow(.5, 2) - Math.pow(c - .5, 2)));
        var e = 3 * a * (this.radialSegments + 1);
        c = this.path.getPointAt(c);
        this.debug && this.path.g.vertices[a].copy(c);
        for (var f = this.frames.normals[a], h = this.frames.binormals[a], m = !0, k = 1, n = 0;
            n <= this.radialSegments; n++)
        {
            var q = n / this.radialSegments * Math.PI * 2;
            this.radialSegments === 1 && (q = 0);
            a = 3 * n;
            var r = Math.sin(q);
            q = -Math.cos(q);
            this.radialSegments === 1 ?
                (m ? (k = .5, m = !1) : (k = -.5, m = !0),
                this.normal.copy(f).negate().projectOnPlane(new Vector3(0, 1, 0))) :
                (this.normal.x = q * f.x + r * h.x,
                this.normal.y = q * f.y + r * h.y,
                this.normal.z = q * f.z + r * h.z);
            this.normal.normalize();
            this.normals[e + a] = this.normal.x;
            this.normals[e + a + 1] = this.normal.y;
            this.normals[e + a + 2] = this.normal.z;
            this.normal.multiplyScalar(d);
            this.vertices[e + a] = c.x + this.radius * this.normal.x * k;
            this.vertices[e + a + 1] = c.y + this.radius * this.normal.y * k;
            this.vertices[e + a + 2] = c.z + this.radius * this.normal.z * k;
            this.colors[e + a] = Math.abs(this.normal.x);
            this.colors[e + a + 1] = Math.abs(this.normal.y);
            this.colors[e + a + 2] = Math.abs(this.normal.z);
            this.radialSegments === 1 && (
                this.normals[e + a] = 0,
                this.normals[e + a + 1] = 1,
                this.normals[e + a + 2] = 0
            );
        }
    },

    generateIndicesAndUv()
    {
        for (var a = 0; a <= this.tubularSegments; a++)
            for (var c = 0; c <= this.radialSegments; c++) {
                if (c > 0 && a > 0) {
                    let d = (this.radialSegments + 1) * a + (c - 1);
                    let e = (this.radialSegments + 1) * a + c;
                    let f = (this.radialSegments + 1) * (a - 1) + c;
                    this.indices.push((this.radialSegments + 1) * (a - 1) + (c - 1), d, f);
                    this.indices.push(d, e, f);
                }
                this.uv.x = c / this.radialSegments;
                this.uv.y = a / this.tubularSegments;
                this.uvs.push(this.uv.x, this.uv.y);
            }
    },

    generatePath(a)
    {
        for (a = 0; a <= this.tubularSegments; a++)
            this.generateSegment(a);
        this.generateIndicesAndUv();
    },

    updatePath(a)
    {
        this.frames = computeFrenetFrames(this.tubularSegments, this.closed, this.rotations);
        this.normals = this.attributes.normal.array;
        this.vertices = this.attributes.position.array;
        this.colors = this.attributes.color.array;
        for (a = 0; a <= this.tubularSegments; a++)
            this.generateSegment(a);
        this.attributes.color.needsUpdate = !0;
        this.attributes.position.needsUpdate = !0;
        this.attributes.normal.needsUpdate = !0;
        this.attributes.uv.needsUpdate = !0;
        this.debug && (this.path.g.verticesNeedUpdate = !0);
        this.geoType === 'sphere' && this.computeVertexNormals();
        this.computeBoundingSphere();
    },

    updateUV()
    {
        this.uvs = this.attributes.uv.array;
        for (var a, c, d = 0; d <= this.tubularSegments; d++) {
            a = 2 * d * (this.radialSegments + 1);
            for (let e = 0; e <= this.radialSegments; e++)
                // eslint-disable-next-line no-sequences
                c = 2 * e,
                this.uv.x = d / this.tubularSegments,
                this.uv.y = e / this.radialSegments,
                this.uvs[a + c] = this.uv.x,
                this.uvs[a + c + 1] = this.uv.y;
        }
        this.attributes.uv.needsUpdate = !0;
    },

    updateIndices()
    {
        this.indices = [];
        for (let a, c, d = 0; d <= this.tubularSegments; d++) {
            c = 2 * d * (this.radialSegments + 1);
            for (let e = 0; e <= this.radialSegments; e++) {
                if (e > 0 && d > 0) {
                    let f = (this.radialSegments + 1) * d + (e - 1);
                    let h = (this.radialSegments + 1) * d + e;
                    let m = (this.radialSegments + 1) * (d - 1) + e;
                    this.indices.push((this.radialSegments + 1) * (d - 1) + (e - 1), f, m);
                    this.indices.push(f, h, m);
                }
                this.uv.x = d / this.tubularSegments;
                this.uv.y = e / this.radialSegments;
                this.uvs[c + a] = this.uv.y;
                this.uvs[c + a + 1] = this.uv.x;
                a = 2 * e;
            }
        }
    }
});

let computeFrenetFrames = function(a, c, d)
{
    let e = new Vector3();
    let f = [];
    let h = [];
    let m = [];
    let k = new Vector3();
    let n = new Matrix4();
    let q = d[d.length - 1];
    // eslint-disable-next-line no-new
    new Quaternion();
    for (d = 0; d <= a; d++) {
        let r = d / a;
        f[d] = this.getTangentAt(r);
        f[d].normalize();
    }
    h[0] = new Vector3();
    m[0] = new Vector3();
    e.set(0, 0, 1).applyQuaternion(q).normalize();
    k.crossVectors(f[0], e).normalize();
    h[0].crossVectors(f[0], k);
    m[0].crossVectors(f[0], h[0]);
    for (d = 1; d <= a; d++)
        // eslint-disable-next-line no-sequences
        h[d] = h[d - 1].clone(),
        m[d] = m[d - 1].clone(),
        k.crossVectors(f[d - 1], f[d]),
        k.length() > Number.EPSILON && (k.normalize(),
        e = Math.acos(this.clamp(f[d - 1].dot(f[d]), -1, 1)),
        h[d].applyMatrix4(n.makeRotationAxis(k, e))),
        m[d].crossVectors(f[d], h[d]);
    if (!0 === c)
        for (
            e = Math.acos(this.clamp(h[0].dot(h[a]), -1, 1)),
            e /= a,
            f[0].dot(k.crossVectors(h[0], h[a])) > 0 && (e = -e),
            d = 1; d <= a; d++
        )
            // eslint-disable-next-line no-sequences
            h[d].applyMatrix4(n.makeRotationAxis(f[d], e * d)),
            m[d].crossVectors(f[d], h[d]);
    return {
        tangents: f,
        normals: h,
        binormals: m
    };
};

export { Tubular };
