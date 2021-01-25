
/* global Ammo */

import { math }      from './math.js';
import { map, root } from './root.js';

function Character()
{
    this.ID = 0;
    this.heroes = [];
}

Object.assign(Character.prototype, {

    step(AR, N)
    {
        var n;

        this.heroes.forEach(function(hero, id)
        {
            n = N + id * 8;
            hero.step(AR, n);
        });
    },

    control(name)
    {
        if (!map.has(name)) return;
        var hero = map.get(name);

        hero.move(root.key);
        hero.setAngle(root.angle);
    },

    clear()
    {
        while (this.heroes.length > 0) this.destroy(this.heroes.pop());
        this.ID = 0;
    },

    destroy(hero)
    {
        root.world.removeCollisionObject(hero.body);
        root.world.removeAction(hero.controller);
        hero.clear();
        map.delete(hero.name);
    },

    remove(name)
    {
        if (!map.has(name)) return;
        var hero = map.get(name);

        var n = this.heroes.indexOf(hero);
        if (n !== -1) {
            this.heroes.splice(n, 1);
            this.destroy(hero);
        }
    },

    add(o)
    {
        var name = o.name !== undefined ? o.name : `hero${this.ID++}`;

        // delete old if same name
        this.remove(name);

        var hero = new Hero(name, o);

        //hero.controller.setGravity( root.gravity );
        root.world.addCollisionObject(hero.body, o.group || 1, o.mask || -1);
        root.world.addAction(hero.controller);

        this.heroes.push(hero);
        map.set(name, hero);
    }

});

export { Character };

function Hero(name, o)
{
    this.type = 'character';

    this.name = name;

    this.body = null;
    this.controller = null;

    this.angle = 0;
    this.speed = 0;
    this.wasJumping = false;
    this.verticalVelocity = 0;
    this.angleInc = 0.1;

    this.q = math.quaternion();
    this.position = math.vector3();

    this.init(o);
}

Object.assign(Hero.prototype, {

    isCharacter: true,

    step(Ar, n)
    {
        Ar[n] = this.speed;
        //Hr[n] = b.onGround ? 1 : 0;

        // var t = this.body.getWorldTransform();
        // var pos = t.getOrigin();
        // var quat = t.getRotation();

        // Ar[n + 1] = pos.x();
        // Ar[n + 2] = pos.y();
        // Ar[n + 3] = pos.z();

        // Ar[n + 4] = quat.x();
        // Ar[n + 5] = quat.y();
        // Ar[n + 6] = quat.z();
        // Ar[n + 7] = quat.w();

        this.body.getWorldTransform().toArray(Ar, n + 1, root.scale);
    },

    move(key)
    {
        //var hero = this.controller;
        //btScalar walkVelocity = btScalar(1.1) * 4.0; // 4 km/h -> 1.1 m/s
        //btScalar walkSpeed = walkVelocity * dt;

        var walkSpeed = 0.3;
        var angleInc = 0.1;

        var x = 0;
        var y = 0;
        var z = 0;

        //transW = hero.getGhostObject().getWorldTransform();
        //console.log(transW.getOrigin().y())
        //y = transW.getOrigin().y();

        //if(key[0] == 1 || key[1] == 1 ) heros[id].speed += 0.1;
        //if(key[0] == 0 && key[1] == 0 ) heros[id].speed -= 0.1;

        //if(heros[id].speed>1) heros[id].speed = 1;
        //if(heros[id].speed<0) heros[id].speed = 0;

        //if( key[1] == -1 ) z=-heros[id].speed * walkSpeed;
        //if( key[1] == 1 ) z=heros[id].speed * walkSpeed;

        //if( key[0] == -1 ) x=-heros[id].speed * walkSpeed;
        //if( key[0] == 1 ) x=heros[id].speed * walkSpeed;

        if (key[4] === 1) this.controller.canJump();

        /*if ( key[ 4 ] == 1 && this.controller.onGround() ) { //h.canJump() ){
            this.wasJumping = true;
            this.verticalVelocity = 0;
        }
        if ( this.wasJumping ) {
            this.verticalVelocity += 0.04;
            // y = this.controller.verticalVelocity;
            if ( this.verticalVelocity > 0.5 ) {//1.3
                this.verticalVelocity = 0;
                this.wasJumping = false;
            }
        }*/

        //  if( hero.onGround() ){
        y = walkSpeed * -key[1];
        x = walkSpeed * -key[0];

        this.speed = y + x;

        // rotation

        this.angle -= key[2] * angleInc;

        // this.setAngle(this.angle);

        // var angle = hero.rotation;//key[8]; //heros[id].rotation

        // change rotation
        // quatW.setFromAxisAngle( [0,1,0], angle );
        //hero.getGhostObject().getWorldTransform().setRotation( quatW );
        // transW.setRotation( quatW );

        // walkDirection
        // this.position.setValue(x, y, z);
        // this.position.direction(this.q);
        // this.controller.setWalkDirection(this.position);

        let v = math.vector3();
        v.set(x, y, z);
        // v.multiplyScalar(10);
        this.controller.setWalkDirection(v);
        //}

        // heros[id].preStep ( world );
        //heros[id].setVelocityForTimeInterval(vec3(), 1);
    },

    clear()
    {
        Ammo.destroy(this.body);
        Ammo.destroy(this.controller);

        this.body = null;
        this.controller = null;
    },

    init(o)
    {
        var p0 = math.vector3();
        var trans = math.transform();

        o.size = o.size === undefined ? [1, 1, 1] : o.size;
        o.pos = o.pos === undefined ? [0, 0, 0] : o.pos;
        o.quat = o.quat === undefined ? [0, 0, 0, 1] : o.quat;

        if (root.scale !== 1) {
            o.pos = math.vectomult(o.pos, root.invScale);
            //o.size = math.vectomult( o.size, root.invScale );
            if (o.masscenter !== undefined) o.masscenter = math.vectomult(o.masscenter, root.invScale);
        }

        //var capsule = new Ammo.btCapsuleShape( o.size[ 0 ], o.size[ 1 ] );

        var upAxis = o.upAxis || [0, 0, 1];
        var shapeInfo = o.shapeInfo || {
            type: 'capsule', size: o.size, upAxis
        };

        var shape = root.makeShape(shapeInfo);

        var body = new Ammo.btPairCachingGhostObject();
        trans.identity().fromArray(o.pos.concat(o.quat));
        body.setWorldTransform(trans);

        body.setCollisionShape(shape);
        body.setCollisionFlags(16); // CHARACTER_OBJECT

        body.setFriction(o.friction || 0.1);
        body.setRestitution(o.restitution || 0);

        body.setActivationState(4);
        body.activate();
        this.body = body;

        // var upAxis = 2;
        var controller = new Ammo.btKinematicCharacterController(body, shape, o.stepH || 0.35, upAxis);
        //var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.3 )
        controller.setUseGhostSweepTest(shape);

        // p0.setValue(0, 0, 0);
        // controller.setVelocityForTimeInterval(p0, 1);

        // hero.getGhostObject().getWorldTransform().setRotation(q4( o.quat ));
        // controller.getGhostObject().getWorldTransform().setRotation(o.quat);
        this.controller = controller;
        this.applyOption(o);

        controller.setFallSpeed(10);
        controller.setJumpSpeed(5);
        let og = o.gravity;
        let g = math.vector3();
        g.set(...og);
        controller.setGravity(g);
        setInterval(() => {
            if (controller.canJump())
            {
                // controller.jump();
                this.move([
                    0.15 * (Math.random() * 2 - 1),
                    0.15 * (Math.random() * 2 - 1),
                    0, 0
                ]);
            }
            // let f = math.vector3();
            // f.copy(controller.getGravity().negate());
            // controller.setGravity(f);
        }, 500);

        // The max slope determines the maximum angle that the controller can walk

        // controller.warp(v3(o.pos));

        // world.getPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );
    },

    applyOption(o)
    {
        var controller = this.controller;

        // if (o.gravity !== undefined) controller.setGravity(o.gravity);//9.8 *3
        // if (o.upAxis !== undefined) controller.setUp(o.upAxis);
        if (o.canJump !== undefined) controller.canJump(o.canJump);
        if (o.maxJumpHeight !== undefined) controller.setMaxJumpHeight(o.maxJumpHeight);//0.01
        if (o.jumpSpeed !== undefined) controller.setJumpSpeed(o.jumpSpeed);//0.1
        if (o.fallSpeed !== undefined) controller.setFallSpeed(o.fallSpeed);//55
        if (o.slopeRadians !== undefined) controller.setMaxSlope(o.slopeRadians);//45

        if (o.angle !== undefined) this.setAngle(o.angle);//45
        if (o.position !== undefined) {
            this.position.fromArray(o.position, 0, root.invScale);
            this.position.direction(this.q);
            controller.setWalkDirection(this.position);
        }
    },

    setMatrix(o)
    {
        var p0 = math.vector3();
        o.pos = math.vectomult(o.pos, root.invScale);
        p0.fromArray(o.pos);

        this.controller.warp(p0);

        p0.free();
    },

    setAngle(angle)
    {
        var t = this.body.getWorldTransform();
        this.q.setFromAxisAngle([0, 0, 1], angle);
        t.setRotation(this.q);
        this.angle = angle;
    }

});


export { Hero };
