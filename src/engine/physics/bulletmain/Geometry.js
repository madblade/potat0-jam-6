/**
 * Legacy Geometry, extended for the needs of bullet.
 */

'use strict';

import { inherit }              from '../../../extend';

import { ConvexHull }           from './ConvexHull';
import { Geometry }             from 'three/examples/jsm/deprecated/Geometry';
import {
    BufferAttribute,
    BufferGeometry,
    CylinderGeometry,
    Float32BufferAttribute,
    Matrix4,
    SphereGeometry
}                               from 'three';

export function geometryInfo(g, type)
{
    const verticesOnly = false;
    let facesOnly = false;
    const withColor = true;

    if (type === 'mesh' || type === 'convex') facesOnly = true;
    //if(type == 'convex') verticesOnly = true;

    let i;
    let j;
    let n;
    let p;
    let n2;

    const tmpGeo = g.isBufferGeometry ? new Geometry().fromBufferGeometry(g) : g;
    tmpGeo.mergeVertices();

    const totalVertices = g.attributes.position.array.length / 3;
    const numVertices = tmpGeo.vertices.length;
    const numFaces = tmpGeo.faces.length;

    g.realVertices = new Float32Array(numVertices * 3);
    g.realIndices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3);

    if (withColor) {
        g.setAttribute('color', new BufferAttribute(new Float32Array(totalVertices * 3), 3));
        var cc = g.attributes.color.array;

        i = totalVertices;
        while (i--) {
            n = i * 3;
            cc[n] = 1;
            cc[n + 1] = 1;
            cc[n + 2] = 1;
        }
    }

    i = numVertices;
    while (i--) {
        p = tmpGeo.vertices[i];
        n = i * 3;
        g.realVertices[n] = p.x;
        g.realVertices[n + 1] = p.y;
        g.realVertices[n + 2] = p.z;
    }

    if (verticesOnly) {
        tmpGeo.dispose();
        return g.realVertices;
    }

    i = numFaces;
    while (i--) {
        p = tmpGeo.faces[i];
        n = i * 3;
        g.realIndices[n] = p.a;
        g.realIndices[n + 1] = p.b;
        g.realIndices[n + 2] = p.c;
    }

    tmpGeo.dispose();

    //g.realIndices = g.getIndex();
    //g.setIndex(g.realIndices);

    if (facesOnly) {
        const faces = [];
        i = g.realIndices.length;
        while (i--) {
            n = i * 3;
            p = g.realIndices[i] * 3;
            faces[n] = g.realVertices[p];
            faces[n + 1] = g.realVertices[p + 1];
            faces[n + 2] = g.realVertices[p + 2];
        }
        return faces;
    }

    // find same point
    const ar = [];
    const pos = g.attributes.position.array;
    i = numVertices;
    while (i--) {
        n = i * 3;
        ar[i] = [];
        j = totalVertices;
        while (j--) {
            n2 = j * 3;
            if (pos[n2] === g.realVertices[n] && pos[n2 + 1] === g.realVertices[n + 1] && pos[n2 + 2] === g.realVertices[n + 2])
                ar[i].push(j);
        }
    }

    // generate same point index
    const pPoint = new (numVertices > 65535 ? Uint32Array : Uint16Array)(numVertices);
    const lPoint = new (totalVertices > 65535 ? Uint32Array : Uint16Array)(totalVertices);

    p = 0;
    for (i = 0; i < numVertices; i++) {
        n = ar[i].length;
        pPoint[i] = p;
        j = n;
        while (j--) {
            lPoint[p + j] = ar[i][j];
        }
        p += n;
    }

    g.numFaces = numFaces;
    g.numVertices = numVertices;
    g.maxi = totalVertices;
    g.pPoint = pPoint;
    g.lPoint = lPoint;
}

/**
 * CAPSULE GEOMETRY
 */

function Capsule(radius, height, radialSegs, heightSegs)
{
    BufferGeometry.call(this);

    this.type = 'Capsule';

    radius = radius || 1;
    height = height || 1;

    const pi = Math.PI;

    radialSegs = Math.floor(radialSegs) || 12;
    const sHeight = Math.floor(radialSegs * 0.5);

    heightSegs = Math.floor(heightSegs) || 1;
    const o0 = Math.PI * 2;
    const o1 = Math.PI * 0.5;
    const g = new Geometry();
    const m0 = new CylinderGeometry(radius, radius, height, radialSegs, heightSegs, true);

    const mr = new Matrix4();
    const m1 = new SphereGeometry(radius, radialSegs, sHeight, 0, o0, 0, o1);
    const m2 = new SphereGeometry(radius, radialSegs, sHeight, 0, o0, o1, o1);
    const mtx0 = new Matrix4().makeTranslation(0, 0, 0);
    // if(radialSegs===6) mtx0.makeRotationY( 30 * Math.DEG2RAD );
    const mtx1 = new Matrix4().makeTranslation(0, height * 0.5, 0);
    const mtx2 = new Matrix4().makeTranslation(0, -height * 0.5, 0);
    mr.makeRotationZ(pi);
    g.merge(m0, mtx0.multiply(mr));
    g.merge(m1, mtx1);
    g.merge(m2, mtx2);

    g.mergeVertices();
    g.computeVertexNormals();

    m0.dispose();
    m1.dispose();
    m2.dispose();

    this.fromGeometry(g);

    g.dispose();
}

inherit(Capsule, BufferGeometry);

export { Capsule };

/**
 * CONVEX GEOMETRY
 */

function ConvexGeometry(points)
{
    Geometry.call(this);

    this.fromBufferGeometry(new ConvexBufferGeometry(points));
    this.mergeVertices();
}

inherit(ConvexGeometry, Geometry);

export { ConvexGeometry };

/**
 * CONVEXBUFFER GEOMETRY
 */

function ConvexBufferGeometry(points)
{
    BufferGeometry.call(this);

    // buffers
    const vertices = [];
    const normals = [];

    // execute QuickHull
    const quickHull = new ConvexHull().setFromPoints(points);

    // generate vertices and normals
    const faces = quickHull.faces;
    for (let i = 0; i < faces.length; i++)
    {
        const face = faces[i];
        let edge = face.edge;

        // we move along a doubly-connected edge list to access all face points (see HalfEdge docs)
        do {
            const point = edge.head().point;

            vertices.push(point.x, point.y, point.z);
            normals.push(face.normal.x, face.normal.y, face.normal.z);

            edge = edge.next;
        } while (edge !== face.edge);
    }

    // build geometry

    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
}

inherit(ConvexBufferGeometry, BufferGeometry);

export { ConvexBufferGeometry };
