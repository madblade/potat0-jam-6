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

    this.bulletEngine = new BulletEngine(this);
    this.madEngine = new MadEngine(this);
};

extend(Physics.prototype, {

    preload()
    {
        this.bulletEngine.preload();
    },

    init()
    {
        // reproduce code here?
    },

    refresh()
    {
        this.bulletEngine.refresh();
    },

    addHeightMap(graphicalChunk)
    {
        this.bulletEngine.addHeightMap(graphicalChunk);
    },

    pushEvent(e)
    {
        this.bulletEngine.pushEvent(e);
    },

    addCharacterController()
    {
        this.bulletEngine.addCharacterController();
    }

});

export { Physics };
