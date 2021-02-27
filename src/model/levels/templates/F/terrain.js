
'use strict';

import {
    HeightMapConstants
} from '../../../../engine/physics/mad/model/terrain';

let LevelFTerrain = {

    generateHillsChunk()
    {
        let chunks = new Map();
        let points = [];
        const nbSegmentsX = 64;
        const nbSegmentsY = 64;
        const nbVerticesX = nbSegmentsX + 1;
        const nbVerticesY = nbSegmentsY + 1;
        const widthX = HeightMapConstants.DEFAULT_EXTENT;
        const widthY = HeightMapConstants.DEFAULT_EXTENT;

        let m = 0;
        for (let i = 0; i < nbVerticesX; ++i)
        {
            // const nx = (i / nbVerticesX - 0.5) * 8;
            for (let j = 0; j < nbVerticesY; ++j)
            {
                const a = 2.5 * Math.sin(-0.5 + i / 8 - j / 8);
                const b = 0.8 * Math.cos(1.8 + i * j / 80);
                const c = 1.5 * Math.sin(0.5 + j / 12 + i / 12);
                points.push(
                    a + b + c
                    // c
                    // b
                    // a
                );
                // const ny = (j / nbVerticesY - 0.5) * 8;

                // Himmelblau’s function
                // const zn = -0.3 + 2 * (Math.pow(nx * nx + ny - 11, 2.) +
                //     Math.pow(nx + ny * ny - 7, 2)) / 755;
                // m = Math.min(m, zn);
                // points.push(zn);
            }
        }
        console.log(m);

        chunks.set('0,0', {
            x: 0, y: 0, z: 0,
            nbSegmentsX, nbSegmentsY,
            widthX, widthY,
            points,
            isWater: false
        });

        return chunks;
    },

    generateFlatChunk()
    {
        let chunks = new Map();
        let points = [];
        const nbSegmentsX = 2;
        const nbSegmentsY = 2;
        const nbVerticesX = nbSegmentsX + 1;
        const nbVerticesY = nbSegmentsY + 1;
        const widthX = HeightMapConstants.DEFAULT_EXTENT;
        const widthY = HeightMapConstants.DEFAULT_EXTENT;

        for (let i = 0; i < nbVerticesX; ++i)
            for (let j = 0; j < nbVerticesY; ++j)
                points.push(
                    0.
                );

        chunks.set('0,0', {
            x: 0, y: 0, z: 0,
            nbSegmentsX, nbSegmentsY,
            widthX, widthY,
            points,
            isWater: true
        });

        return chunks;
    },

    generateTerrain()
    {
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
                    chunks: this.generateFlatChunk()
                },
                {
                    world: '-1',
                    nbChunksX: 1,
                    nbChunksY: 1,
                    chunks: this.generateHillsChunk()
                }
            ]
        };
    }

};

export { LevelFTerrain };
