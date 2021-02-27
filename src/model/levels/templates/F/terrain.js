
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

        for (let i = 0; i < nbVerticesX; ++i)
            for (let j = 0; j < nbVerticesY; ++j)
                points.push(
                    1.5 * Math.sin(i / 4 - j / 4) + 0.2 * Math.cos(i * j / 40)
                );

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
