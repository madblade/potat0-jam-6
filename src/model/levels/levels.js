/**
 * Keeps track of levels.
 */

'use strict';

import extend     from '../../extend.js';
import { Level }  from './level';
import { Level0 } from './templates/level0';

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

    // TODO remove that (used to be server-bound)
    update(data)
    {
        data = JSON.parse(data);

        let map = this.games;
        map.clear();

        // For all kinds.
        for (let property in data) {
            if (!data.hasOwnProperty(property)) continue;
            let games = data[property];
            map.set(property, games);
        }

        this.enterLevels();
    },

    enterLevels()
    {
        let app = this.app;
        let map = this.games;
        app.setState('level-select', map);
    }

});

export { Levels };
