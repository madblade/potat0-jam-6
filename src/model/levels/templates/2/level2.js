/**
 * Level 2.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }         from '../../level';
import { Level2Terrain } from './terrain';
import { Vector3 }       from 'three';

let Level2 = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};
    this.generateTerrain();

    this.objects = [];

    this.player = {
        position: [0, 0, 1.5]
    };

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h2>Chapter II</h2>', // after, sub
                `<h2>${this.title}</h2>`, // main
            ],
            fadeInTitle: 500,
            fadeOutTitle: 500,
            keepTitle: 1000,
            fadeOutSplash: 100,
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');
                // backend.addObject(); // static sphere to indicate objective
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                // console.log(ux);
                const player = backend.selfModel.position;
                const destination = new Vector3(0, 0, 1);
                return player.distanceTo(destination) < 1;
            },
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                // backend.addObject(); static sphere
                // backend.removeObject();
                ux.validateLevel(); // goto next task
            }
        },
    ];
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

extend(Level2.prototype, Level2Terrain);

export { Level2 };
