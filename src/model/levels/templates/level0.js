/**
 * First level.
 */

import { Level }              from '../level';
import { HeightMapConstants } from '../../../engine/physics/mad/model/terrain';

let Level0 = function(title)
{
    Level.call(this, title);

    let chunks = new Map();
    let points = [];
    const nbSegmentsX = 32;
    const nbSegmentsY = 32;
    const nbVerticesX = nbSegmentsX + 1;
    const nbVerticesY = nbSegmentsY + 1;
    const widthX = HeightMapConstants.DEFAULT_EXTENT;
    const widthY = HeightMapConstants.DEFAULT_EXTENT;

    for (let i = 0; i < nbVerticesX; ++i)
        for (let j = 0; j < nbVerticesY; ++j)
            points.push(
                // 0.
                // i + j
                // 5 * (j + i) - 10
                // 10 * i - 10
                // 10 * j - 10
                // i + j

                // Math.exp((i + j / 10) * 0.5) / 1000
                // 2.5 * Math.sin(i / 4 - j / 4) + 0.2 * Math.cos(i * j / 40)
                0.5 * Math.sin(i / 4 - j / 4) + 0.2 * Math.cos(i * j / 40)
                // 20.5 * Math.sin(i / 4 - j / 4) + 0.2 * Math.cos(i * j / 40)
            );
            // points.push(0.);

    chunks.set('0,0', {
        x: 0, y: 0, z: 0,
        nbSegmentsX, nbSegmentsY,
        widthX, widthY,
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

    this.objects = [
        {
            type: 'box',
            position: [0, 2, 1],
            rotation: [0, 0, Math.PI / 4],
            w: 1,
            h: 2,
            d: 1
        }
    ];

    this.player = {
        position: [
            // 0.1157442810225684,
            // 0.1157442810225684,
            // 2
            0, 0, 3
        ]
    };
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
