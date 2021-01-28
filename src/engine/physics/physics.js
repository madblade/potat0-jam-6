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
        this.madEngine.solve(); // gameplay physics
        if (this.useBullet)
            this.bulletEngine.refresh(); // cosmetic physics
    },

    addHeightMap(graphicalChunk)
    {
        // XXX Uncomment here to bench bullet physics
        console.log(`[Physics] Should add ${graphicalChunk}.`);
        // this.bulletEngine.addHeightMap(graphicalChunk);
        // this.madEngine.addHeightMap(graphicalChunk);
    },

    pushEvent(e)
    {
        this.bulletEngine.pushEvent(e);
    },

    addCharacterController()
    {
        this.bulletEngine.addCharacterController();
    },

    cleanupFullPhysics()
    {
        this.madEngine.cleanup();
        this.bulletEngine.cleanup();
    }

});

export { Physics };
