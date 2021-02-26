/**
 * Keeps track of levels.
 */

'use strict';

import extend     from '../../extend';

import { LevelA } from './templates/A/levelA';
import { LevelB } from './templates/B/levelB';
import { LevelC } from './templates/C/levelC';
import { Level0 } from './templates/0/level0';
import { Level1 } from './templates/1/level1';
import { Level2 } from './templates/2/level2';

let Levels = function(app)
{
    this.app = app;

    this.levels = [

        new LevelC('Flaque 2', 2),
        new LevelA('Introduction', 0),
        new LevelB('Flaque 1', 1),

        new Level0('sample', 10),
        new Level1('second sample', 11),
        new Level2('third sample', 12),
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
