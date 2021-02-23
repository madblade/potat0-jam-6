
'use strict';

import { Vector3 } from 'three';

let Level0Objects = {

    generateDefaultWalls()
    {
        const mapWidth = 30;
        const wallHeight = 10;

        const mw2 = mapWidth / 2;
        const wh2 = wallHeight / 2;
        return [
            {
                type: 'box',
                position: [0, mw2, wh2],
                rotation: [0, 0, 0],
                w: mapWidth,
                h: 2,
                d: wallHeight
            },
            {
                type: 'box',
                position: [0, -mw2, wh2],
                rotation: [0, 0, 0],
                w: mapWidth,
                h: 2,
                d: wallHeight
            },
            {
                type: 'box',
                position: [mw2, 0, wh2],
                rotation: [0, 0, 0],
                w: 2,
                h: mapWidth,
                d: wallHeight
            },
            {
                type: 'box',
                position: [-mw2, 0, wh2],
                rotation: [0, 0, 0],
                w: 2,
                h: mapWidth,
                d: wallHeight
            },
        ];
    },

    generateStaticObjects()
    {
        const objects = [];
        const walls = this.generateDefaultWalls();
        objects.push(...walls);

        const platforms = [
            {
                type: 'box',
                position: [-10, 0, 1.5],
                rotation: [0, 0, 0],
                w: 1,
                h: 1,
                d: 0.5
            },
            {
                type: 'box',
                position: [-10, 5, 2.5],
                rotation: [0, 0, 0],
                w: 1,
                h: 1,
                d: 0.5
            },
        ];
        objects.push(...platforms);

        this.objects = objects;
    },

};

export { Level0Objects };
