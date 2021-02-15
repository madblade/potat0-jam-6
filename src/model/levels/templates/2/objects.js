
'use strict';

let Level2Objects = {

    generateStaticObjects()
    {
        this.objects = [
            {
                type: 'box',
                position: [0, 2, 1],
                rotation: [0, Math.PI / 4, Math.PI / 4],
                w: 4,
                h: 4,
                d: 1
            }
        ];
    }

};

export { Level2Objects };
