/**
 * Keeps track of levels.
 */

'use strict';

import extend     from '../../extend';

import { Level }  from './level';
import { Level0 } from './templates/0/level0';

let Levels = function(app)
{
    this.app = app;
    this.games = new Map();

    this.levels = [
        new Level0('first level'),
        new Level('second level'),
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
