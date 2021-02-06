/**
 * Single level.
 */


'use strict';

import extend       from '../../extend.js';

let Level = function(title, id)
{
    this.title = title;
    this.levelID = id;
};

extend(Level.prototype, {

    getTitle()
    {
        return this.title;
    },

    getID()
    {
        return this.levelID;
    },

    getTerrain()
    {
        console.warn('[Model/Level] Abstract level function.');
    },

    getObjects() {
        console.warn('[Model/Level] Abstract level function.');
    },

    getPlayer() {
        console.warn('[Model/Level] Abstract level function.');
    },

    getScenario() {
        console.warn('[Model/Level] Abstract level function.');
    },

});

export { Level };
