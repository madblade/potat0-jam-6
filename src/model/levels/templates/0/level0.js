/**
 * First level.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';
import { Vector3 }          from 'three';
import { Level0Terrain }    from './terrain';
import { Level0Objects }    from './objects';

let Level0 = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};
    this.generateTerrain();

    this.objects = [];
    this.generateStaticObjects();

    this.player = {
        position: [0, 0, 1.5],
        rotation: [0, 0, Math.PI]
    };

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>madblade présente</h3>', // after, sub
                '<h3>fait pour la <b>Potat0 Game Jam</b> No.6</h3>avec m&alpha;dengine',
                '<h1>Puddle Game</h1>', // main
            ],
            fadeInTitle: 1, //1000,   // for each title, time in milliseconds
            fadeOutTitle: 1, //1000,  // time fade out each title
            keepTitle: 1, //2000,    // time to keep each title full brightness
            fadeOutSplash: 1, //3000, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');
                // backend.addObject(); // static sphere to indicate objective

                const ne = {};
                backend
                    .entityModel
                    .addNewBigCup(ne, 2, 2, 10);
                backend.updateEntities(ne);
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                // console.log(ux);
                const player = backend.selfModel.position;
                const destination = new Vector3(5, 5, 1);
                return player.distanceTo(destination) < 1;
            },
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                // backend.addObject(); static sphere
                // backend.removeObject();
                ux.validateTask(); // goto next task

                // add entity (id = 1)
                const newEntities = {};
                // let k = 0;
                // const bigCupID =
                backend.entityModel
                    .addNewBigCup(newEntities, 0, 0, 10);

                for (let i = 1; i < 2; ++i)
                    for (let j = 1; j < 2; ++j)
                    {
                        // TODO [CRIT] add little cups
                        // k++;
                        // newEntities[k] = {
                        //     p: new Vector3(i, j, 10),
                        //     r: new Vector3(0, 0, 0),
                        //     k: 'bigcup'
                        // };
                    }
                backend.updateEntities(newEntities);
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                // console.log(ux);
                const player = backend.selfModel.position;
                const destination = new Vector3(-5, -5, 1);
                return player.distanceTo(destination) < 1;
            },
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Checkpoint passed! Go to the next level…');
                ux.validateLevel(); // goto next level (or win)
            }
        }
    ];
};

inherit(Level0, Level);

extend(Level0.prototype, {

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

extend(Level0.prototype, Level0Terrain);
extend(Level0.prototype, Level0Objects);

export { Level0 };
