/**
 * Physics.
 */

import extend                from '../../extend';
import { engine }            from './engine/engine';
import { MeshBasicMaterial } from 'three';

let Physics = function(app)
{
    this.app = app;

    this.Ammo = null;
    this.isLoaded = false;
};

extend(Physics.prototype, {

    preload()
    {
        window.addEventListener('DOMContentLoaded', () =>
        {
            engine.init(() =>
            {
                console.log('Physics initialized.');
                engine.set({
                    fps: 60,
                    substep: 2, // more substep = more accurate simulation default set to 2
                    gravity: [0, 0, -10],
                    fixed: false,
                });

                const noAutoUpdate = true;
                engine.start(noAutoUpdate);
                this.isLoaded = true;
            });
        });
    },

    init()
    {
        // reproduce code here?
    },

    refresh()
    {
        // engine.sendData();
    },

    addHeightMap(graphicalChunk)
    {
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

        // let c = engine.add({type: 'character', })
        let c = engine.add({
            type:'character',
            name: 'sphere5',
            // upAxis: [0, 1, 0],
            pos: [1, 0, 1],
            // rot: [0, 0, Math.PI / 2],
            rot: [0, Math.PI / 2, Math.PI / 2],
            gravity: [0, 0, -10],
            size: [0.25, 1],
            // scale: 0.07,
            material: new MeshBasicMaterial({color: 0x00ff00, wireframe: true})
        });
        // c.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4);
        this.app.engine.graphics.addToScene(c, '-1');

        let d = 0.1;

        // let m = engine.add({ type:'sphere', size: [1., 1., 1.], pos: [-1, 1, 5], mass: 2, friction: 1, angular: 0.1 });
        // this.app.engine.graphics.addToScene(m, '-1');

        // let m2 = engine.add({ type:'sphere', size: [d, d, d], pos: [1, 1, 5], mass: 2, friction: 1, angular: 0.1 });
        // let m3 = engine.add({ type:'sphere', size: [d, d, d], pos: [1, -1, 5], mass: 2, friction: 1, angular: 0.1 });
        // let m4 = engine.add({ type:'sphere', size: [d, d, d], pos: [-1, -1, 5], mass: 2, friction: 1, angular: 0.1 });

        // this.app.engine.graphics.addToScene(m2, '-1');
        // this.app.engine.graphics.addToScene(m3, '-1');
        // this.app.engine.graphics.addToScene(m4, '-1');

        for (let i = 0; i < 100; ++i)
        {
            let m5 = engine.add({
                type:'sphere', size: [d, d, d],
                pos: [
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    0.5 + i / 10
                ],
                mass: 2, friction: 1, angular: 0.1 });
            this.app.engine.graphics.addToScene(m5, '-1');
        }

        // TODO rotation.
    },

    addCharacterController(selfModel)
    {
        let p = selfModel.position;
        let r = selfModel.rotation;

        // engine.add('character',
        // {
        // });
        // TODO character.
    }

});

export { Physics };
