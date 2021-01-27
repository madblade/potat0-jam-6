/**
 * First level.
 */

import { Level } from '../level';

let Level0 = function(title)
{
    Level.call(this, title);

    let chunks = new Map();
    let points = [];
    const dimX = 32;
    const dimY = 32;
    for (let j = 0; j < dimX + 1; ++j)
        for (let i = 0; i < dimY + 1; ++i)
            points.push(
                0.5 * Math.sin(i / 4 - j / 4) + 0.2 * Math.cos(i * j / 40)
            );
            // points.push(0.);

    chunks.set('0,0', {
        x: 0, y: 0, z: 0,
        dimX, dimY,
        widthX: 10, widthY: 10,
        points, isWater: false
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
        return this.terrain;
    },

    getObjects() {
        console.log('[Model/Level0] TODO Get level objects.');
        return this.objects;
    },

    getPlayer()
    {
        console.log('[Model/Level0] TODO Get player state.');
        return this.player;
    },

    getScenario() {
        console.log('[Model/Level0] Scenario.');
    },

});

export { Level0 };
