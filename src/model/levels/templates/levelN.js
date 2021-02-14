/**
 * Level template.
 */

'use strict';

import extend, { inherit }  from '../../../extend';

import { Level }            from '../level';

let LevelN = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};

    this.objects = [];

    this.player = {};

    this.scenario = [];
};

inherit(LevelN, Level);

extend(LevelN.prototype, {

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

export { LevelN };
