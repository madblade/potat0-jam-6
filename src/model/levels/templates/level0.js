/**
 * First level.
 */

import { Level } from '../level';

let Level0 = function(title)
{
    Level.call(this, title);

    let chunks = new Map();
    let points = [];
    for (let i = 0; i < 32 + 1; ++i)
        for (let j = 0; j < 32 + 1; ++j)
            // points.push([i, j, Math.sin((i + j) / 10)]);
            points.push(-1);
    chunks.set('0,0', {
        x: 0, y: 0, z: 0,
        dimX: 32, dimY: 32,
        widthX: 10, widthY: 10,
        points
    });
    this.terrain = {
        worlds: [
            {
                id: '-1',
                sky: 'standard'
            }
        ],
        heightmaps: [
            {
                world: '-1',
                nbChunksX: 1,
                nbChunksY: 1,
                chunks
            }
        ]
    };
    this.objects = {};
    this.player = {};
};

Level0.prototype = Object.assign(Object.create(Level.prototype), {

    constructor: Level0,

    getTerrain() {
        console.log('[Model/Level0] TODO Get level terrain.');
        // TODO level design
        return this.terrain;
    },

    getObjects() {
        console.log('[Model/Level0] TODO Get level objects.');
        // TODO game design
        return this.objects;
    },

    getPlayer()
    {
        console.log('[Model/Level0] TODO Get player state.');
        // TODO level design
        return this.player;
    },

    getScenario() {
        console.log('[Model/Level0] Scenario.');
        // TODO writing
    },

});

export { Level0 };