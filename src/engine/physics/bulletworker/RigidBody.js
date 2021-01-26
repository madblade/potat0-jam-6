
/* global Ammo */

import { math }      from './math.js';
import { map, root } from './root.js';

// ___________________________STATE
//  1  : ACTIVE
//  2  : ISLAND_SLEEPING
//  3  : WANTS_DEACTIVATION
//  4  : DISABLE_DEACTIVATION
//  5  : DISABLE_SIMULATION

// ___________________________FLAG
//  0  : RIGIDBODY
//  1  : STATIC_OBJECT
//  2  : KINEMATIC_OBJECT
//  4  : NO_CONTACT_RESPONSE
//  8  : CUSTOM_MATERIAL_CALLBACK
//  16 : CHARACTER_OBJECT
//  32 : DISABLE_VISUALIZE_OBJECT
//  64 : DISABLE_SPU_COLLISION_PROCESSING

// ___________________________GROUP
//  -1   : ALL
//  1    : DEFAULT
//  2    : STATIC
//  4    : KINEMATIC
//  8    : DEBRIS
//  16   : SENSORTRIGGER
//  32   : NOCOLLISION
//  64   : GROUP0
//  128  : GROUP1
//  256  : GROUP2
//  512  : GROUP3
//  1024 : GROUP4
//  2048 : GROUP5
//  4096 : GROUP6
//  8192 : GROUP7

function RigidBody()
{
    this.ID = 0;
    this.solids = [];
    this.bodys = [];

    this.trans = new Ammo.btTransform();
    this.zero = new Ammo.btVector3();
    this.zero.set(0, 0, 0);
}

Object.assign(RigidBody.prototype, {

    step(AR, N)
    {
        let n;
        let trans = this.trans;
        let scale = root.scale;

        this.bodys.forEach(function(b, id)
        {
            n = N + id * 8;
            AR[n] = b.getLinearVelocity().length() * 9.8; // speed km/h

            //b.getMotionState().getWorldTransform( trans );
            //trans.toArray( AR, n + 1, scale );

            //if ( b.isKinematic ){ b.getMotionState().getWorldTransform( trans ); trans.toArray( AR, n + 1, scale ); }
            //else

            // the position at the end of the last physics tick

            b.getMotionState().getWorldTransform(trans);
            trans.toArray(AR, n + 1, scale);

            // non-interpolated position
            //b.getWorldTransform().toArray( AR, n + 1, scale );
        });
    },

    clear()
    {
        while (this.bodys.length > 0) this.destroy(this.bodys.pop());
        while (this.solids.length > 0) this.destroy(this.solids.pop());
        this.ID = 0;
    },

    destroy(b)
    {
        if (b.type === 'solid') root.world.removeCollisionObject(b);
        else root.world.removeRigidBody(b);
        self.Ammo.destroy(b);
        map.delete(b.name);
    },

    remove(name)
    {
        if (!map.has(name)) return;
        var b = map.get(name);

        var solid = b.type === 'solid';
        var n = solid ? this.solids.indexOf(b) : this.bodys.indexOf(b);

        if (n !== -1) {
            if (solid) {
                this.solids.splice(n, 1);
                this.destroy(b);
            } else {
                this.bodys.splice(n, 1);
                this.destroy(b);
            }
        }
    },

    add(o, extra)
    {
        var name = o.name !== undefined ? o.name : `body${this.ID++}`;
        // delete old if same name
        this.remove(name);

        if (o.density !== undefined) o.mass = o.density;
        if (o.bounce !== undefined) o.restitution = o.bounce;

        var mass = o.mass === undefined ? 0 : o.mass;

        var isKinematic = o.kinematic || false;
        var isGhost = o.ghost || false;

        if (isGhost) mass = 0;

        var p0 = math.vector3();
        var p1 = math.vector3();
        var p2 = math.vector3();
        var p3 = math.vector3();
        var p4 = math.vector3();
        var trans = math.transform();

        var noMesh = o.noMesh !== undefined ? o.noMesh : false;

        if (isKinematic) {
            o.flag = 2;
            o.state = 4;
            if (o.group === undefined) o.group = 4;
        }

        o.size = o.size === undefined ? [1, 1, 1] : o.size;
        o.pos = o.pos === undefined ? [0, 0, 0] : o.pos;
        o.quat = o.quat === undefined ? [0, 0, 0, 1] : o.quat;

        if (root.scale !== 1) {
            o.pos = math.vectomult(o.pos, root.invScale);
            o.size = math.vectomult(o.size, root.invScale);
            if (o.masscenter !== undefined) o.masscenter = math.vectomult(o.masscenter, root.invScale);
        }

        var shape = null;

        if (o.type === 'hardbox' || o.type === 'hardbox' || o.type === 'realhardbox' || o.type === 'ChamferBox') o.type = 'box';
        if (o.type === 'realcylinder' || o.type === 'ChamferCyl') o.type = 'cylinder';
        if (o.type === 'realcone') o.type = 'cone';
        if (o.type === 'realsphere') o.type = 'sphere';

        switch (o.type)
        {
            case 'plane':
                p4.fromArray(o.dir || [0, 1, 0]);
                shape = new Ammo.btStaticPlaneShape(p4, 0);
                break;

            case 'box':
                p4.setValue(o.size[0] * 0.5, o.size[1] * 0.5, o.size[2] * 0.5);
                shape = new Ammo.btBoxShape(p4);
                break;

            case 'sphere':
                shape = new Ammo.btSphereShape(o.size[0]);
                // shape = new Ammo.btMultiSphereShape();
                break;

            case 'cylinder':
                p4.setValue(o.size[0], o.size[1] * 0.5, o.size[2] * 0.5);
                shape = new Ammo.btCylinderShape(p4);
                break;

            case 'cone':
                shape = new Ammo.btConeShape(o.size[0], o.size[1] * 0.5);
                break;

            case 'capsule':
                // shape = new Ammo.btCapsuleShape(o.size[0], o.size[1], o.upAxis || 1);
                shape = new Ammo.btCapsuleShape(o.size[0], o.size[1]);
                break;

            case 'compound':

                shape = new Ammo.btCompoundShape();
                var g;
                var s;
                var tr = math.transform();

                for (var i = 0; i < o.shapes.length; i++) {
                    g = o.shapes[i];

                    g.quat = g.quat === undefined ? [0, 0, 0, 1] : g.quat;

                    if (root.scale !== 1) {
                        g.pos = math.vectomult(g.pos, root.invScale);
                        g.size = math.vectomult(g.size, root.invScale);
                    }

                    // apply position and rotation
                    tr.identity().fromArray(g.pos.concat(g.quat));

                    switch (g.type) {
                        case 'box':
                            p4.setValue(g.size[0] * 0.5, g.size[1] * 0.5, g.size[2] * 0.5);
                            s = new Ammo.btBoxShape(p4);
                            break;
                        case 'sphere':
                            s = new Ammo.btSphereShape(g.size[0]);
                            break;
                        case 'cylinder':
                            p4.setValue(g.size[0], g.size[1] * 0.5, g.size[2] * 0.5);
                            s = new Ammo.btCylinderShape(p4);
                            break;
                        case 'cone':
                            s = new Ammo.btConeShape(g.size[0], g.size[1] * 0.5);
                            break;
                        case 'capsule':
                            s = new Ammo.btCapsuleShape(g.size[0], g.size[1]);
                            break;
                        case 'convex':
                            s = new Ammo.btConvexHullShape();
                            let vx = g.v;
                            for (let ii = 0, fMax = vx.length; ii < fMax; ii += 3)
                            {
                                vx[ii] *= g.size[0];
                                vx[ii + 1] *= g.size[1];
                                vx[ii + 2] *= g.size[2];

                                p4.fromArray(vx, i);
                                s.addPoint(p4);
                            }
                            break;
                    }

                    shape.addChildShape(tr, s);
                }

                //console.log( shape )

                tr.free();

                break;

            case 'mesh':

                let mTriMesh = new Ammo.btTriangleMesh();
                let removeDuplicateVertices = true;
                let vx = o.v;
                for (let ii = 0, fMax = vx.length; ii < fMax; ii += 9)
                {
                    p1.set(vx[ii + 0] * o.size[0], vx[ii + 1] * o.size[1], vx[ii + 2] * o.size[2]);
                    p2.set(vx[ii + 3] * o.size[0], vx[ii + 4] * o.size[1], vx[ii + 5] * o.size[2]);
                    p3.set(vx[ii + 6] * o.size[0], vx[ii + 7] * o.size[1], vx[ii + 8] * o.size[2]);
                    mTriMesh.addTriangle(p1, p2, p3, removeDuplicateVertices);
                }
                if (mass === 0) {
                    // btScaledBvhTriangleMeshShape -- if scaled instances
                    shape = new Ammo.btBvhTriangleMeshShape(mTriMesh, true, true);
                } else {
                    // btGimpactTriangleMeshShape -- complex?
                    // btConvexHullShape -- possibly better?
                    shape = new Ammo.btConvexTriangleMeshShape(mTriMesh, true);
                }
                break;

            case 'convex':

                shape = new Ammo.btConvexHullShape();
                let vx2 = o.v;
                for (let ii = 0, fMax = vx2.length; ii < fMax; ii += 3)
                {
                    vx2[ii] *= o.size[0];
                    vx2[ii + 1] *= o.size[1];
                    vx2[ii + 2] *= o.size[2];

                    p4.fromArray(vx2, ii);
                    shape.addPoint(p4);
                }

                if (o.optimized) {
                    shape.recalcLocalAabb();
                    shape.initializePolyhedralFeatures(); //computation happens here
                }
                //
                break;
        }

        // margin default is 0.039
        // for sphere or capsule margin is the radius
        // https://www.youtube.com/watch?v=BGAwRKPlpCw&hd=1

        if (shape.setMargin !== undefined &&
            o.type !== 'sphere' &&
            o.type !== 'capsule' &&
            o.type !== 'compound')
        {
            if (o.margin !== undefined)
                shape.setMargin(o.margin * root.invScale);
            else if (shape.getMargin !== undefined && root.scale !== 1)
                shape.setMargin(shape.getMargin() * root.invScale);

            //if( shape.getMargin !== undefined ) console.log(o.type, shape.getMargin(), o.size );
        }

        if (extra === 'isShape') return shape;

        // apply position and rotation
        trans.identity().fromArray(o.pos.concat(o.quat));

        if (extra === 'isGhost')
        {
            var ghost = new Ammo.btGhostObject();
            ghost.setCollisionShape(shape);
            ghost.setCollisionFlags(o.flag || 4);
            ghost.setWorldTransform(trans);
            //o.f = new Ammo.btGhostPairCallback();
            //world.getPairCache().setInternalGhostPairCallback( o.f );
            return ghost;
        }

        p1.setValue(0, 0, 0);

        if (mass !== 0) shape.calculateLocalInertia(mass, p1);

        let motionState = new Ammo.btDefaultMotionState(trans);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, p1);

        if (o.friction !== undefined) rbInfo.set_m_friction(o.friction);
        if (o.restitution !== undefined) rbInfo.set_m_restitution(o.restitution);
        //Damping is the proportion of velocity lost per second.
        if (o.linear !== undefined) rbInfo.set_m_linearDamping(o.linear);
        if (o.angular !== undefined) rbInfo.set_m_angularDamping(o.angular);
        // prevents rounded shapes, such as spheres, cylinders and capsules from rolling forever.
        if (o.rolling !== undefined) rbInfo.set_m_rollingFriction(o.rolling);

        var body;

        if (o.masscenter)
        {
            // move center of mass
            p0.fromArray(o.masscenter).negate();
            trans.setIdentity();
            trans.setOrigin(p0);
            body = new Ammo.btCompoundShape();
            body.addChildShape(trans, shape);

            // mass of vehicle in kg
            trans.identity().fromArray(o.pos.concat(o.quat));
            p0.setValue(0, 0, 0);
            body.calculateLocalInertia(mass, p0);
            motionState = new Ammo.btDefaultMotionState(trans);
            rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, body, p0);
        } else {
            if (isGhost) {
                //console.log(shape)
                body = new Ammo.btGhostObject();
                body.setCollisionShape(shape);
                body.setWorldTransform(trans);
                o.flag = o.flag || 4;
                body.setCollisionFlags(o.flag);

                //body.callback = new Ammo.btGhostPairCallback();
                body.isGhost = true;

                //console.log( body, body.isStaticObject(), body.isKinematicObject() );
            } else {
                body = new Ammo.btRigidBody(rbInfo);
                if (isKinematic) body.isKinematic = true;
            }
        }

        //body.isRigidBody = true;
        body.name = name;

        // (?) body.setCenterOfMassTransform()

        if (mass === 0 && !isKinematic) {
            body.setCollisionFlags(o.flag || 1);
            root.world.addCollisionObject(body, o.group || 2, o.mask || -1);
            //body.isSolid = true;
            body.type = 'solid';
            this.solids.push(body);
        } else {
            body.setCollisionFlags(o.flag || 0);
            body.setActivationState(o.state || 1);

            if (o.neverSleep) body.setSleepingThresholds(0, 0);

            root.world.addRigidBody(body, o.group || 1, o.mask || -1);

            //if ( isKinematic ) body.isKinematic = true;
            //else body.isBody = true;
            if (!noMesh) {
                body.type = 'body';
                this.bodys.push(body);
            } else {
                body.type = 'body';
                this.solids.push(body);
            }
        }

        // BREAKABLE

        body.breakable = o.breakable !== undefined ? o.breakable : false;

        if (body.breakable) {
            // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
            body.breakOption = o.breakOption !== undefined ? o.breakOption : [250, 1, 2, 1];
        }

        map.set(name, body);

        //console.log(name, body)

        Ammo.destroy(rbInfo);

        this.applyOption(body, o);

        trans.free();
        p0.free();
        p1.free();
        p2.free();
        p3.free();
        p4.free();

        o = null;
    },

    applyOption(b, o)
    {
        var p1 = math.vector3();

        if (o.flag !== undefined) {
            b.setCollisionFlags(o.flag);
            b.isKinematic = o.flag === 2;
        }

        if (o.state !== undefined) b.setActivationState(o.state);
        if (o.activate !== undefined) b.activate();

        // change group and mask collision
        if (!b.isGhost) {
            if (o.group !== undefined) b.getBroadphaseProxy().set_m_collisionFilterGroup(o.group);
            if (o.mask !== undefined) b.getBroadphaseProxy().set_m_collisionFilterMask(o.mask);
            if (o.damping !== undefined) b.setDamping(o.damping[0], o.damping[1]);
            if (o.sleeping !== undefined) b.setSleepingThresholds(o.sleeping[0], o.sleeping[1]);
        }

        if (o.friction !== undefined) b.setFriction(o.friction);
        if (o.restitution !== undefined) b.setRestitution(o.restitution);
        if (o.rollingFriction !== undefined) b.setRollingFriction(o.rollingFriction);

        // Try this setting (?)
        if (o.linearVelocity !== undefined) b.setLinearVelocity(p1.fromArray(o.linearVelocity, 0, root.invScale));
        if (o.angularVelocity !== undefined) b.setAngularVelocity(p1.fromArray(o.angularVelocity));// radian
        if (o.linearFactor !== undefined) b.setLinearFactor(p1.fromArray(o.linearFactor));
        if (o.angularFactor !== undefined) b.setAngularFactor(p1.fromArray(o.angularFactor));
        //if ( o.linearFactor !== undefined ) b.setLinearFactor( o.linearFactor );
        //if ( o.angularFactor !== undefined ) b.setAngularFactor( o.angularFactor );

        if (o.anisotropic !== undefined) b.setAnisotropicFriction(o.anisotropic[0], o.anisotropic[1]);
        if (o.massProps !== undefined) b.setMassProps(o.massProps[0], o.massProps[1]);

        if (o.gravity !== undefined) {
            if (o.gravity) b.setGravity(root.gravity); else b.setGravity(this.zero);
        }

        /*
        const btScalar DAMPED_TIMESCALE = 3.0 * timeInSecondPerTimeStep; // adjust this multiple as necessary, but for stability don't go below 3.0
        btScalar clampedTimeRatio = (dt > DAMPED_TIMESCALE) ? 1.0 : dt / DAMPED_TIMESCALE; // clamp to 1.0 to enforce stability
        btVector3 newLinearVelocity = (targetPosition - rigidBody->getPosition()) * clampedTimeRatio;
        rigidBody->setLinearVelocity(newLinearVelocity);
        */

        // for high speed object like bullet
        // http://www.panda3d.org/manual/?title=Bullet_Continuous_Collision_Detection
        // Don't do continuous collision detection if the motion (in one step) is less then m_ccdMotionThreshold
        if (o.ccdThreshold !== undefined) b.setCcdMotionThreshold(o.ccdThreshold);// 1e-7
        if (o.ccdRadius !== undefined) b.setCcdSweptSphereRadius(o.ccdRadius); // 0.2 // 0.0 by default

        p1.free();
    },

});


export { RigidBody };
