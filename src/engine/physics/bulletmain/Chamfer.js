
import { inherit }      from '../../../extend';

import {
    BufferGeometry,
    CircleGeometry,
    CylinderGeometry,
    Matrix4,
    PlaneGeometry,
    SphereGeometry,
    TorusGeometry
}                   from 'three';
import { Geometry } from 'three/examples/jsm/deprecated/Geometry';

let ChamferBox = function(a, c, d, e, f, h, m, k)
{
    BufferGeometry.call(this);
    this.type = 'ChamferBox';
    a = a || 1;
    c = c || 1;
    d = d || 1;
    e = e || .1;
    f = Math.floor(f) || 1;
    h = Math.floor(h) || 1;
    m = Math.floor(m) || 1;
    k = Math.floor(k) || 3;
    let n = Math.PI;
    let q = .5 * n;
    let r = 2 * e;
    let D = .5 * a;
    let y = .5 * c;
    let t = .5 * d;
    let F = new Matrix4();
    let v = new Matrix4();
    let H = new Matrix4();
    let E = new Geometry();
    let J = new PlaneGeometry(a - r, c - r, f, h);
    let G = new CylinderGeometry(e, e, a - r, k, f, !0, 0, q);
    let I = new CylinderGeometry(e, e, c - r, k, h, !0, 0, q);
    let C = new SphereGeometry(e, k, k, 0, q, 0, -q);
    v.makeTranslation(0, D - e, 0);
    F.makeRotationX(q);
    G.merge(C, v.multiply(F));
    v.makeTranslation(0, -D + e, 0);
    F.makeRotationX(q);
    H.makeRotationY(-q);
    G.merge(C, v.multiply(F).multiply(H));
    v.makeTranslation(D - e, 0, -e);
    J.merge(I, v);
    v.makeTranslation(-D + e, 0, -e);
    F.makeRotationZ(n);
    J.merge(I, v.multiply(F));
    F.makeRotationZ(q);
    v.makeTranslation(0, y - e, -e);
    J.merge(G, v.multiply(F));
    v.makeTranslation(0, -y + e, -e);
    F.makeRotationZ(-q);
    J.merge(G, v.multiply(F));
    v.makeTranslation(0, 0, t);
    E.merge(J, v);
    v.makeTranslation(0, 0, -t);
    F.makeRotationY(n);
    E.merge(J, v.multiply(F));
    J.dispose();
    G.dispose();
    J = new PlaneGeometry(d - r, c - r, m, h);
    G = new CylinderGeometry(e, e, d - r, k, m, !0, 0, q);
    v.makeTranslation(0, -(y - e), -e, 0);
    F.makeRotationZ(-q);
    J.merge(G, v.multiply(F));
    v.makeTranslation(0, y - e, -e, 0);
    F.makeRotationZ(q);
    J.merge(G, v.multiply(F));
    v.makeTranslation(-D, 0, 0);
    F.makeRotationY(-q);
    E.merge(J, v.multiply(F));
    v.makeTranslation(D, 0, 0);
    F.makeRotationY(q);
    E.merge(J, v.multiply(F));
    J.dispose();
    J = new PlaneGeometry(a - r, d - r, f, m);
    v.makeTranslation(0, y, 0);
    F.makeRotationX(-q);
    E.merge(J, v.multiply(F));
    v.makeTranslation(0, -y, 0);
    F.makeRotationX(q);
    E.merge(J, v.multiply(F));
    J.dispose();
    G.dispose();
    I.dispose();
    C.dispose();
    E.mergeVertices();
    E.computeVertexNormals();
    this.fromGeometry(E);
    E.dispose();
};
inherit(ChamferBox, BufferGeometry);
let ChamferCyl = function(a, c, d, e, f, h, m)
{
    BufferGeometry.call(this);
    this.type = 'ChamferCyl';
    a = void 0 !== a ? a : 1;
    c = void 0 !== c ? c : 1;
    d = d || 1;
    e = e || .2;
    f = Math.floor(f) || 24;
    h = Math.floor(h) || 1;
    m = Math.floor(m) || 3;
    let k = new Matrix4();
    let n = new Matrix4();
    let q = Math.PI;
    let r = .5 * q;
    q *= 2;
    h = new CylinderGeometry(a, c, d - 2 * e, f, h, !0, 0);
    let D = new TorusGeometry(a - e, e, m, f, q, 0, r);
    a = new CircleGeometry(a - e, f);
    n.makeTranslation(0, 0, e);
    D.merge(a, n);
    k.makeTranslation(0, 0, .5 * d - e);
    n.makeRotationX(-r);
    h.merge(D, n.multiply(k));
    D.dispose();
    a.dispose();
    D = new TorusGeometry(c - e, e, m, f, q, 0, r);
    a = new CircleGeometry(c - e, f);
    n.makeTranslation(0, 0, e);
    D.merge(a, n);
    k.makeTranslation(0, 0, .5 * d - e);
    n.makeRotationX(r);
    h.merge(D, n.multiply(k));
    D.dispose();
    a.dispose();
    h.mergeVertices();
    h.computeVertexNormals();
    this.fromGeometry(h);
    h.dispose();
};

inherit(ChamferCyl, BufferGeometry);

export { ChamferBox, ChamferCyl };
