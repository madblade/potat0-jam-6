/**
 * Level B.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';
import { Vector3 }          from 'three';
import { LevelBTerrain }    from './terrain';
import { LevelBObjects }    from './objects';

let LevelB = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};
    this.generateTerrain();

    this.objects = [];
    this.generateStaticObjects();

    this.player = {
        position: [0, -10, 1.5],
        rotation: [0, 0, Math.PI]
    };

    const textSequence = [
        {
            direct: true,
            text: 'Ah !'
        },
        {
            direct: true,
            text: 'Tu m’as fait peur !'
        },
        {
            direct: true,
            text: 'J’ai cru que tu ne reviendrais pas.'
        },
        {
            direct: true,
            text: 'Heureusement, tu sais où est ton <i>vrai</i> objectif.'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Hum.'
        },
        {
            timeToWaitBefore: 2000,
            text: 'Il y a quelque chose qui cloche…'
        },
        {
            direct: true,
            text: 'Pourquoi je n’ai pas de reflet ?'
        },
        {
            direct: true,
            text: '…'
        },
        {
            direct: true,
            text: '……'
        },
        {
            timeToWaitBefore: 2000,
            text: 'Bon.'
        },
        {
            direct: true,
            timeToWaitBefore: 2000,
            text: '.'
        },
        {
            timeToWaitBefore: 5000,
            text: '...'
        },
    ];

    const objectiveVector = new Vector3(-15.75, -15.75);

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>Puddle 1</h3>', // after, sub
                '<h3>Eaubjectif</h3>',
            ],
            fadeInTitle: 1000,   // for each title, time in milliseconds
            fadeOutTitle: 1000,  // time fade out each title
            keepTitle: 1000,     // time to keep each title full brightness
            fadeOutSplash: 1000, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');

                const generated = [];
                const ne = {}; // new entities

                const em = backend.entityModel;
                const bigCup = em.makeNewBigCup(
                    0, 0, 0.6, false,
                    textSequence
                );
                const idCup = em.addNewBigCup(ne, bigCup, generated);
                em.setHelperCupID(idCup);

                // em.addNewLittleCup(ne, 1, 1, 0.3, generated);

                // apply
                backend.updateEntities(ne);
                // DON’T FORGET TO UNLOCK
                backend.selfModel.unlock();

                // ux.app.engine.audio.playMusic();
                // validate task is auto-called for the splash event
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                const em = backend.entityModel;
                const i = em.getHelperCupDialogueAdvancement();
                return i >= 3;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;

                const generated = [];
                const ne = {};
                const objectiveID = em.addNewLittleCup(
                    ne, 0., 1., 2.,
                    true,
                    false,
                    false,
                    generated
                );
                em.setObjectiveID(objectiveID);
                backend.updateEntities(ne);

                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                ux.validateTask();
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                // console.log(ux);
                const player = backend.selfModel.position;
                const destination = objectiveVector;
                return player.distanceTo(destination) < 1;
            },
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                // backend.addObject(); static sphere
                // backend.removeObject();
                ux.playValidateFeedback();

                const em = backend.entityModel;
                em.triggerObjectiveShrink();

                ux.validateTask(); // goto next task
                // add entity (id = 1)
                // const generatedIDs = [];
                // const newEntities = {};
                // let k = 0;
                // const bigCupID =

                // const bigCup = backend.entityModel.makeNewBigCup(
                //     0, 0, 10, false,
                // );
                // em.addNewBigCup(newEntities, bigCup, generatedIDs);

                // for (let i = 10; i < 15; ++i)
                //     for (let j = 10; j < 15; ++j)
                //     {
                //         em.addNewLittleCup(newEntities, i, j, 10, generatedIDs);
                //     }

                // backend.updateEntities(newEntities);

                // call fadeout just before validate
                const rendererManager = backend.app.engine.graphics.rendererManager;
                rendererManager.setTransitionDuration(500);
                rendererManager.startSceneTransition(true);
                rendererManager.setTitleSceneText('');
            }
        },
        {
            type: 'end',
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Level A cleared!');
                ux.validateLevel();
            }
        }
    ];
};

inherit(LevelB, Level);

extend(LevelB.prototype, {

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

extend(LevelB.prototype, LevelBTerrain);
extend(LevelB.prototype, LevelBObjects);

export { LevelB };
