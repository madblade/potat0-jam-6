
'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';

let Level1 = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};

    this.objects = [];

    this.player = {};

    this.scenario = [];
};

inherit(Level1, Level);

extend(Level1.prototype, {

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

export { Level1 };
