
'use strict';

let LevelEObjects = {

    getPlatforms()
    {
        const platforms = [
            {
                type: 'box',
                reflection: true,
                image: true,
                stone: true,
                position: [-10, 10, 0],
                rotation: [0, 0, Math.PI / 16],
                w: 1,
                h: 1,
                d: 0.5
            },
            {
                type: 'box',
                image: true,
                stone: true,
                position: [-3, 10, 0],
                rotation: [0, 0, Math.PI / 8],
                w: 1,
                h: 1,
                d: 1
            },
            {
                type: 'box',
                image: true,
                stone: true,
                position: [3, 10, 0],
                rotation: [0, 0, Math.PI / 4],
                w: 1,
                h: 1,
                d: 2
            },
            {
                type: 'box',
                image: true,
                stone: true,
                position: [10, 10, 0],
                rotation: [0, 0, Math.PI / 3],
                w: 1,
                h: 1,
                d: 4
            },
        ];

        return platforms;
    },

    generateWalls()
    {
        const mapWidth = 40;
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
        const walls = this.generateWalls();
        objects.push(...walls);

        const platforms = this.getPlatforms();
        objects.push(...platforms);

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

        this.objects = objects;
    },

};

export { LevelEObjects };
