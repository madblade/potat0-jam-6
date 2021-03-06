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
        position: [0, -12, 1.5],
        rotation: [0, 0, Math.PI]
    };

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>madblade présente</h3>', // after, sub
                '<h3>fait pour la <b>Potat0 Game Jam</b> No.6</h3>avec m&alpha;dengine',
                '<h3>thème: “le vrai objectif est caché”</h3>', // main
                '<h1>Puddle Game</h1>', // main
            ],
            fadeInTitle: 1000, //1000,   // for each title, time in milliseconds
            fadeOutTitle: 1000, //1000,  // time fade out each title
            keepTitle: 1000, //2000,    // time to keep each title full brightness
            fadeOutSplash: 1000, //3000, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');
                // backend.addObject(); // static sphere to indicate objective

                const generated = [];
                const ne = {}; // new entities

                const textSequence = [
                    {
                        direct: true,
                        text: 'Oh salut!'
                    },
                    {
                        direct: true,
                        text: 'Tu dois être le joueur…'
                    },
                    {
                        direct: true,
                        text: 'Et je suppose que je suis l’objectif ?'
                    },
                    {
                        direct: true,
                        text: 'Tu vas bien ?'
                    },
                    {
                        timeToWaitBefore: 2000,
                        text: 'Bon.'
                    }
                ];
                const bigCup = backend.entityModel.makeNewBigCup(
                    0, 0, 0.6, false,
                    textSequence
                );
                const idCup = backend.entityModel
                    .addNewBigCup(ne, bigCup, generated);
                backend.entityModel.setHelperCupID(idCup);

                // apply
                backend.updateEntities(ne);
                // DON’T FORGET TO UNLOCK
                backend.selfModel.unlock();

                ux.app.engine.audio.playMusic();
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

                const em = backend.entityModel;

                // add entity (id = 1)
                const generatedIDs = [];
                const newEntities = {};
                // let k = 0;
                // const bigCupID =

                const bigCup = backend.entityModel.makeNewBigCup(
                    0, 0, 10, false,
                );
                em.addNewBigCup(newEntities, bigCup, generatedIDs);

                for (let i = 10; i < 15; ++i)
                    for (let j = 10; j < 15; ++j)
                    {
                        em.addNewLittleCup(
                            newEntities, i, j, 10,
                            true, true, false,
                            generatedIDs
                        );
                    }

                backend.updateEntities(newEntities);

                ux.app.engine.audio.playCredits();
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
