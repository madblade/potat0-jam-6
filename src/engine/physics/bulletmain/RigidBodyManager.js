
import { Capsule, geometryInfo }  from './Geometry';
import { map, root }              from './root';
import {
    BoxBufferGeometry,
    CylinderBufferGeometry,
    Euler,
    Group,
    Matrix4,
    Mesh,
    Quaternion,
    SphereBufferGeometry
} from 'three';
import { ChamferBox, ChamferCyl } from './Chamfer';

function RigidBodyManager()
{
    this.ID = 0;
    this.solids = [];
    this.bodies = [];
}

Object.assign(RigidBodyManager.prototype, {

    step(AR, N)
    {
        //var AR = root.Ar;
        //var N = root.ArPos[ 0 ];

        var n;

        this.bodies.forEach(function(b, id)
        {
            n = N + id * 8;

            //if( AR[n] + AR[n+1] + AR[n+2] + AR[n+3] !== 0 || b.isKinemmatic ) {

            var s = AR[n];// speed km/h
            if (s > 0) {
                // if (b.material.name === 'sleep') b.material = root.mat.move;
                // if (s > 50 && b.material.name === 'move') b.material = root.mat.speed;
                // else if (s < 50 && b.material.name === 'speed') b.material = root.mat.move;
            } else {
                // if (b.material.name === 'move' || b.material.name === 'speed') b.material = root.mat.sleep;
            }

            if (b.enabled) {
                b.position.fromArray(AR, n + 1);
                b.quaternion.fromArray(AR, n + 4);

                //if( !b.matrixAutoUpdate ) b.updateMatrix();
                //b.updateMatrixWorld( true );
                //b.updateWorldMatrix( true,true)
            }
        });
    },

    clear()
    {
        while (this.bodies.length > 0) this.destroy(this.bodies.pop());
        while (this.solids.length > 0) this.destroy(this.solids.pop());
        this.ID = 0;
    },

    destroy(b)
    {
        map.delete(b.name);
        root.destroy(b);
    },

    remove(name)
    {
        if (!map.has(name)) return;
        var b = map.get(name);
        var solid = b.type === 'solid';
        var n = solid ? this.solids.indexOf(b) : this.bodies.indexOf(b);

        if (n !== -1) {
            if (solid) {
                this.solids.splice(n, 1);
                this.destroy(b);
            } else {
                this.bodies.splice(n, 1);
                this.destroy(b);
            }
        }
    },

    add(o, extra)
    {
        if (o.density !== undefined) o.mass = o.density;
        if (o.bounce !== undefined) o.restitution = o.bounce;

        o.mass = o.mass === undefined ? 0 : o.mass;
        o.kinematic = o.kinematic || false;

        var autoName = 'body';
        if (o.mass === 0 && !o.kinematic) autoName = 'static';

        o.name = o.name !== undefined ? o.name : autoName + this.ID++;

        // delete old if same name
        this.remove(o.name);

        if (o.breakable) {
            if (o.type === 'hardbox' || o.type === 'box' || o.type === 'sphere' ||
                o.type === 'cylinder' || o.type === 'cone')
                o.type = `real${o.type}`;
        }

        var customGeo = false;

        o.type = o.type === undefined ? 'box' : o.type;

        // position
        o.pos = o.pos === undefined ? [0, 0, 0] : o.pos;
        // size
        o.size = o.size === undefined ? [1, 1, 1] : o.size;
        o.size = root.correctSize(o.size);
        if (o.geoSize) o.geoSize = root.correctSize(o.geoSize);
        // rotation is in degree or Quaternion
        o.quat = o.quat === undefined ? [0, 0, 0, 1] : o.quat;
        if (o.rot !== undefined) {
            o.quat = root.toQuatArray(o.rot);
            delete o.rot;
        }

        var mesh = null;
        var noMesh = o.noMesh !== undefined ? o.noMesh : false;

        if (o.type === 'plane') {
            //this.grid.position.set( o.pos[0], o.pos[1], o.pos[2] )
            root.post('add', o);
            return;
        }

        // material

        var material;
        if (o.material !== undefined) {
            if (o.material.constructor === String) material = root.mat[o.material];
            else material = o.material;
        } else {
            if (o.mass === 0 && !o.kinematic) material = root.mat.static;
            else material = root.mat.move;
            if (o.kinematic) material = root.mat.kinematic;
        }

        // geometry

        var m;
        var g;

        if (o.type === 'compound') {
            for (var i = 0; i < o.shapes.length; i++) {
                g = o.shapes[i];
                g.size = g.size === undefined ? [1, 1, 1] : g.size;
                if (g.size.length === 1) {
                    g.size[1] = g.size[0];
                }
                if (g.size.length === 2) {
                    g.size[2] = g.size[0];
                }
                g.pos = g.pos === undefined ? [0, 0, 0] : g.pos;
                g.rot = g.rot === undefined ? [0, 0, 0] : g.rot;
                g.quat = g.quat === undefined ? new Quaternion().setFromEuler(new Euler().fromArray(g.rot)).toArray() : g.quat;
            }

            mesh = o.geometry ? new Mesh(o.geometry, material) : new Group();

            if (o.geometry) root.extraGeo.push(o.geometry);

            if (!o.geometry || o.debug) {
                //mesh = new Group();
                mesh.material = material;

                for (let ii = 0; ii < o.shapes.length; ii++) {
                    g = o.shapes[ii];

                    var geom = null;

                    if (g.type === 'capsule') geom = new Capsule(o.size[0], o.size[1]);
                    else if (g.type === 'convex') {
                        geom = g.shape;
                        g.v = geometryInfo(g.shape, g.type);
                        delete g.shape;
                    } else geom = root.geo[g.type];

                    if (g.type === 'capsule' || g.type === 'convex') root.extraGeo.push(geom);

                    m = new Mesh(geom, o.debug ? root.mat.debug : material);
                    m.scale.fromArray(g.size);
                    m.position.fromArray(g.pos);
                    m.quaternion.fromArray(g.quat);

                    mesh.add(m);
                }
            }
        } else if (o.type === 'mesh' || o.type === 'convex') {
            customGeo = true;

            if (o.shape) {
                o.v = geometryInfo(o.shape, o.type);
                root.extraGeo.push(o.shape);
            }

            if (o.geometry) {
                if (o.geoScale) {
                    o.geometry = o.geometry.clone();
                    o.geometry.applyMatrix(new Matrix4().makeScale(o.geoScale[0], o.geoScale[0], o.geoScale[0]));
                }

                mesh = new Mesh(o.geometry, material);
                root.extraGeo.push(o.geometry);
            } else {
                if (!noMesh) mesh = new Mesh(o.shape, material);
                //extraGeo.push(mesh.geometry);
            }
        } else {
            //if ( o.type === 'box' && o.mass === 0 && ! o.kinematic ) o.type = 'hardbox';
            if (o.type === 'capsule') o.geometry = new Capsule(o.size[0], o.size[1]);

            // breakable
            if (o.type === 'realbox' || o.type === 'realhardbox') o.geometry = new BoxBufferGeometry(o.size[0], o.size[1], o.size[2]);
            if (o.type === 'realsphere') o.geometry = new SphereBufferGeometry(o.size[0], 16, 12);
            if (o.type === 'realcylinder') o.geometry = new CylinderBufferGeometry(o.size[0], o.size[0], o.size[1] * 0.5, 12, 1);
            if (o.type === 'realcone') o.geometry = new CylinderBufferGeometry(0, o.size[0] * 0.5, o.size[1] * 0.55, 12, 1);

            // new Geometry
            if (o.radius !== undefined && root.isRefView) {
                if (o.type === 'box') o.geometry = new ChamferBox(o.size[0], o.size[1], o.size[2], o.radius);
                if (o.type === 'cylinder') o.geometry = new ChamferCyl(o.size[0], o.size[0], o.size[1] * 0.5, o.radius);
                if (o.type === 'cone') o.geometry = new ChamferCyl(o.radius, o.size[0], o.size[1] * 0.5, o.radius);
            }


            if (o.geometry) {
                if (o.geoRot || o.geoScale) o.geometry = o.geometry.clone();
                // rotation only geometry
                if (o.geoRot) o.geometry.applyMatrix(new Matrix4().makeRotationFromEuler(
                    new Euler().fromArray(o.geoRot))
                );
                // scale only geometry
                if (o.geoScale) o.geometry.applyMatrix(new Matrix4().makeScale(o.geoScale[0], o.geoScale[1], o.geoScale[2]));
            }

            mesh = new Mesh(o.geometry || root.geo[o.type], material);

            if (o.geometry) {
                root.extraGeo.push(o.geometry);
                if (o.geoSize) mesh.scale.fromArray(o.geoSize);// ??
                //if( !o.geoSize && o.size && o.type !== 'capsule' ) mesh.scale.fromArray( o.size );
                customGeo = true;
            }
        }

        if (o.type === 'highsphere') o.type = 'sphere';

        if (extra === 'isGeometry') return g;

        if (mesh) {
            if (!customGeo && !mesh.isGroup) {
                mesh.scale.fromArray(o.size);
                // ! add to group to avoid matrix scale
                var tmp = mesh;
                mesh = new Group();
                mesh.add(tmp);
            }

            // mesh remplacement
            if (o.mesh) {
                mesh = new Group();
                mesh.add(o.mesh);
            }

            // out of view on start
            //mesh.position.set(0,-1000000,0);
            mesh.position.fromArray(o.pos);
            mesh.quaternion.fromArray(o.quat);

            mesh.updateMatrix();

            mesh.name = o.name;
            mesh.enabled = true;
            //mesh.type = 'rigidbody';

            if (o.parent !== undefined) {
                o.parent.add(mesh);
                o.parent = null;
            } else {
                root.container.add(mesh);
            }

            // shadow
            if (o.noShadow === undefined) {
                if (mesh.isGroup) {
                    /*Object.defineProperty( mesh, 'material', {
                        get: function() { return this.children[0].material; },
                        set: function( value ) {
                            var i = this.children.length;
                            while(i--) this.children[i].material = value;
                        }
                    });*/

                    Object.defineProperty(mesh, 'receiveShadow', {
                        get()
                        {
                            return this.children[0].receiveShadow;
                        },
                        set(value)
                        {
                            let ii = this.children.length;
                            while (ii--) this.children[ii].receiveShadow = value;
                        }
                    });

                    Object.defineProperty(mesh, 'castShadow', {
                        get()
                        {
                            return this.children[0].castShadow;
                        },
                        set(value)
                        {
                            let ii = this.children.length;
                            while (ii--) this.children[ii].castShadow = value;
                        }
                    });

                    /*var j = mesh.children.length;
                    while(j--){
                        mesh.children[j].receiveShadow = true;
                        mesh.children[j].castShadow = o.mass === 0 && !o.kinematic ? false : true;
                    }*/
                }

                mesh.receiveShadow = true;
                mesh.castShadow = !(o.mass === 0 && !o.kinematic);

                //console.log('??')
            }
        }

        if (o.shape) delete o.shape;
        if (o.geometry) delete o.geometry;
        if (o.material) delete o.material;
        if (o.mesh) {
            delete o.mesh;
        }

        if (o.noPhy === undefined) {
            // push
            if (mesh) {
                if (o.mass === 0 && !o.kinematic) this.solids.push(mesh);// static
                else this.bodies.push(mesh);// dynamic
            }
            // send to worker
            root.post('add', o);
        }

        if (mesh) {
            mesh.type = o.mass === 0 && !o.kinematic ? 'solid' : 'body';
            //if( o.kinematic ) mesh.type = 'kinematic';

            //if ( o.mass === 0 && ! o.kinematic ) mesh.isSolid = true;
            //if ( o.kinematic ) mesh.isKinemmatic = true;
            //else mesh.isBody = true;
            //mesh.userData.mass = o.mass;
            mesh.userData.mass = o.mass;
            map.set(o.name, mesh);

            if (o.autoMatrix !== undefined) mesh.matrixAutoUpdate = o.autoMatrix;

            return mesh;
        }
    }

});

export { RigidBodyManager };
