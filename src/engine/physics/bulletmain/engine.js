/**
 * Reworked ammo.labs wrapper.
 * @author lo-th
 * @author madblade
 */

'use strict';

import extend                   from '../../../extend';

import Worker                   from '../bulletworker/engine.worker';
// ^ webpack-managed import
import { RigidBodyManager }     from './RigidBodyManager';
import { ConstraintManager }    from './ConstraintManager';
import { SoftBodyManager }      from './SoftBodyManager';
import { TerrainManager }       from './TerrainManager';
import { VehicleManager }       from './VehicleManager';
import { CharacterManager }     from './CharacterManager';
import { CollisionManager }     from './CollisionManager';
import { RayCaster }            from './RayCaster';
import { ConvexObjectBreaker }  from './ConvexObjectBreaker';
import { map, REVISION, root }  from './root';
import {
    BoxBufferGeometry,
    CircleBufferGeometry,
    ConeBufferGeometry,
    CylinderBufferGeometry,
    Group,
    LineBasicMaterial,
    Matrix4,
    MeshBasicMaterial,
    MeshLambertMaterial,
    PlaneBufferGeometry,
    SphereBufferGeometry,
    Vector3
}                               from 'three';

const Time = typeof performance === 'undefined' ? Date : performance;
const PI90 = Math.PI * 0.5;

let AmmoWrapper = function()
{
    this.option = {
        worldscale: 1,
        gravity: [0, -10, 0],
        fps: 60,

        substep: 2,
        broadphase: 2,
        soft: true,

        animFrame: false,
        fixed: true,
        jointDebug: false,
    };
    this.key = [0, 0, 0];

    this.rigidBody = null;
    this.softBody = null;
    this.terrains = null;
    this.vehicles = null;
    this.character = null;
    this.collision = null;
    this.rayCaster = null;
    this.constraint = null;

    this.convexBreaker = null;
    this.ray = null;
    this.mouseMode = 'free';

    this.tmpRemove = [];
    this.tmpAdd = [];

    this.oldFollow = '';

    this.stats = { skip: 0 };

    this.isInternUpdate = false;

    this.t = {
        now: 0,
        delta: 0,
        then: 0,
        deltaTime: 0,
        inter: 0,
        tmp: 0,
        n: 0,
        timerate: 0,
        steptime: 0
    };

    this.timer = null;
    this.refView = null;

    this.isBuffer = false;
    this.isPause = false;
    this.stepNext = false;

    this.currentMode = '';
    this.oldMode = '';

    this.worker = null;
    this.callback = null;
};

extend(AmmoWrapper.prototype, {

    message(e)
    {
        let data = e.data;
        if (data.Ar)
            root.Ar = data.Ar;
        if (data.flow)
            root.flow = data.flow;

        switch (data.m)
        {
            case 'initEngine':
                this.initEngine();
                break;
            case 'start':
                this.start();
                break;
            case 'step':
                this.step(data.fps, data.delta);
                break;
            case 'moveSolid':
                this.moveSolid(data.o);
                break;
            case 'ellipsoid':
                this.ellipsoidMesh(data.o);
                break;
            case 'makeBreak':
                this.makeBreak(data.o);
                break;
        }
    },

    init(Callback, Type, Option, Counts)
    {
        this.initArray(Counts);
        this.defaultRoot();

        Option = Option || {};

        this.callback = Callback;

        this.isInternUpdate = Option.use_intern_update || false;

        this.option = {
            fps: Option.fps || 120,
            worldscale: Option.worldscale || 1,
            gravity: Option.gravity || [0, -10, 0],
            substep: Option.substep || 2,
            broadphase: Option.broadphase || 2,
            soft: Option.soft !== undefined ? Option.soft : true,
            //penetration: Option.penetration || 0.0399,
            fixed: Option.fixed !== undefined ? Option.fixed : true,
            animFrame: Option.animFrame !== undefined ? Option.animFrame : true,
            jointDebug: Option.jointDebug !== undefined ? Option.jointDebug : false,
            isInternUpdate: this.isInternUpdate,
        };

        this.t.timerate = 1 / this.option.fps * 1000;

        this.startWorker();
    },

    set(o)
    {
        o = o || this.option;
        this.t.timerate = o.fps !== undefined ? 1 / o.fps * 1000 : this.t.timerate;

        this.option.fixed = o.fixed || false;
        this.option.animFrame = o.animFrame || false;
        this.option.jointDebug = o.jointDebug || false;
        o.isInternUpdate = this.isInternUpdate;
        root.constraintDebug = this.option.jointDebug;

        this.post('set', o);
    },

    startWorker()
    {
        let worker = new Worker();
        this.worker = worker;

        worker.postMessage = worker.webkitPostMessage || worker.postMessage;
        worker.onmessage = this.message.bind(this);

        // test transferable arrays
        let ab = new ArrayBuffer(1);
        worker.postMessage({ m: 'test', ab }, [ab]);
        this.isBuffer = !ab.byteLength;

        if (this.isInternUpdate) this.isBuffer = false;

        // start engine worker
        this.post('init', {
            ArPos: root.ArPos,
            ArMax: root.ArMax,
            isBuffer: this.isBuffer,
            option: this.option
        });
        root.post = this.post.bind(this);
    },

    initArray(Counts)
    {
        Counts = Counts || {};

        let counts = {
            maxBody: Counts.maxBody || 1400,
            maxContact: Counts.maxContact || 200,
            maxCharacter: Counts.maxCharacter || 10,
            maxCar: Counts.maxCar || 14,
            maxSoftPoint: Counts.maxSoftPoint || 8192,
            maxJoint: Counts.maxJoint || 1000,
        };

        root.ArLng = [
            counts.maxBody * 8, // rigidbody
            counts.maxContact, // contact
            counts.maxCharacter * 8, // hero
            counts.maxCar * 64, // cars
            counts.maxSoftPoint * 3, // soft point
            counts.maxJoint * 14, // joint point
        ];

        root.ArPos = [
            0,
            root.ArLng[0],
            root.ArLng[0] + root.ArLng[1],
            root.ArLng[0] + root.ArLng[1] + root.ArLng[2],
            root.ArLng[0] + root.ArLng[1] + root.ArLng[2] + root.ArLng[3],
            root.ArLng[0] + root.ArLng[1] + root.ArLng[2] + root.ArLng[3] + root.ArLng[4],
        ];

        root.ArMax = root.ArLng[0] + root.ArLng[1] + root.ArLng[2] +
            root.ArLng[3] + root.ArLng[4] + root.ArLng[5];
    },

    initEngine()
    {
        this.initObject();

        console.log(`[Physics] Engine loaded, v. ${REVISION} | ${this.isBuffer ? 'Buffering Mode' : 'Raw'} | WASM`);

        if (this.callback) this.callback();
    },

    start(noAutoUpdate)
    {
        if (this.isPause) return;
        let option = this.option;
        let t = this.t;
        let isBuffer = this.isBuffer;

        this.stop();

        this.stepNext = true;

        // create transfer array if buffer
        if (isBuffer) root.Ar = new Float32Array(root.ArMax);

        t.then = Time.now();

        if (!noAutoUpdate && !this.isInternUpdate) {
            this.timer = option.animFrame ?
                requestAnimationFrame(this.sendData) :
                setInterval(() => this.sendData(), t.timerate);
        }

        if (!noAutoUpdate && this.isInternUpdate) {
            let key = this.getKey();
            this.worker.postMessage({
                m: 'internStep', o: {steptime: t.steptime, key}, flow: root.flow, Ar: root.Ar
            });
        }

        // test ray
        this.setMode(this.oldMode);
    },

    prevUpdate() {},

    postUpdate() {},

    pastUpdate() {},

    update()
    {
        this.postUpdate(this.t.delta);

        this.rigidBody.step(root.Ar, root.ArPos[0]);
        this.collision.step(root.Ar, root.ArPos[1]);
        this.character.step(root.Ar, root.ArPos[2]);
        this.vehicles.step(root.Ar, root.ArPos[3]);
        this.softBody.step(root.Ar, root.ArPos[4]);
        this.constraint.step(root.Ar, root.ArPos[5]);
        this.terrains.step();
        this.rayCaster.step();

        this.pastUpdate(this.t.delta);
    },

    step(fps, delta)
    {
        let t = this.t;
        if (this.isInternUpdate) {
            t.fps = fps;
            t.delta = delta;
        } else {
            //t.now = Time.now();
            if (t.now - 1000 > t.tmp) {
                t.tmp = t.now;
                t.fps = t.n;
                t.n = 0;
            }
            t.n++; // FPS
        }

        this.tell();
        this.update();

        if (root.controler) root.controler.follow();

        this.stepRemove();
        this.stepAdd();

        this.stepNext = true;

        if (this.isInternUpdate)
            this.sendStep();
    },

    moveActor()
    {
    },

    sendData(stamp)
    {
        // XXX [LOW] Graphics
        // console.log(engine.getFps());
        if (this.isInternUpdate) return;

        if (this.refView && this.refView.pause) {
            this.stop();
            return;
        }

        let t = this.t;
        if (this.option.animFrame) {
            this.timer = requestAnimationFrame(this.sendData);
            t.now = stamp === undefined ? Time.now() : stamp;
            t.deltaTime = t.now - t.then;
            t.delta = t.deltaTime * 0.001;

            if (t.deltaTime > t.timerate) {
                t.then = t.now - t.deltaTime % t.timerate;
                this.sendStep();
            }
        } else {
            if (!this.stepNext) {
                this.stats.skip++;
                return;
            }

            t.delta = (t.now - t.then) * 0.001;
            t.then = t.now;

            this.sendStep();
        }
    },

    sendStep()
    {
        if (!this.stepNext) return;

        let worker = this.worker;
        let t = this.t;
        t.now = Time.now();

        this.prevUpdate(t.delta);

        let key = this.getKey();

        if (this.isInternUpdate) {
            if (this.isBuffer)
                worker.postMessage({
                    m: 'internStep',
                    o: { steptime: t.steptime, key },
                    flow: root.flow, Ar: root.Ar
                },
                [root.Ar.buffer]
                );
            // else worker.postMessage( { m: 'internStep', // [mad] unsupported?
            // o: {  steptime:t.steptime, key:key }, flow: root.flow, Ar: root.Ar } );
        } else {
            if (this.isBuffer)
            {
                worker.postMessage({
                    m: 'step',
                    o: {
                        delta: t.delta, key
                    },
                    flow: root.flow,
                    Ar: root.Ar
                },
                [root.Ar.buffer]
                );
            }
            else worker.postMessage({
                m: 'step', o: {delta: t.delta, key},
                flow: root.flow, Ar: root.Ar
            });
        }

        this.stepNext = false; // await array detachment from worker!
    },

    simpleStep(delta)
    {
        let key = this.getKey();
        this.worker.postMessage({m: 'step', o: {delta, key}});
    },

    /////////

    stepRemove()
    {
        let tmpRemove = this.tmpRemove;
        if (tmpRemove.length === 0) return;
        this.post('setRemove', tmpRemove);
        while (tmpRemove.length > 0) this.remove(tmpRemove.pop(), true);
    },

    stepAdd()
    {
        let tmpAdd = this.tmpAdd;
        if (tmpAdd.length === 0) return;
        //this.post( 'setAdd', tmpAdd );
        while (tmpAdd.length > 0) this.add(tmpAdd.shift());
    },

    setView(v)
    {
        this.refView = v;
        root.mat = Object.assign({}, root.mat, v.getMat());
        root.geo = Object.assign({}, root.geo, v.getGeo());//v.getGeo();
        root.container = v.getContent();
        root.controler = v.getControler();

        root.isRefView = true;
        //if( isInternUpdate ) refView.updateIntern = engine.update;
    },

    getFps()
    {
        return this.t.fps;
    },

    getDelta()
    {
        return this.t.delta;
    },

    getIsFixed()
    {
        return this.option.fixed;
    },

    getKey()
    {
        return this.key;//[0, 0, 0, 0, 0, 0, 0, 0];
    },

    setKey(k)
    {
        this.key = k;
    },

    tell() {},

    log() {},

    post(m, o)
    {
        this.worker.postMessage({m, o});
    },

    reset(full)
    {
        this.stats.skip = 0;

        this.postUpdate = () => {};
        this.pastUpdate = () => {};
        this.prevUpdate = () => {};

        this.isPause = false;
        this.oldMode = this.currentMode;
        this.setMode('');

        this.stop();

        // remove all meshes
        this.clear();

        // remove tmp material
        while (root.tmpMat.length > 0) root.tmpMat.pop().dispose();

        this.tmpRemove = [];
        this.tmpAdd = [];
        this.oldFollow = '';

        if (this.refView) this.refView.reset(full);

        // clear physic object;
        this.post('reset', {full});
    },

    pause()
    {
        this.isPause = true;
    },

    play()
    {
        if (!this.isPause) return;
        this.isPause = false;
        this.start();
    },

    stop()
    {
        if (this.timer === null) return;
        if (this.option.animFrame) window.cancelAnimationFrame(this.timer);
        else clearInterval(this.timer);
        this.timer = null;
    },

    destroy()
    {
        this.worker.terminate();
        this.worker = null;
    },

    ////////////////////////////

    addMat(m)
    {
        root.tmpMat.push(m);
    },

    ellipsoidMesh(o)
    {
        this.softBody.createEllipsoid(o);
    },

    updateTmpMat(envmap, hdr)
    {
        let i = root.tmpMat.length;
        let m;
        while (i--) {
            m = root.tmpMat[i];
            if (m.envMap !== undefined) {
                if (m.type === 'MeshStandardMaterial') m.envMap = envmap;
                else m.envMap = hdr ? null : envmap;
                m.needsUpdate = true;
            }
        }
    },

    setVehicle(o)
    {
        root.flow.vehicle.push(o);
    },

    drive(name)
    {
        this.post('setDrive', name);
    },

    move(name)
    {
        this.post('setMove', name);
    },

    //-----------------------------
    //
    //  DIRECT
    //
    //-----------------------------

    forces(o, direct)
    {
        direct = direct || false;
        this.post(direct ? 'directForces' : 'setForces', o);
    },

    options(o, direct)
    {
        direct = direct || false;
        this.post(direct ? 'directOptions' : 'setOptions', o);
    },

    matrix(o, direct)
    {
        direct = direct || false;
        this.post(direct ? 'directMatrix' : 'setMatrix', o);
    },

    //-----------------------------
    //
    //  FLOW
    //
    //-----------------------------

    clearFlow()
    {
        root.flow = {ray: [], terrain: [], vehicle: []};
    },

    anchor(o)
    {
        this.post('addAnchor', o);
    },

    break(o)
    {
        this.post('addBreakable', o);
    },

    moveSolid(o)
    {
        if (!map.has(o.name)) return;
        let b = map.get(o.name);
        if (o.pos !== undefined) b.position.fromArray(o.pos);
        if (o.quat !== undefined) b.quaternion.fromArray(o.quat);
    },

    getBodies()
    {
        return this.rigidBody.bodies;
    },

    initObject()
    {
        this.rigidBody = new RigidBodyManager();
        this.softBody = new SoftBodyManager();
        this.terrains = new TerrainManager();
        this.vehicles = new VehicleManager();
        this.character = new CharacterManager();
        this.collision = new CollisionManager();
        this.rayCaster = new RayCaster();
        this.constraint = new ConstraintManager();
    },

    //-----------------------------
    //
    //  CLEAR
    //
    //-----------------------------

    clear()
    {
        this.clearFlow();

        this.rigidBody.clear();
        this.collision.clear();
        this.terrains.clear();
        this.vehicles.clear();
        this.character.clear();
        this.softBody.clear();
        this.rayCaster.clear();
        this.constraint.clear();

        while (root.extraGeo.length > 0) root.extraGeo.pop().dispose();
    },

    //-----------------------------
    //
    //  REMOVE
    //
    //-----------------------------

    remove(name, phy)
    {
        // remove physics
        if (!phy) this.post('remove', name);

        let b = this.byName(name);
        if (b === null) return;

        switch (b.type) {
            case 'solid':
            case 'body' :
                this.rigidBody.remove(name);
                break;
            case 'soft' :
                this.softBody.remove(name);
                break;
            case 'terrain' :
                this.terrains.remove(name);
                break;
            case 'collision' :
                this.collision.remove(name);
                break;
            case 'ray' :
                this.rayCaster.remove(name);
                break;
            case 'constraint':
                this.constraint.remove(name);
                break;
        }
    },

    removes(o)
    {
        this.tmpRemove = this.tmpRemove.concat(o);
    },

    removesDirect(o)
    {
        this.post('directRemoves', o);
    },

    //-----------------------------
    //
    //  FIND OBJECT
    //
    //-----------------------------

    byName(name)
    {
        if (!map.has(name)) {
            this.tell(`[Ammo.labs] object ${name} not found!`);
            return null;
        } else return map.get(name);
    },

    //-----------------------------
    //
    //  ADD
    //
    //-----------------------------

    addGroup(list)
    {
        this.tmpAdd = this.tmpAdd.concat(list);
    },

    add(o)
    {
        o = o || {};
        let type = o.type === undefined ? 'box' : o.type;
        let prev = type.substring(0, 4);

        if (prev === 'join')
            return this.constraint.add(o);
        else if (prev === 'soft')
            this.softBody.add(o); // ! no graphics created
        else if (type === 'terrain')
            this.terrains.add(o); // ! no graphics created
        else if (type === 'character')
            return this.character.add(o);
        else if (type === 'collision')
            return this.collision.add(o);
        else if (type === 'car')
            this.vehicles.add(o); // ! no graphics created
        else if (type === 'ray')
            return this.rayCaster.add(o);
        else
            return this.rigidBody.add(o);
    },

    defaultRoot()
    {
        // geometry

        let geo = {
            circle: new CircleBufferGeometry(1, 6),
            plane: new PlaneBufferGeometry(1, 1, 1, 1),
            box: new BoxBufferGeometry(1, 1, 1),
            hardbox: new BoxBufferGeometry(1, 1, 1),
            cone: new CylinderBufferGeometry(0, 1, 0.5),
            wheel: new CylinderBufferGeometry(1, 1, 1, 18),
            sphere: new SphereBufferGeometry(1, 16, 12),
            highsphere: new SphereBufferGeometry(1, 32, 24),
            cylinder: new CylinderBufferGeometry(1, 1, 1, 12, 1),
            hardcylinder: new CylinderBufferGeometry(1, 1, 1, 12, 1),
            joint: new ConeBufferGeometry(0.1, 0.2, 4),
        };

        geo.circle.rotateX(-PI90);
        geo.plane.rotateX(-PI90);
        geo.wheel.rotateZ(-PI90);

        geo.joint.translate(0, 0.1, 0);
        geo.joint.rotateZ(-Math.PI * 0.5);

        root.geo = geo;

        // material

        let wire = false;

        root.mat = {

            hide: new MeshBasicMaterial({
                name: 'debug', color: 0x000000, depthTest: false, depthWrite: false, visible: false
            }),
            move: new MeshLambertMaterial({
                color: 0xCCCCCC, name: 'move', wireframe: wire
            }),
            speed: new MeshLambertMaterial({
                color: 0xFFCC33, name: 'speed', wireframe: wire
            }),
            sleep: new MeshLambertMaterial({
                color: 0x33CCFF, name: 'sleep', wireframe: wire
            }),
            static: new MeshLambertMaterial({
                color: 0xff0000,
                // color: 0x333333,
                name: 'static', wireframe: wire,
                transparent: true,
                opacity: 0.5,
                depthTest: true,
                depthWrite: true
            }),
            kinematic: new MeshLambertMaterial({
                color: 0x88FF33, name: 'kinematic', wireframe: wire
            }),
            soft: new MeshLambertMaterial({
                name: 'soft', vertexColors: true
            }),
            debug: new MeshBasicMaterial({
                name: 'debug', color: 0x00FF00, depthTest: false, depthWrite: false, wireframe: true
            }),
            jointLine: new LineBasicMaterial({
                name: 'jointLine', vertexColors: true, depthTest: false, depthWrite: false, transparent: true
            }),
            jointP1: new MeshBasicMaterial({
                name: 'jointP1', color: 0x00FF00, depthTest: false, depthWrite: true, wireframe: true
            }),
            jointP2: new MeshBasicMaterial({
                name: 'jointP2', color: 0xFFFF00, depthTest: false, depthWrite: true, wireframe: true
            }),
        };

        root.container = new Group();

        root.destroy = function(b)
        {
            let m;
            while (b.children.length > 0) {
                m = b.children.pop();
                while (m.children.length > 0) m.remove(m.children.pop());
                b.remove(m);
            }

            if (b.parent) b.parent.remove(b);
        };
    },

    getContainer()
    {
        return root.container;
    },

    //-----------------------------
    //
    //  BREAKABLE
    //
    //-----------------------------

    makeBreak(o)
    {
        var name = o.name;
        if (!map.has(name)) return;

        if (this.convexBreaker === null) this.convexBreaker = new ConvexObjectBreaker();

        let mesh = map.get(name);

        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
        let breakOption = o.breakOption;

        var debris = this.convexBreaker.subdivideByImpact(mesh, o.pos, o.normal, breakOption[1], breakOption[2]); // , 1.5 ??
        // remove one level
        breakOption[3] -= 1;

        // remove original object
        this.tmpRemove.push(name);

        let i = debris.length;
        while (i--) this.tmpAdd.push(this.addDebris(name, i, debris[i], breakOption));
    },

    addDebris(name, id, mesh, breakOption)
    {
        let o = {
            name: `${name}_debris${id}`,
            material: mesh.material,
            type: 'convex',
            shape: mesh.geometry,
            //size: mesh.scale.toArray(),
            pos: mesh.position.toArray(),
            quat: mesh.quaternion.toArray(),
            mass: mesh.userData.mass,
            linearVelocity: mesh.userData.velocity.toArray(),
            angularVelocity: mesh.userData.angularVelocity.toArray(),
            margin: 0.05,
        };

        // if levelOfSubdivision > 0 make debris breakable!!
        if (breakOption[3] > 0) {
            o.breakable = true;
            o.breakOption = breakOption;
        }

        // this.add(o);

        return o;
    },

    //-----------------------------
    //
    // CAMERA MODES, FOR REFERENCE
    //
    //-----------------------------

    setMode(mode)
    {
        if (mode !== this.currentMode) {
            if (this.currentMode === 'picker') this.removeRayCamera();
            if (this.currentMode === 'shoot') this.removeShootCamera();
            if (this.currentMode === 'lock') this.removeLockCamera();
        }

        this.currentMode = mode;

        if (this.currentMode === 'picker') this.addRayCamera();
        if (this.currentMode === 'shoot') this.addShootCamera();
        if (this.currentMode === 'lock') this.addLockCamera();
    },

    // Unsupported

    addLockCamera() {},

    removeLockCamera() {},

    addShootCamera() {},

    removeShootCamera() {},

    // CAMERA RAY

    addRayCamera()
    {
        if (!this.refView) return;

        this.ray = this.add({
            name: 'cameraRay',
            type: 'ray',
            callback: this.onRay,
            mask: 1,
            visible: false
        });// only move body
        this.refView.activeRay(this.updateRayCamera, false);
    },

    removeRayCamera()
    {
        if (!this.refView) return;
        this.remove('cameraRay');
        this.refView.removeRay();
        this.log();
    },

    updateRayCamera(offset)
    {
        //ray.setFromCamera( refView.getMouse(), refView.getCamera() );
        if (this.mouseMode === 'drag')
            this.matrix([
                { name: 'dragger', pos: offset.toArray(), keepRot: true }
            ]);
    },

    onRay(o)
    {
        let refView = this.refView;
        let mouse = refView.getMouse();
        let control = refView.getControls();
        let name = o.name === undefined ? '' : o.name;

        this.ray.setFromCamera(mouse, control.object);

        if (mouse.z === 0) {
            if (this.mouseMode === 'drag') {
                control.enableRotate = true;
                this.removeConnector();
            }
            this.mouseMode = 'free';
        } else {
            if (this.mouseMode === 'free') {
                if (name) {
                    if (this.mouseMode !== 'drag') {
                        refView.setDragPlane(o.point);
                        control.enableRotate = false;
                        this.addConnector(o);
                        this.mouseMode = 'drag';
                    }
                } else {
                    this.mouseMode = 'rotate';
                }
            }

            // if (this.mouseMode === 'drag' ){
            //     this.matrix( [{ name:'dragger', pos: this.refView.getOffset().toArray() }] );
            // }
        }

        // debug
        this.log(`${this.mouseMode}   ${name}`);
    },

    addConnector(o)
    {
        let mesh = this.byName(o.name);
        if (!mesh) return;

        // reste follow on drag
        this.testCurrentFollow(o.name);

        let p0 = new Vector3().fromArray(o.point);
        let qB = mesh.quaternion.toArray();
        let pos = this.getLocalPoint(p0, mesh).toArray();

        this.add({
            name: 'dragger',
            type: 'sphere',
            size: [0.2],
            pos: o.point,
            quat: qB,
            mass: 0,
            kinematic: true,
            group: 32,
            mask: 32,
        });

        this.add({
            name: 'connector',
            type: 'joint_fixe',
            b1: 'dragger', b2: o.name,
            pos1: [0, 0, 0], pos2: pos,
            collision: false
        });
    },

    removeConnector()
    {
        this.remove('dragger');
        this.remove('connector');

        if (this.oldFollow !== '') this.setCurrentFollow(this.oldFollow);
    },

    getLocalPoint(vector, mesh)
    {
        mesh.updateMatrix();
        // mesh.updateMatrixWorld(true);
        let m1 = new Matrix4();
        let s = new Vector3(1, 1, 1);
        let m0 = new Matrix4().compose(mesh.position, mesh.quaternion, s);
        m1.copy(m0).invert();
        return vector.applyMatrix4(m1);
    },

    setCurrentFollow(name, o)
    {
        let refView = this.refView;
        if (!this.refView) return;
        let target = this.byName(name);
        if (target !== null) refView.getControls().initFollow(target, o);
        else refView.getControls().resetFollow();
        this.oldFollow = '';
    },

    testCurrentFollow(name)
    {
        this.oldFollow = '';
        let refView = this.refView;
        if (!refView) return;
        if (!refView.getControls().followTarget) return;
        if (refView.getControls().followTarget.name === name) {
            refView.getControls().resetFollow();
            this.oldFollow = name;
        }
    },
});

export { AmmoWrapper };
