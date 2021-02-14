/**
 * Level 2.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';

let Level2 = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};

    this.objects = [];

    this.player = {};

    this.scenario = [];
};

inherit(Level2, Level);

extend(Level2.prototype, {

    getTerrain() {
        return this.terrain;
    },

    getObjects() {
        return this.objects;
    },

    getPlayer()
    {
        return this.player;
    },

    getScenario() {
        return this.scenario;
    },

});

export { Level2 };
