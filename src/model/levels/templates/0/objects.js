
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
                reflection: true,
                image: true,
                wall: true,
                position: [0, mw2, wh2 - 0.1],
                rotation: [0, 0, 0],
                w: mapWidth,
                h: 2,
                d: wallHeight
            },
            {
                type: 'box',
                reflection: true,
                image: true,
                wall: true,
                position: [0, -mw2, wh2 - 0.1],
                rotation: [0, 0, 0],
                w: mapWidth,
                h: 2,
                d: wallHeight
            },
            {
                type: 'box',
                reflection: true,
                image: true,
                wall: true,
                position: [mw2, 0, wh2 - 0.1],
                rotation: [0, 0, 0],
                w: 2,
                h: mapWidth,
                d: wallHeight
            },
            {
                type: 'box',
                reflection: true,
                image: true,
                wall: true,
                position: [-mw2, 0, wh2 - 0.1],
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

        const placeHolders = [
            {
                type: 'box',
                reflection: true,
                image: true,
                stone: true,
                position: [0, -12, 0.],
                rotation: [0, 0, 0],
                w: 2,
                h: 2,
                d: 0.2
            },
            {
                type: 'box',
                reflection: true,
                image: true,
                stone: true,
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                w: 1,
                h: 1,
                d: 0.05
            },
        ];
        objects.push(...placeHolders);

        const cupCM = {
            type: 'box',
            reflection: false,
            image: false,
            platform: true,
            position: [0, 0, 0.5],
            rotation: [0, 0, 0],
            w: 0.5,
            h: 0.5,
            d: 1.15
        };
        objects.push(cupCM);

        const platforms = [
            {
                type: 'box',
                reflection: true,
                image: false,
                platform: true,
                position: [-10, 0, 1.5],
                rotation: [0, 0, 0],
                w: 1,
                h: 1,
                d: 0.5
            },
            {
                type: 'box',
                reflection: true,
                image: false,
                platform: true,
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
