import { Level }  from '../level';

let LevelN = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};

    this.objects = [];

    this.player = {};

    this.scenario = [];
};

LevelN.prototype = Object.assign(Object.create(Level.prototype), {

    constructor: LevelN,

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
