
'use strict';

let Level0Objects = {

    generateDefaultWalls()
    {
        return [
            {
                type: 'box',
                position: [0, 15, 5],
                rotation: [0, 0, 0],
                w: 30,
                h: 2,
                d: 10
            },
            {
                type: 'box',
                position: [0, -15, 5],
                rotation: [0, 0, 0],
                w: 30,
                h: 2,
                d: 10
            },
            {
                type: 'box',
                position: [15, 0, 5],
                rotation: [0, 0, 0],
                w: 2,
                h: 30,
                d: 10
            },
            {
                type: 'box',
                position: [-15, 0, 5],
                rotation: [0, 0, 0],
                w: 2,
                h: 30,
                d: 10
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
