/**
 * Keeps track of levels.
 */

'use strict';

import extend     from '../../extend';

import { LevelA } from './templates/A/levelA';
import { LevelB } from './templates/B/levelB';
import { LevelC } from './templates/C/levelC';
import { LevelD } from './templates/D/levelD';
import { LevelE } from './templates/E/levelE';
import { LevelF } from './templates/F/levelF';
import { LevelX } from './templates/X/levelX';

let Levels = function(app)
{
    this.app = app;

    this.levels = [

        new LevelA('Introduction', 0),
        new LevelB('Flaque 1', 1),
        new LevelC('Flaque 2', 2),
        new LevelD('Flaque 3', 3),
        new LevelE('Flaque 4', 4),
        new LevelF('Flaque 5', 5),
        new LevelX('Générique', 6),

    ];
};

extend(Levels.prototype, {

    getLevels()
    {
        return this.levels;
    },

    getLevel(levelId)
    {
        const level = this.levels[levelId];
        if (!level)
        {
            console.warn(`[Model/Levels] Level ${levelId} not found!`);
        }
        return level;
    },

});

export { Levels };
