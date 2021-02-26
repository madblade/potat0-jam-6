/**
 * Keeps track of levels.
 */

'use strict';

import extend     from '../../extend';

import { LevelA } from './templates/A/levelA';
import { Level0 } from './templates/0/level0';
import { Level1 } from './templates/1/level1';
import { Level2 } from './templates/2/level2';

let Levels = function(app)
{
    this.app = app;

    this.levels = [

        new LevelA('Introduction', 0),

        new Level0('sample', 1),
        new Level1('second sample', 2),
        new Level2('third sample', 3),
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
