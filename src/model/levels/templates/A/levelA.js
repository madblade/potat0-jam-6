/**
 * Level A.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';
import { Vector3 }          from 'three';
import { LevelATerrain }    from './terrain';
import { LevelAObjects }    from './objects';

let LevelA = function(title, id)
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

    this.textSequence = [
        {
            direct: true,
            text: ''
        },
        {
            direct: true,
            text: 'Oh, salut!'
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
            direct: true,
            text: '…'
        },
        {
            timeToWaitBefore: 2000,
            text: 'Bon.'
        },
        {
            direct: true,
            timeToWaitBefore: 2000,
            text: 'Je me demande à quoi servent ces machins gris derrière.'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Peut-être qu’en sautant dessus…'
        },
        {
            timeToWaitBefore: 5000,
            text: 'La clé, c’est l’observation.'
        },
        {
            timeToWaitBefore: 5000,
            text: 'L’observation de tous les recoins…'
        },
        {
            timeToWaitBefore: 10000,
            text: 'En tout cas, ça fait plaisir d’avoir de la visite.'
        },
        {
            direct: true,
            text: 'Je commençais à m’ennuyer :('
        },
        {
            direct: true,
            text: 'Heureusement, je suis l’objectif de quelqu’un !'
        },
        {
            direct: true,
            text: 'Pas vrai ?'
        },
        {
            timeToWaitBefore: 2000,
            text: '…'
        },
        {
            direct: true,
            text: '…pas vrai ?'
        },
        {
            direct: true,
            text: 'Je suis bien ton objectif, hein ?'
        },
    ];

    const objectiveVector = new Vector3(-15.75, -15.75);

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>madblade présente</h3>', // after, sub
                '<h3>fait pour la <b>Potat0 Game Jam</b> No.6</h3>' +
                'avec m&alpha;dengine<br/>' +
                'thème: « le vrai objectif est caché »',
                '<h1>Puddle Game</h1>', // main
            ],
            fadeInTitle: 1,   // for each title, time in milliseconds
            fadeOutTitle: 1,  // time fade out each title
            keepTitle: 2,    // time to keep each title full brightness
            fadeOutSplash: 3, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');

                // DON’T FORGET TO UNLOCK
                backend.selfModel.unlock();

                ux.app.engine.audio.playMusic();

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
                    ne,
                    -15.75, -15.75, 0.3,
                    true, true, false,
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

inherit(LevelA, Level);

extend(LevelA.prototype, {

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

    startupObjects(app)
    {
        const backend = app.model.backend;
        const em = backend.entityModel;

        const generated = [];
        const ne = {}; // new entities

        const bigCup = em.makeNewBigCup(
            0, 0, 0.6, false,
            this.textSequence
        );
        const idCup = em.addNewBigCup(ne, bigCup, generated);
        em.setHelperCupID(idCup);

        // em.addNewLittleCup(ne, 1, 1, 0.3, generated);

        // apply
        backend.updateEntities(ne);
    }
});

extend(LevelA.prototype, LevelATerrain);
extend(LevelA.prototype, LevelAObjects);

export { LevelA };
