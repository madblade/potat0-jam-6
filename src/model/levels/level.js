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
        // TODO static objects
    },

    getObjects() {
        // TODO level design
    },

    getScenario() {
        // TODO writing
    },

});

export { Level };
