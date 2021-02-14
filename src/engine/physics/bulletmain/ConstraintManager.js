/**
 * Legacy.
 */

'use strict';

import { map, root }    from './root';
import {
    BufferAttribute,
    BufferGeometry,
    Line,
    Mesh
}                       from 'three';

function ConstraintManager()
{
    this.ID = 0;
    this.joints = [];

    /*this.mat0 =new LineBasicMaterial( { vertexColors: VertexColors, depthTest: false,
        depthWrite: false, transparent: true });
    this.mat1 = new MeshBasicMaterial({ wireframe:true, color:0x00ff00, depthTest:false, depthWrite:true });
    this.mat2 = new MeshBasicMaterial({ wireframe:true, color:0xffff00, depthTest:false, depthWrite:true });

    this.g = new ConeBufferGeometry(0.1,0.2,6);
    this.g.translate( 0, 0.1, 0 );
    this.g.rotateZ( -Math.PI*0.5 );*/
}

Object.assign(ConstraintManager.prototype, {

    step(AR, N)
    {
        if (!root.constraintDebug) return;

        var n;

        this.joints.forEach(function(j, id)
        {
            n = N + id * 14;
            j.step(n, AR);
        });
    },

    clear()
    {
        while (this.joints.length > 0) this.destroy(this.joints.pop());
        this.ID = 0;
    },

    destroy(j)
    {
        map.delete(j.name);
        j.clear();
        //root.destroy( b );
    },

    remove(name)
    {
        if (!map.has(name)) return;
        var j = map.get(name);

        var n = this.joints.indexOf(j);
        this.joints.splice(n, 1);
        this.destroy(j);
    },

    add(o)
    {
        o.name = o.name !== undefined ? o.name : `joint${this.ID++}`;

        // delete old if same name
        this.remove(o.name);

        /*
        if ( o.rotA ){ o.quatA = root.toQuatArray( o.rotA ); delete ( o.rotA ); }
        if ( o.rotB ){ o.quatB = root.toQuatArray( o.rotB ); delete ( o.rotB ); }
        */

        var joint = new Joint(o);
        this.joints.push(joint);

        // add to map
        map.set(joint.name, joint);

        // send to worker
        if (o.parent !== undefined) o.parent = null;
        root.post('add', o);

        return joint;
    },

});

export { ConstraintManager };


function Joint(o)
{
    this.type = 'constraint';
    this.name = o.name;

    this.isMesh = false;

    if (root.constraintDebug) this.init(o);
}

Object.assign(Joint.prototype, {

    step(n, AR)
    {
        if (!this.isMesh) return;

        if (!this.mesh.visible) this.mesh.visible = true;

        var p = this.pos.array;

        p[0] = AR[n];
        p[1] = AR[n + 1];
        p[2] = AR[n + 2];

        p[3] = AR[n + 7];
        p[4] = AR[n + 8];
        p[5] = AR[n + 9];

        this.pos.needsUpdate = true;

        this.p1.position.fromArray(AR, n);
        this.p1.quaternion.fromArray(AR, n + 3);

        this.p2.position.fromArray(AR, n + 7);
        this.p2.quaternion.fromArray(AR, n + 10);
    },

    init(o)
    {
        var vertices = new Float32Array([0, 0, 0, 0, 0, 0]);
        var colors = new Float32Array([0, 1, 0, 1, 1, 0]);

        var geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new BufferAttribute(colors, 3));

        this.mesh = new Line(geometry, root.mat.jointLine);
        this.mesh.name = o.name;

        this.p1 = new Mesh(root.geo.joint, root.mat.jointP1);
        this.p2 = new Mesh(root.geo.joint, root.mat.jointP2);

        this.p1.receiveShadow = false;
        this.p1.castShadow = false;
        this.p2.receiveShadow = false;
        this.p2.castShadow = false;
        this.mesh.receiveShadow = false;
        this.mesh.castShadow = false;

        this.mesh.add(this.p1);
        this.mesh.add(this.p2);

        this.mesh.frustumCulled = false;

        this.pos = this.mesh.geometry.attributes.position;

        this.mesh.visible = false;

        if (o.parent !== undefined) {
            o.parent.add(this.mesh);
            o.parent = null;
        } else {
            root.container.add(this.mesh);
        }

        this.isMesh = true;
    },

    clear()
    {
        if (!this.isMesh) return;

        this.mesh.geometry.dispose();
        root.destroy(this.mesh);
        this.mesh = null;
        this.p1 = null;
        this.p2 = null;
        this.isMesh = false;
    },

});
