/**
 * Keeps track of levels.
 */

'use strict';

import extend    from '../../extend.js';
import { Level } from './level';

let Levels = function(app)
{
    this.app = app;
    this.games = new Map();

    this.levels = [
        new Level('first level'),
        new Level('second level'),
    ];
};

extend(Levels.prototype, {

    getLevels()
    {
        return this.levels;
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
