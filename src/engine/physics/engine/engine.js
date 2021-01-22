
import Worker from '../worker/engine.worker';
import { RigidBody }           from './RigidBody.js';
import { Constraint }          from './Constraint.js';
import { SoftBody }            from './SoftBody.js';
import { Terrain }             from './Terrain.js';
import { Vehicle }             from './Vehicle.js';
import { Character }           from './Character.js';
import { Collision }           from './Collision.js';
import { RayCaster }           from './RayCaster.js';
import { ConvexObjectBreaker } from './ConvexObjectBreaker.js';
import { map, REVISION, root }                                                                                                                                               from './root.js';
import {
    BoxBufferGeometry,
    CircleBufferGeometry, ConeBufferGeometry,
    CylinderBufferGeometry, Group,
    LineBasicMaterial,
    Matrix4,
    MeshBasicMaterial,
    MeshLambertMaterial,
    PlaneBufferGeometry,
    SphereBufferGeometry,
    Vector3, VertexColors
} from 'three';

var worker;
var callback;
var blob = null;

var URL = window.URL || window.webkitURL;
var Time = typeof performance === 'undefined' ? Date : performance;
var t = {now: 0, delta: 0, then: 0, deltaTime: 0, inter: 0, tmp: 0, n: 0, timerate: 0, steptime: 0};

var timer = null;

var refView = null;

var isBuffer = false;
var isPause = false;
var stepNext = false;

var currentMode = '';
var oldMode = '';

var PI90 = Math.PI * 0.5;

var rigidBody;
var softBody;
var terrains;
var vehicles;
var character;
var collision;
var rayCaster;
var constraint;

var convexBreaker = null;
var ray = null;
var mouseMode = 'free';

var tmpRemove = [];
var tmpAdd = [];

var oldFollow = '';

var stats = {skip: 0, };

var isInternUpdate = false;
//var isRequestAnimationFrame = false;

var option = {

    worldscale: 1,
    gravity: [0, -10, 0],
    fps: 60,

    substep: 2,
    broadphase: 2,
    soft: true,

    animFrame: true,
    fixed: true,
    jointDebug: false,

};

let engine = {

    folder: './build/',

    message(e)
    {
        var data = e.data;
        if (data.Ar) root.Ar = data.Ar;
        if (data.flow) root.flow = data.flow;

        switch (data.m) {
            case 'initEngine':
                engine.initEngine();
                break;
            case 'start':
                engine.start();
                break;
            case 'step':
                engine.step(data.fps, data.delta);
                break;

            case 'moveSolid':
                engine.moveSolid(data.o);
                break;
            case 'ellipsoid':
                engine.ellipsoidMesh(data.o);
                break;

            case 'makeBreak':
                engine.makeBreak(data.o);
                break;
        }
    },

    init(Callback, Type, Option, Counts)
    {
        this.initArray(Counts);
        this.defaultRoot();

        Option = Option || {};

        callback = Callback;

        isInternUpdate = Option.use_intern_update || false;

        option = {
            fps: Option.fps || 60,
            worldscale: Option.worldscale || 1,
            gravity: Option.gravity || [0, -10, 0],
            substep: Option.substep || 2,
            broadphase: Option.broadphase || 2,
            soft: Option.soft !== undefined ? Option.soft : true,
            //penetration: Option.penetration || 0.0399,

            fixed: Option.fixed !== undefined ? Option.fixed : true,
            animFrame: Option.animFrame !== undefined ? Option.animFrame : true,

            jointDebug: Option.jointDebug !== undefined ? Option.jointDebug : false,

            isInternUpdate,
        };

        t.timerate = 1 / option.fps * 1000;
        //t.autoFps = option.autoFps;

        // type = Type || 'LZMA';
        let type = 'wasm';

        switch (type)
        {
            case 'WASM':
            case 'wasm':
                blob = `${document.location.href.replace(/\/[^/]*$/, '/') + engine.folder}ammo.wasm.js`;
                engine.startWorker();
                break;

            case 'BASIC':
            case 'basic':
                blob = `${document.location.href.replace(/\/[^/]*$/, '/') + engine.folder}ammo.js`;
                engine.startWorker();
                break;
        }
    },

    set(o)
    {
        o = o || option;
        t.timerate = o.fps !== undefined ? 1 / o.fps * 1000 : t.timerate;
        //t.autoFps = o.autoFps !== undefined ? o.autoFps : false;

        option.fixed = o.fixed || false;
        option.animFrame = o.animFrame || false;
        option.jointDebug = o.jointDebug || false;

        o.isInternUpdate = isInternUpdate;

        root.constraintDebug = option.jointDebug;

        this.post('set', o);
    },

    startWorker()//isMin)
    {
        // isMin = isMin || false;
        //blob = document.location.href.replace(/\/[^/]*$/,"/") + "./build/ammo.js" ;
        // worker = new Worker(engine.folder + (isMin ? 'gun.min.js' : 'gun.js'));
        worker = new Worker();


        worker.postMessage = worker.webkitPostMessage || worker.postMessage;
        worker.onmessage = engine.message;

        // test transferrables
        var ab = new ArrayBuffer(1);
        worker.postMessage({m: 'test', ab}, [ab]);
        isBuffer = !ab.byteLength;

        if (isInternUpdate) isBuffer = false;

        // start engine worker
        engine.post('init', {blob, ArPos: root.ArPos, ArMax: root.ArMax, isBuffer, option});
        root.post = engine.post;
    },

    initArray(Counts)
    {
        Counts = Counts || {};

        var counts = {
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

        root.ArMax = root.ArLng[0] + root.ArLng[1] + root.ArLng[2] + root.ArLng[3] + root.ArLng[4] + root.ArLng[5];
    },

    initEngine()
    {
        URL.revokeObjectURL(blob);
        blob = null;

        this.initObject();

        console.log(`SHOTGUN ${REVISION} | ${isBuffer ? 'buffer' : 'no buffer'} | wasm`);

        if (callback) callback();
    },

    start(noAutoUpdate)
    {
        if (isPause) return;

        engine.stop();

        //console.log('start', t.timerate );

        stepNext = true;

        // create tranfere array if buffer
        if (isBuffer) root.Ar = new Float32Array(root.ArMax);

        //engine.sendData( 0 );

        t.then = Time.now();


        if (!noAutoUpdate && !isInternUpdate) {
            timer = option.animFrame ? requestAnimationFrame(engine.sendData) : setInterval(function()
            {
                engine.sendData();
            }, t.timerate);

            //console.log( option.animFrame )
        }

        if (!noAutoUpdate && isInternUpdate) { //engine.sendStep();
            var key = engine.getKey();
            worker.postMessage({m: 'internStep', o: {steptime: t.steptime, key}, flow: root.flow, Ar: root.Ar});
        }

        // test ray
        engine.setMode(oldMode);
    },

    prevUpdate()
    {
    },
    postUpdate()
    {
    },
    pastUpdate()
    {
    },

    update()
    {
        engine.postUpdate(t.delta);

        rigidBody.step(root.Ar, root.ArPos[0]);
        collision.step(root.Ar, root.ArPos[1]);
        character.step(root.Ar, root.ArPos[2]);
        vehicles.step(root.Ar, root.ArPos[3]);
        softBody.step(root.Ar, root.ArPos[4]);
        constraint.step(root.Ar, root.ArPos[5]);

        terrains.step();

        rayCaster.step();

        engine.pastUpdate(t.delta);
    },

    step(fps, delta)
    {
        //t.now = Time.now();

        //var start = Time.now();

        if (isInternUpdate) {
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

        engine.tell();
        engine.update();

        if (root.controler) root.controler.follow();

        engine.stepRemove();
        engine.stepAdd();

        //t.steptime = (Time.now() - t.now) * 0.001; // millisecond

        stepNext = true;

        if (isInternUpdate) {
            engine.sendStep();
        }
    },

    sendData(stamp)
    {
        if (isInternUpdate) return;

        if (refView) if (refView.pause) {
            engine.stop();
            return;
        }

        if (option.animFrame) {
            timer = requestAnimationFrame(engine.sendData);
            //if ( !stepNext ) return;
            t.now = stamp === undefined ? Time.now() : stamp;
            t.deltaTime = t.now - t.then;
            t.delta = t.deltaTime * 0.001;

            if (t.deltaTime > t.timerate) {
                t.then = t.now - t.deltaTime % t.timerate;

                engine.sendStep();
            }
        } else {
            if (!stepNext) {
                stats.skip++;
                return;
            }

            //t.delta = ( t.now - Time.now() ) * 0.001;

            t.delta = (t.now - t.then) * 0.001;
            t.then = t.now;

            //t.now = Time.now();
            //t.delta = ( t.now - t.then ) * 0.001;

            //t.delta -= t.steptime;

            //console.log(t.delta)
            //t.then = t.now;
            //

            engine.sendStep();
        }
    },

    sendStep()
    {
        if (!stepNext) return;

        t.now = Time.now();
        //t.delta = ( t.now - t.then ) * 0.001;
        //t.then = t.now;

        engine.prevUpdate(t.delta);

        var key = engine.getKey();

        // timeStep < maxSubSteps * fixedTimeStep if you don't want to lose time.

        if (isInternUpdate) {
            if (isBuffer) worker.postMessage({m: 'internStep', o: {steptime: t.steptime, key}, flow: root.flow, Ar: root.Ar}, [root.Ar.buffer]);
            //else worker.postMessage( { m: 'internStep', o: {  steptime:t.steptime, key:key }, flow: root.flow, Ar: root.Ar } );
        } else {
            if (isBuffer) worker.postMessage({m: 'step', o: {delta: t.delta, key}, flow: root.flow, Ar: root.Ar}, [root.Ar.buffer]);
            else worker.postMessage({m: 'step', o: {delta: t.delta, key}, flow: root.flow, Ar: root.Ar});
        }

        stepNext = false;
    },

    simpleStep(delta)
    {
        var key = engine.getKey();
        worker.postMessage({m: 'step', o: {delta, key}});
    },

    /////////

    stepRemove()
    {
        if (tmpRemove.length === 0) return;
        this.post('setRemove', tmpRemove);
        while (tmpRemove.length > 0) this.remove(tmpRemove.pop(), true);
    },

    stepAdd()
    {
        if (tmpAdd.length === 0) return;
        //this.post( 'setAdd', tmpAdd );
        while (tmpAdd.length > 0) this.add(tmpAdd.shift());
    },

    setView(v)
    {
        refView = v;
        root.mat = Object.assign({}, root.mat, v.getMat());
        root.geo = Object.assign({}, root.geo, v.getGeo());//v.getGeo();
        root.container = v.getContent();
        root.controler = v.getControler();

        root.isRefView = true;

        //if( isInternUpdate ) refView.updateIntern = engine.update;
    },

    getFps()
    {
        return t.fps;
    },
    getDelta()
    {
        return t.delta;
    },
    getIsFixed()
    {
        return option.fixed;
    },
    getKey()
    {
        return [0, 0, 0, 0, 0, 0, 0, 0];
    },

    tell()
    {
    },
    log()
    {
    },

    post(m, o)
    {
        worker.postMessage({m, o});
    },

    reset(full)
    {
        stats.skip = 0;

        //console.log('reset', full);

        engine.postUpdate = function()
        {
        };
        engine.pastUpdate = function()
        {
        };
        engine.prevUpdate = function()
        {
        };

        isPause = false;

        oldMode = currentMode;
        engine.setMode('');

        engine.stop();

        // remove all mesh
        engine.clear();

        // remove tmp material
        while (root.tmpMat.length > 0) root.tmpMat.pop().dispose();

        tmpRemove = [];
        tmpAdd = [];
        oldFollow = '';

        if (refView) refView.reset(full);

        // clear physic object;
        engine.post('reset', {full});
    },

    pause()
    {
        isPause = true;
    },

    play()
    {
        if (!isPause) return;
        isPause = false;
        engine.start();
    },

    stop()
    {
        if (timer === null) return;

        if (option.animFrame) window.cancelAnimationFrame(timer);
        else clearInterval(timer);

        timer = null;
    },

    destroy()
    {
        worker.terminate();
        worker = undefined;
    },

    ////////////////////////////

    addMat(m)
    {
        root.tmpMat.push(m);
    },

    ellipsoidMesh(o)
    {
        softBody.createEllipsoid(o);
    },

    updateTmpMat(envmap, hdr)
    {
        var i = root.tmpMat.length;
        var m;
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

    // if( o.constructor !== Array ) o = [ o ];

    forces(o, direct)
    {
        direct = direct || false;
        engine.post(direct ? 'directForces' : 'setForces', o);
    },

    options(o, direct)
    {
        direct = direct || false;
        engine.post(direct ? 'directOptions' : 'setOptions', o);
    },

    matrix(o, direct)
    {
        direct = direct || false;
        engine.post(direct ? 'directMatrix' : 'setMatrix', o);
    },

    //-----------------------------
    //
    //  FLOW
    //
    //-----------------------------

    clearFlow()
    {
        root.flow = {ray: [], terrain: [], vehicle: []};
        //root.flow = { matrix:{}, force:{}, option:{}, ray:[], terrain:[], vehicle:[] };
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
        var b = map.get(o.name);
        if (o.pos !== undefined) b.position.fromArray(o.pos);
        if (o.quat !== undefined) b.quaternion.fromArray(o.quat);
    },

    getBodys()
    {
        return rigidBody.bodys;
    },

    initObject()
    {
        rigidBody = new RigidBody();
        softBody = new SoftBody();
        terrains = new Terrain();
        vehicles = new Vehicle();
        character = new Character();
        collision = new Collision();
        rayCaster = new RayCaster();
        constraint = new Constraint();
    },

    //-----------------------------
    //
    //  CLEAR
    //
    //-----------------------------

    clear()
    {
        engine.clearFlow();

        rigidBody.clear();
        collision.clear();
        terrains.clear();
        vehicles.clear();
        character.clear();
        softBody.clear();
        rayCaster.clear();
        constraint.clear();

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

        //if ( ! map.has( name ) ) return;
        var b = engine.byName(name);
        if (b === null) return;

        switch (b.type) {
            case 'solid':
            case 'body' :
                rigidBody.remove(name);
                break;

            case 'soft' :
                softBody.remove(name);
                break;

            case 'terrain' :
                terrains.remove(name);
                break;

            case 'collision' :
                collision.remove(name);
                break;

            case 'ray' :
                rayCaster.remove(name);
                break;

            case 'constraint':
                constraint.remove(name);
                break;
        }
    },

    removes(o)
    {
        tmpRemove = tmpRemove.concat(o);
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
            engine.tell('no find object !!');
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
        tmpAdd = tmpAdd.concat(list);
    },

    add(o)
    {
        o = o || {};
        var type = o.type === undefined ? 'box' : o.type;
        var prev = type.substring(0, 4);

        if (prev === 'join') return constraint.add(o);
        else if (prev === 'soft') softBody.add(o);
        else if (type === 'terrain') terrains.add(o);
        else if (type === 'character') return character.add(o);
        else if (type === 'collision') return collision.add(o);
        else if (type === 'car') vehicles.add(o);
        else if (type === 'ray') return rayCaster.add(o);
        else return rigidBody.add(o);
    },

    defaultRoot()
    {
        // geometry

        var geo = {
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

        var wire = false;
        // var shadowSide = false;

        root.mat = {

            hide: new MeshBasicMaterial({
                name: 'debug', color: 0x000000, depthTest: false, depthWrite: false, visible: false
            }),
            move: new MeshLambertMaterial({
                color: 0xCCCCCC, name: 'move', wireframe: wire// , shadowSide: shadowSide
            }),
            speed: new MeshLambertMaterial({
                color: 0xFFCC33, name: 'speed', wireframe: wire//, shadowSide: shadowSide
            }),
            sleep: new MeshLambertMaterial({
                color: 0x33CCFF, name: 'sleep', wireframe: wire//, shadowSide: shadowSide
            }),
            static: new MeshLambertMaterial({
                color: 0x333333, name: 'static', wireframe: wire, //, shadowSide: shadowSide,
                transparent: true, opacity: 0.3, depthTest: true, depthWrite: false
            }),
            kinematic: new MeshLambertMaterial({
                color: 0x88FF33, name: 'kinematic', wireframe: wire//, shadowSide: shadowSide
            }),
            soft: new MeshLambertMaterial({
                name: 'soft', vertexColors: VertexColors//, shadowSide: shadowSide
            }),
            debug: new MeshBasicMaterial({
                name: 'debug', color: 0x00FF00, depthTest: false, depthWrite: false, wireframe: true//, shadowSide: shadowSide
            }),
            jointLine: new LineBasicMaterial({
                name: 'jointLine', vertexColors: VertexColors, depthTest: false, depthWrite: false, transparent: true
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
            var m;
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

        if (convexBreaker === null) convexBreaker = new ConvexObjectBreaker();

        var mesh = map.get(name);


        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
        var breakOption = o.breakOption;

        var debris = convexBreaker.subdivideByImpact(mesh, o.pos, o.normal, breakOption[1], breakOption[2]); // , 1.5 ??
        // remove one level
        breakOption[3] -= 1;


        // remove original object
        tmpRemove.push(name);

        var i = debris.length;
        while (i--) tmpAdd.push(this.addDebris(name, i, debris[i], breakOption));

        //while ( i -- ) this.addDebris( name, i, debris[ i ], breakOption );
    },

    addDebris(name, id, mesh, breakOption)
    {
        var o = {
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

        // if levelOfSubdivision > 0 make debris breakable !!
        if (breakOption[3] > 0) {
            o.breakable = true;
            o.breakOption = breakOption;
        }

        //this.add( o );

        return o;
    },

    //-----------------------------
    //
    // EXTRA MODE
    //
    //-----------------------------

    setMode(mode)
    {
        if (mode !== currentMode) {
            if (currentMode === 'picker') engine.removeRayCamera();
            if (currentMode === 'shoot') engine.removeShootCamera();
            if (currentMode === 'lock') engine.removeLockCamera();
        }

        currentMode = mode;

        if (currentMode === 'picker') engine.addRayCamera();
        if (currentMode === 'shoot') engine.addShootCamera();
        if (currentMode === 'lock') engine.addLockCamera();
    },

    // CAMERA LOCK

    addLockCamera()
    {

    },

    removeLockCamera()
    {

    },

    // CAMERA SHOOT

    addShootCamera()
    {

    },

    removeShootCamera()
    {

    },

    // CAMERA RAY

    addRayCamera()
    {
        if (!refView) return;

        ray = engine.add({name: 'cameraRay', type: 'ray', callback: engine.onRay, mask: 1, visible: false});// only move body
        refView.activeRay(engine.updateRayCamera, false);
    },

    removeRayCamera()
    {
        if (!refView) return;
        engine.remove('cameraRay');
        refView.removeRay();
        engine.log();
    },

    updateRayCamera(offset)
    {
        //ray.setFromCamera( refView.getMouse(), refView.getCamera() );
        if (mouseMode === 'drag') engine.matrix([{name: 'dragger', pos: offset.toArray(), keepRot: true}]);
    },

    onRay(o)
    {
        var mouse = refView.getMouse();
        var control = refView.getControls();
        var name = o.name === undefined ? '' : o.name;

        ray.setFromCamera(mouse, control.object);

        if (mouse.z === 0) {
            if (mouseMode === 'drag') {
                control.enableRotate = true;
                engine.removeConnector();
            }

            mouseMode = 'free';
        } else {
            if (mouseMode === 'free') {
                if (name) {
                    if (mouseMode !== 'drag') {
                        refView.setDragPlane(o.point);
                        control.enableRotate = false;
                        engine.addConnector(o);
                        mouseMode = 'drag';
                    }
                } else {
                    mouseMode = 'rotate';
                }
            }

            /*if ( mouseMode === 'drag' ){

                physic.matrix( [{ name:'dragger', pos: refView.getOffset().toArray() }] );

            }*/
        }

        // debug
        engine.log(`${mouseMode}   ${name}`);
    },

    addConnector(o)
    {
        //if ( ! map.has( o.name ) ) { console.log('no find !!'); return;}
        //var mesh = map.get( o.name );

        var mesh = engine.byName(o.name);
        if (mesh === null) return;

        // reste follow on drag
        engine.testCurrentFollow(o.name);


        var p0 = new Vector3().fromArray(o.point);
        var qB = mesh.quaternion.toArray();
        var pos = engine.getLocalPoint(p0, mesh).toArray();

        engine.add({
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

        engine.add({
            name: 'connector',
            type: 'joint_fixe',
            b1: 'dragger', b2: o.name,
            pos1: [0, 0, 0], pos2: pos,
            collision: false
        });
    },

    removeConnector()
    {
        engine.remove('dragger');
        engine.remove('connector');

        if (oldFollow !== '') engine.setCurrentFollow(oldFollow);
    },

    getLocalPoint(vector, mesh)
    {
        mesh.updateMatrix();
        //mesh.updateMatrixWorld(true);
        var m1 = new Matrix4();
        var s = new Vector3(1, 1, 1);
        var m0 = new Matrix4().compose(mesh.position, mesh.quaternion, s);
        m1.getInverse(m0);
        return vector.applyMatrix4(m1);
    },

    setCurrentFollow(name, o)
    {
        if (!refView) return;
        var target = engine.byName(name);
        if (target !== null) refView.getControls().initFollow(target, o);
        else refView.getControls().resetFollow();
        oldFollow = '';
    },


    testCurrentFollow(name)
    {
        oldFollow = '';
        if (!refView) return;
        if (!refView.getControls().followTarget) return;
        if (refView.getControls().followTarget.name === name) {
            refView.getControls().resetFollow();
            oldFollow = name;
        }
    },
};

export { engine };

// return engine;
//
// })();
