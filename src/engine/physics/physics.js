/**
 * Physics.
 */

'use strict';

import extend           from '../../extend';

import { BulletEngine } from './physics.engine.bullet';
import { MadEngine }    from './physics.engine.mad';

let Physics = function(app)
{
    this.app = app;

    this.isLoaded = false;

    this.useBullet = false; // faster dev

    this.bulletEngine = new BulletEngine(this);
    this.madEngine = new MadEngine(this);
};

extend(Physics.prototype, {

    preload()
    {
        if (this.useBullet)
            this.bulletEngine.preload();
        else
            this.isLoaded = true;
    },

    init()
    {
        // reproduce code here?
    },

    refresh()
    {
        const dt = this.madEngine.solve(); // gameplay physics
        if (this.useBullet)
            this.bulletEngine.refresh(); // cosmetic physics

        return dt;
    },

    addHeightMap(graphicalChunk, nbSegmentsX, nbSegmentsY, isWater)
    {
        // XXX Uncomment here to bench bullet physics
        // console.log(`[Physics] Should add ${graphicalChunk}.`);
        // this.bulletEngine.addHeightMap(graphicalChunk);
        this.madEngine.addHeightMap(0, 0, {
            threeMesh: graphicalChunk, nbSegmentsX, nbSegmentsY, isWater
        });
    },

    addStaticMesh(threeMesh)
    {
        this.madEngine.addStaticMesh(threeMesh);
    },

    pushEvent(e)
    {
        // this.bulletEngine.pushEvent(e);
        this.madEngine.pushEvent(e);
    },

    // Entity model can be either an entity or the player self model.
    addCharacterController(entityModel)
    {
        // this.bulletEngine.addCharacterController(entityModel);
        this.madEngine.addCharacterController(entityModel);
    },

    cleanupFullPhysics()
    {
        this.madEngine.cleanup();
        this.bulletEngine.cleanup();
    }

});

export { Physics };
