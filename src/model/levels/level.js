/**
 * Single level.
 */


'use strict';

import extend       from '../../extend.js';

let Level = function(title)
{
    this.title = title;
};

extend(Level.prototype, {

    getTitle()
    {
        return this.title;
    },

    getTerrain()
    {
        console.warn('[Model/Level] Abstract level function.');
        // TODO static objects
    },

    getObjects() {
        console.warn('[Model/Level] Abstract level function.');
        // TODO level design
    },

    getPlayer() {
        console.warn('[Model/Level] Abstract level function.');
        // TODO level design
    },

    getScenario() {
        console.warn('[Model/Level] Abstract level function.');
        // TODO writing
    },

});

export { Level };
