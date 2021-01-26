
/* global Ammo */

import { math }      from './math.js';
import { map, root } from './root.js';

function Vehicle()
{
    this.ID = 0;
    this.cars = [];
    this.trans = new Ammo.btTransform();
}

Object.assign(Vehicle.prototype, {

    step(AR, N)
    {
        var i = root.flow.vehicle.length;
        while (i--) this.setData(root.flow.vehicle[i]);
        root.flow.vehicle = [];

        var n;
        var trans = this.trans;

        this.cars.forEach(function(car, id)
        {
            n = N + id * 64;
            car.step(AR, n, trans);
        });
    },

    control(name)
    {
        if (!map.has(name)) return;
        var car = map.get(`${name}_constuctor`);

        car.drive(root.key);
    },

    clear()
    {
        while (this.cars.length > 0) this.destroy(this.cars.pop());
        this.ID = 0;
    },

    destroy(car)
    {
        root.world.removeRigidBody(car.body);
        root.world.removeAction(car.chassis);
        Ammo.destroy(car.body);
        Ammo.destroy(car.chassis);

        map.delete(`${car.name}_constuctor`);
        map.delete(car.name);
        map.delete(`${car.name}_chassis`);
    },

    remove(name)
    {
        if (!map.has(name)) return;
        var car = map.get(name);

        var n = this.cars.indexOf(car);
        if (n !== -1) {
            this.cars.splice(n, 1);
            this.destroy(car);
        }
    },

    setData(o)
    {
        if (!map.has(`${o.name}_constuctor`)) return;
        var car = map.get(`${o.name}_constuctor`);
        car.setData(o);
    },

    add(o)
    {
        var name = o.name !== undefined ? o.name : `car${this.ID++}`;

        // delete old if same name
        this.remove(name);

        o.size = o.size === undefined ? [2, 0.5, 4] : o.size;

        if (o.pos !== undefined) o.pos = math.vectomult(o.pos, root.invScale);
        if (o.size !== undefined) o.size = math.vectomult(o.size, root.invScale);
        if (o.masscenter !== undefined) o.masscenter = math.vectomult(o.masscenter, root.invScale);

        // car shape
        var shapeType = o.shapeType || 'box';
        var shapeInfo = {};

        if (shapeType === 'mesh') shapeInfo = {type: 'mesh', v: o.v, mass: 1};
        else if (shapeType === 'convex') shapeInfo = {type: 'convex', v: o.v};
        else shapeInfo = {type: 'box', size: o.size};

        var shape = root.makeShape(shapeInfo);

        if (o.v !== undefined) delete o.v;

        var car = new Car(name, o, shape);

        root.world.addAction(car.chassis);
        root.world.addRigidBody(car.body);

        this.cars.push(car);

        map.set(`${name}_constuctor`, car);
        map.set(name, car.body);
        map.set(`${name}_chassis`, car.chassis);
    },

    applyOption()//car, o)
    {
        // To be implemented. (?)
    },

});


export { Vehicle };


function Car(name, o, shape)
{
    // http://www.asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
    // https://github.com/yanzuzu/BulletPhysic_Vehicle
    // https://docs.google.com/document/d/18edpOwtGgCwNyvakS78jxMajCuezotCU_0iezcwiFQc/edit

    this.name = name;

    this.chassis = null;
    this.body = null;
    this.steering = 0;
    this.breaking = 0;
    this.motor = 0;

    this.gearRatio = [-1, 0, 2.3, 1.8, 1.3, 0.9, 0.5];
    // acceleration / topSpeed

    this.limitAngular = [1, 1, 1];

    this.transforms = [];

    this.wheelBody = [];
    this.wheelJoint = [];
    this.wheelRadius = [];

    this.isRay = true;

    this.data = {

        mass: 100,
        wMass: 1,
        // wheels
        wWidth: 0.25,
        nWheel: o.nWheel || 4,
        wPos: [1, 0, 1.6], // wheels position on chassis
        // drive setting
        engine: 1000,
        acceleration: 10,
        maxSteering: 24 * math.torad, //Math.PI/6,
        breaking: 100,
        incSteering: 0.04,

        // position / rotation / size
        pos: [0, 0, 0],
        quat: [0, 0, 0, 1],
        // local center of mass (best is on chassis bottom)
        masscenter: [0, -0.6, 0],
        // car body physics
        friction: 0.6,
        restitution: 0.1,
        linear: 0,
        angular: 0,
        rolling: 0,
        // auto compess
        autoSuspension: false,
        compValue: 0.2, //(lower than damp!)
        dampValue: 0.3,
        // suspension
        s_stiffness: 20,
        s_compression: 2.3,
        s_damping: 4.4, //2.4
        s_travel: 5,
        s_force: 6000,
        s_length: 0.2,
        // wheel
        w_friction: 10.5, //1000,
        w_roll: 0.001,

    };

    this.init(o, shape);
}

Object.assign(Car.prototype, {

    step(Ar, n, trans)
    {
        var scale = root.scale;

        // speed km/h
        Ar[n] = this.chassis.getCurrentSpeedKmHour();

        this.body.getMotionState().getWorldTransform(trans);
        trans.toArray(Ar, n + 1, scale);

        var j = this.data.nWheel;
        var w;
        var t;

        while (j--) {
            this.chassis.updateWheelTransform(j, true);

            t = this.chassis.getWheelTransformWS(j);

            // supension info
            Ar[n + 56 + j] = this.chassis.getWheelInfo(j).get_m_raycastInfo().get_m_suspensionLength() * scale;

            w = 8 * (j + 1);
            t.toArray(Ar, n + w + 1, scale);

            if (j === 0) Ar[n + w] = this.chassis.getWheelInfo(0).get_m_steering();
            if (j === 1) Ar[n + w] = this.chassis.getWheelInfo(1).get_m_steering();
            if (j === 2) Ar[n + w] = this.steering;//this.chassis.getWheelInfo( 0 ).get_m_steering();
        }

        Ar[n + 62] = this.chassis.getWheelInfo(0).m_rotation;
        Ar[n + 63] = this.chassis.getWheelInfo(1).m_rotation;
    },

    drive(key)
    {
        var data = this.data;

        // steering
        if (key[0] === 0) this.steering *= 0.9;
        else this.steering -= data.incSteering * key[0];
        this.steering = math.clamp(this.steering, -data.maxSteering, data.maxSteering);

        // engine
        if (key[1] === 0) {
            this.motor = 0;
            this.breaking = data.breaking;
        } else {
            this.motor -= data.acceleration * key[1];
            this.breaking = 0;
        }

        this.motor = math.clamp(this.motor, -data.engine, data.engine);

        // Ackermann steering principle
        if (data.nWheel > 3) {
            var lng = this.wpos[2] * 2;
            var w = this.wpos[0];
            var turn_point = lng / Math.tan(this.steering);

            var angle_l = Math.atan2(lng, w + turn_point);
            var angle_r = Math.atan2(lng, -w + turn_point);
            if (turn_point < 0) {
                angle_l -= Math.PI;
                angle_r -= Math.PI;
            }
        }

        var i = data.nWheel;
        while (i--) {
            if (data.nWheel < 4) {
                if (i === 0) this.chassis.setSteeringValue(this.steering, i);
            } else {
                if (i === 0) this.chassis.setSteeringValue(angle_r, i);
                if (i === 1) this.chassis.setSteeringValue(angle_l, i);
            }

            this.chassis.applyEngineForce(this.motor, i);
            this.chassis.setBrake(this.breaking, i);
        }

        if (this.motor < 1) {
            var v = this.body.getAngularVelocity();
            v.multiplyArray(this.limitAngular);
            this.body.setAngularVelocity(v);
        }
    },

    clear()
    {
        // this.world.removeRigidBody( this.body );
        // this.world.removeAction( this.chassis );
        // Ammo.destroy( this.body );
        // Ammo.destroy( this.chassis );

        this.body = null;
        this.chassis = null;
    },

    init(o, shape)
    {
        var data = this.data;

        var trans = math.transform();
        var p0 = math.vector3();
        var p1 = math.vector3();
        var p2 = math.vector3();
        var p3 = math.vector3();

        this.isRay = o.isRay === undefined ? true : o.isRay;

        data.mass = o.mass === undefined ? 800 : o.mass;
        o.masscenter = o.masscenter === undefined ? [0, 0, 0] : o.masscenter;
        data.pos = o.pos === undefined ? [0, 0, 0] : o.pos;
        data.quat = o.quat === undefined ? [0, 0, 0, 1] : o.quat;
        data.nWheel = o.nWheel || 4;

        // car shape

        // move center of mass
        p0.fromArray(o.masscenter).negate();
        trans.setIdentity();
        trans.setOrigin(p0);
        var compound = new Ammo.btCompoundShape();
        compound.addChildShape(trans, shape);

        // position rotation of car
        trans.identity().fromArray(data.pos.concat(data.quat));

        // mass of vehicle in kg
        p0.setValue(0, 0, 0);
        compound.calculateLocalInertia(data.mass, p0);
        var motionState = new Ammo.btDefaultMotionState(trans);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(data.mass, motionState, compound, p0);

        // car body
        this.body = new Ammo.btRigidBody(rbInfo);
        this.body.name = this.name;
        this.body.isRigidBody = true;
        this.body.isBody = true;

        this.body.setActivationState(4);

        Ammo.destroy(rbInfo);

        if (this.isRay) {
            var tuning = new Ammo.btVehicleTuning();
            var vehicleRay = new Ammo.btDefaultVehicleRaycaster(root.world);
            this.chassis = new Ammo.btRaycastVehicle(tuning, this.body, vehicleRay);
            this.chassis.setCoordinateSystem(0, 1, 2);
        }

        // wheels

        var radius = o.radius || 0.4;
        var radiusBack = o.radiusBack || radius;
        var wPos = o.wPos || [1, 0, 1.6];

        wPos = math.vectomult(wPos, root.invScale);
        radius = radius * root.invScale;
        radiusBack = radiusBack * root.invScale;

        wPos[1] -= o.masscenter[1];

        var n = data.nWheel;
        var p;
        var fw;
        var by = o.decalYBack || 0;

        for (var i = 0; i < n; i++)
        {
            if (i === 0) {
                p = [wPos[0], wPos[1], wPos[2]];
                fw = true;
            }
            if (i === 1) {
                p = [-wPos[0], wPos[1], wPos[2]];
                fw = true;
            }
            if (i === 2) {
                p = [-wPos[0], wPos[1] + by, -wPos[2]];
                fw = false;
            }
            if (i === 3) {
                p = [wPos[0], wPos[1] + by, -wPos[2]];
                fw = false;
            }
            if (i === 4) {
                p = [-wPos[0], wPos[1] + by, -wPos[3]];
                fw = false;
            }
            if (i === 5) {
                p = [wPos[0], wPos[1] + by, -wPos[3]];
                fw = false;
            }

            if (n === 2) { // moto
                if (i === 0) {
                    p = [0, wPos[1], wPos[2]];
                    fw = true;
                }

                if (i === 1) {
                    p = [0, wPos[1] + by, -wPos[2]];
                    fw = false;
                }
            }

            if (n === 3) { // motorbike
                if (i === 0) {
                    p = [0, wPos[1], wPos[2]];
                    fw = true;
                }

                if (i === 1) {
                    p = [wPos[0], wPos[1] + by, -wPos[2]];
                    fw = false;
                }

                if (i === 2) {
                    p = [-wPos[0], wPos[1] + by, -wPos[2]];
                    fw = false;
                }
            }

            p1.fromArray(p); // position
            p2.setValue(0, -1, 0); // wheelDir
            p3.setValue(-1, 0, 0); // wheelAxe

            this.chassis.addWheel(p1, p2, p3, 1, fw ? radius : radiusBack, tuning, fw);
            this.chassis.setBrake(o.breaking || 100, i);
            this.wheelRadius.push(fw ? radius : radiusBack);
            this.transforms.push(this.chassis.getWheelTransformWS(i));
        }

        this.wpos = wPos;

        this.setData(o);

        trans.free();
        p0.free();
        p1.free();
        p2.free();
        p3.free();
    },

    setMass(m)
    {
        var p0 = math.vector3();
        this.data.mass = m;
        p0.setValue(0, 0, 0);
        this.body.getCollisionShape().calculateLocalInertia(this.data.mass, p0);
        this.body.setMassProps(m, p0);
        this.body.updateInertiaTensor();
        p0.free();
    },

    setPosition()
    {
        this.steering = 0;
        this.breaking = 0;
        this.motor = 0;

        var trans = math.transform();
        trans.identity().fromArray(this.data.pos.concat(this.data.quat));
        var p0 = math.vector3().set(0, 0, 0);

        this.body.setAngularVelocity(p0);
        this.body.setLinearVelocity(p0);
        this.body.setWorldTransform(trans);

        this.chassis.resetSuspension();
        var n = this.data.nWheel;
        while (n--) this.chassis.updateWheelTransform(n, true);

        trans.free();
        p0.free();
    },

    setData(o)
    {
        var data = this.data;

        // mass
        if (o.mass !== undefined) {
            if (o.mass !== data.mass) this.setMass(o.mass);
        }

        // copy value
        for (var i in o) {
            if (data[i] !== undefined) data[i] = o[i];
        }

        // body
        this.body.setFriction(data.friction);
        this.body.setRestitution(data.restitution);
        this.body.setDamping(data.linear, data.angular);// def 0,0
        this.body.setRollingFriction(data.rolling);

        if (o.limitAngular !== undefined) this.limitAngular = o.limitAngular;

        var p1 = math.vector3();
        if (o.linearFactor !== undefined) this.body.setLinearFactor(p1.fromArray(o.linearFactor));
        if (o.angularFactor !== undefined) this.body.setAngularFactor(p1.fromArray(o.angularFactor));
        p1.free();

        if (data.autoSuspension) {
            var sqrt = Math.sqrt(data.s_stiffness);
            data.s_compression = data.compValue * 2 * sqrt;
            data.s_damping = data.dampValue * 2 * sqrt;
        }

        var n = data.nWheel;
        var w;

        while (n--) {
            w = this.chassis.getWheelInfo(n);
            w.set_m_suspensionStiffness(data.s_stiffness);
            w.set_m_wheelsDampingCompression(data.s_compression);
            w.set_m_wheelsDampingRelaxation(data.s_damping);
            w.set_m_maxSuspensionTravelCm(data.s_travel * 100 * root.invScale);
            w.set_m_suspensionRestLength1(data.s_length * root.invScale);
            w.set_m_maxSuspensionForce(data.s_force);
            w.set_m_rollInfluence(data.w_roll);
            w.set_m_frictionSlip(data.w_friction);
            w.set_m_wheelsRadius(this.wheelRadius[n]);
        }

        if (o.reset) this.setPosition();
    },

    get()
    {
        self.postMessage({
            m: 'carData', o: this.data
        });
    },

});

export { Car };
