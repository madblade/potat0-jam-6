
'use strict';

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
        this.objects = objects;
    }

};

export { Level0Objects };
