
'use strict';

import { HeightMapConstants } from '../../../../engine/physics/mad/model/terrain';

let Level1Terrain = {

    generateTerrain()
    {
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
                    0.
                    // i + j
                    // 5 * (j + i) - 10
                    // 10 * i - 10
                    // 10 * j - 10
                    // i + j

                    // Math.exp((i + j / 10) * 0.5) / 1000
                    // 2.5 * Math.sin(i / 4 - j / 4) + 0.2 * Math.cos(i * j / 40)
                    // 0.5 * Math.sin(i / 4 - j / 4) + 0.2 * Math.cos(i * j / 40)
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
    }

};

export { Level1Terrain };
