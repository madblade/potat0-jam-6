/**
 * First level.
 */

import { Level }              from '../level';
import { HeightMapConstants } from '../../../engine/physics/mad/model/terrain';
import { Vector3 }            from 'three';

let Level0 = function(title, id)
{
    Level.call(this, title, id);

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
            rotation: [0, Math.PI / 4, Math.PI / 4], // Math.PI / 4],
            // rotation: [0, 0, 0], // Math.PI / 4],
            w: 4,
            h: 4,
            d: 1
        }
    ];

    this.player = {
        position: [
            0, 0, 3
        ]
    };

    this.scenario = [
        {
            type: 'splash',
            titles: [
                'Rad Yarns', // main
                '—madengine—', // after, sub
                'A long time away, in a place far ago…',
            ],
            timeBetweenTitles: 1, // in seconds
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');
                // backend.addObject(); // static sphere to indicate objective
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            condition: function(backend, ux)
            {
                // console.log(ux);
                const player = backend.selfModel.position;
                const destination = new Vector3(5, 5, 1);
                return player.distanceTo(destination) < 1;
            },
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                // backend.addObject(); static sphere
                // backend.removeObject();
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            condition: function(backend, ux)
            {
                // console.log(ux);
                const player = backend.selfModel.position;
                const destination = new Vector3(10, 10, 1);
                return player.distanceTo(destination) < 1;
            },
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Checkpoint passed! Go to the next level…');
                ux.validateLevel();
            }
        }
    ];
};

Level0.prototype = Object.assign(Object.create(Level.prototype), {

    constructor: Level0,

    getTerrain() {
        return this.terrain;
    },

    getObjects() {
        return this.objects;
    },

    getPlayer()
    {
        return this.player;
    },

    getScenario() {
        return this.scenario;
    },

});

export { Level0 };
