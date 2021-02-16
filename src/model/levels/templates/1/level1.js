/**
 * Level 1.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }         from '../../level';
import { Level1Terrain } from './terrain';
import { Level1Objects } from './objects';
import { Vector3 }       from 'three';

let Level1 = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};
    this.generateTerrain();

    this.objects = [];
    this.generateStaticObjects();

    this.player = {
        position: [0, 0, 2.],
        rotation: [0, 0, Math.PI]
    };

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h2>Chapter I</h2>', // after, sub
                `<h2>${this.title}</h2>`, // main
            ],
            fadeInTitle: 100, //500,
            fadeOutTitle: 100, // 500,
            keepTitle: 100, //1000,
            fadeOutSplash: 100, //100,
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
                const player = backend.selfModel.position;
                const destination = new Vector3(5, 5, 1);
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

extend(Level1.prototype, Level1Terrain);
extend(Level1.prototype, Level1Objects);

export { Level1 };
