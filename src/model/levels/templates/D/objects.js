
'use strict';

let LevelDObjects = {

    getStelas()
    {
        const platforms = [
            {
                type: 'box',
                red: true,
                reflection: true,
                image: true,
                position: [-10, 0, 0],
                rotation: [0, 0, 0],
                w: 5,
                h: 5,
                d: 0.25
            },
            {
                type: 'box',
                reflection: true,
                image: true,
                position: [10, 0, 0],
                rotation: [0, 0, 0],
                w: 5,
                h: 5,
                d: 0.25
            },
            {
                type: 'box',
                reflection: true,
                image: true,
                position: [0, 10, 0],
                rotation: [0, 0, 0],
                w: 5,
                h: 5,
                d: 0.25
            },
            {
                type: 'box',
                reflection: true,
                image: true,
                position: [0, -10, 0],
                rotation: [0, 0, 0],
                w: 5,
                h: 5,
                d: 0.25
            },
        ];

        return platforms;
    },

    generateWalls()
    {
        const mapWidth = 45;
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

        // add 1 wall
        // const mapWidth = 35;
        // const wallHeight = 10;
        // const mw2 = mapWidth / 2;
        // const wh2 = wallHeight / 2;
        // const additionalWall = {
        //     type: 'box',
        //     // reflection: true,
        //     image: true,
        //     wall: true,
        //     position: [-2, -mw2 + 3, wh2 - 0.1],
        //     rotation: [0, 0, 0],
        //     w: mapWidth,
        //     h: 1,
        //     d: wallHeight
        // };
        // objects.push(additionalWall);

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
            // {
            //     type: 'box',
            //     reflection: true,
            //     image: true,
            //     stone: true,
            //     position: [0, 0, 0],
            //     rotation: [0, 0, 0],
            //     w: 1,
            //     h: 1,
            //     d: 0.05
            // },
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

export { LevelDObjects };
