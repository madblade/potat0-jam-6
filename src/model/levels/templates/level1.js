import { Level }  from '../level';

let Level1 = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};

    this.objects = [];

    this.player = {};

    this.scenario = [];
};

Level1.prototype = Object.assign(Object.create(Level.prototype), {

    constructor: Level1,

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
