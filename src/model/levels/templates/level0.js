/**
 * First level.
 */

import { Level } from '../level';

let Level0 = function()
{
    Level.call(this);

    this.terrain = {};
    this.objects = {};
    this.player = {};
};

Level0.prototype = Object.assign(Object.create(Level.prototype), {

    constructor: Level0,

    getTerrain() {
        console.log('[Model/Level0] Terrain.');
        // TODO level design
        return this.terrain;
    },

    getObjects() {
        console.log('[Model/Level0] Objects.');
        // TODO game design
        return this.objects;
    },

    getPlayer()
    {
        console.log('[Model/Level0] Player state.');
        // TODO level design
        return this.player;
    },

    getScenario() {
        console.log('[Model/Level0] Scenario.');
        // TODO writing
    },

});

export { Level0 };
