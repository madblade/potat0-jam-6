/**
 * Full-fledged cosmetic physics with kinematic input actors
 * based on Bullet, ammo.js and ammo.labs.
 */

'use strict';

import extend           from '../../extend';

import { AmmoWrapper }  from './bulletmain/engine';
import {
    Matrix4,
    MeshBasicMaterial,
    Quaternion,
    Vector3
}                       from 'three';

let BulletEngine = function(physics)
{
    this.physics = physics;

    // ammo.js
    this.Ammo = null;
    this.AmmoWrapper = new AmmoWrapper();

    // char mover
    this.characterHandle = null;
    // state
    this._q = new Quaternion();
    this._p = new Vector3();
    // decomposition
    this._qd = new Quaternion();
    this._pd = new Vector3();
    this._dd = new Vector3();
    // mat
    this._m = new Matrix4();
    this._matrixAggregate = [];
};

extend(BulletEngine.prototype, {

    preload()
    {
        let engine = this.AmmoWrapper;
        window.addEventListener('DOMContentLoaded', () =>
        {
            engine.init(() =>
            {
                console.log('[Physics/Bullet] Bullet initialized.');
                engine.set({
                    fps: 60,
                    substep: 2, // more substep = more accurate simulation default set to 2
                    gravity: [0, 0, -10],
                    fixed: false,
                });

                const noAutoUpdate = true;
                engine.start(noAutoUpdate);
                this.physics.isLoaded = true;
            });
        });
    },

    refresh()
    {
        let engine = this.AmmoWrapper;
        let c = this.characterHandle;
        if (c && this._matrixAggregate.length > 0) {
            engine.matrix(this._matrixAggregate);
        }
        engine.sendData();
        this._matrixAggregate.length = 0; // free
    },

    addHeightMap(graphicalChunk)
    {
        let engine = this.AmmoWrapper;
        let graphics = this.physics.app.engine.graphics;
        let w = graphicalChunk.geometry.parameters.widthSegments;
        let h = graphicalChunk.geometry.parameters.heightSegments;
        let n = (w + 1) * (h + 1);
        let heightData = new Float32Array(n);
        let positionAttribute = graphicalChunk.geometry.attributes.position.array;
        let k = 0;
        for (let i = 0; i < w + 1; ++i)
            for (let j = 0; j < h + 1; ++j)
            {
                heightData[k] = positionAttribute[3 * k + 2];
                k++;
            }
        let position = graphicalChunk.position;

        engine.add({
            type: 'terrain',
            sample: [w + 1, h + 1],
            size: [10, 10, 10],
            upAxis: 2,
            heightData,
            pos: [position.x, position.y, position.z],
        });
        // engine.add({
        //     type: 'plane',
        //     dir: [0, 0, 1],
        // });

        // let c = engine.add({type: 'character', })
        let c = engine.add({
            // type:'character',
            // type:'cylinder',
            type:'capsule',
            kinematic: true,
            friction: 0.5,
            restitution: 0.2,
            name: 'bobby',
            // upAxis: [0, 1, 0],
            pos: [2, -2, 1],
            // rot: [0, 0, Math.PI / 2],
            rot: [0, Math.PI / 2, Math.PI / 2],
            // gravity: [0, 0, -10],
            size: [.25, 1],
            // scale: 0.07,
            material: new MeshBasicMaterial({color: 0x00ff00, wireframe: true})
        });
        // c.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4);
        graphics.addToScene(c, '-1');
        this.characterHandle = c;
        this._p.copy(c.position);
        this._q.copy(c.quaternion);

        let d = 0.1;

        // let m = engine.add({ type:'sphere', size: [1., 1., 1.], pos: [-1, 1, 5], mass: 2, friction: 1, angular: 0.1 });
        // graphics.addToScene(m, '-1');

        // let m2 = engine.add({ type:'sphere', size: [d, d, d], pos: [1, 1, 5], mass: 2, friction: 1, angular: 0.1 });
        // let m3 = engine.add({ type:'sphere', size: [d, d, d], pos: [1, -1, 5], mass: 2, friction: 1, angular: 0.1 });
        // let m4 = engine.add({ type:'sphere', size: [d, d, d], pos: [-1, -1, 5], mass: 2, friction: 1, angular: 0.1 });

        // graphics.addToScene(m2, '-1');
        // graphics.addToScene(m3, '-1');
        // graphics.addToScene(m4, '-1');

        for (let i = 0; i < 300; ++i)
        {
            let m5 = engine.add({
                type:'sphere', size: [d, d, d],
                pos: [
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    0.5 + i / 10
                ],
                mass: 2, friction: 1, angular: 0.1
            });
            graphics.addToScene(m5, '-1');
        }

        // let rand = (min, max) => Math.random() * (max - min) - (max - min) / 2;
        for (let i = 0; i < 2; ++i) {
            const x1 = i < 1 ? -6.01 : 6.01; // rand(-5, 5);
            const x2 = 0; // rand(-5, 5);
            const s = 2.0;//rand(0.5, 3);
            let b1 = engine.add({
                type:'box', size: [s, 10, 10 * s], pos: [x1, x2, 0.5],
                flag: 1, // static
            });
            let b2 = engine.add({
                type:'box', size: [10, s, 10 * s], pos: [x2, x1, 0.5],
                flag: 1, // static
            });
            graphics.addToScene(b1, '-1');
            graphics.addToScene(b2, '-1');
        }
        let b3 = engine.add({ type:'box', size: [1, 1, 2], pos: [0, 1, 0.5], flag: 1 });
        graphics.addToScene(b3, '-1');
        b3 = engine.add({ type:'box', size: [1, 1, 2], pos: [1, 0, 0.5], flag: 1 });
        graphics.addToScene(b3, '-1');
        b3 = engine.add({ type:'box', size: [1, 1, 2], pos: [1, 1, 0.5], flag: 1 });
        graphics.addToScene(b3, '-1');

        // b3 = engine.add({ type:'box', size: [10, 10, 1], pos: [1, 1, -0.0],
        //     rot: [0, 0, 0.001],
        //     flag: 0
        // });
        graphics.addToScene(b3, '-1');
    },

    pushEvent(e)
    {
        let vector = [0, 0, 0];
        if (e[0] !== 'm') return;
        switch (e[1])
        {
            case 'f':
                vector[0] = 1;
                break;
            case 'b':
                vector[0] = -1;
                break;
            case 'r':
                vector[1] = -1;
                break;
            case 'l':
                vector[1] = 1;
                break;
            case 'u':
                vector[2] = 1;
                break;
            case 'd':
                vector[2] = -1;
                break;
            case 'fx':
            case 'bx':
            case 'rx':
            case 'lx':
            case 'ux':
            case 'dx':
                break;
            default:
                return;
        }

        let c = this.characterHandle;
        if (c)
        {
            let oldQ = this._q; // rotation goes here
            let oldP = this._p;
            this._pd.set(...vector);
            this._pd.normalize().multiplyScalar(0.1);
            oldP.add(this._pd);
            this._matrixAggregate.push({
                name: 'bobby',
                pos: this._p.toArray(),
                quat: oldQ.toArray()
            });
        }
        // engine.setKey(vector);
    },

    addCharacterController()
    {
        // XXX add static capsule
    },

    cleanup()
    {
        // XXX cleanup what needs to be (physics objects, meshes, etc)
    }
});

export { BulletEngine };
