/**
 * Level D.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';
import { Vector3 }          from 'three';
import { LevelDTerrain }    from './terrain';
import { LevelDObjects }    from './objects';

let LevelD = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};
    this.generateTerrain();

    this.objects = [];
    this.generateStaticObjects();

    this.player = {
        position: [0, -15, 1.5],
        rotation: [0, 0, Math.PI],
        isXYFlipped: true
    };

    this.textSequence = [
        {
            direct: true,
            text: ''
        },
        {
            direct: true,
            text: ''
        },
        {
            direct: true,
            text: '…'
        },
        {
            direct: true,
            text: 'Encore toi.'
        },
        {
            direct: true,
            text: 'J’ai toujours pas de reflet.'
        },
        {
            direct: true,
            text: 'Qu’est-ce que ça peut bien vouloir dire ?'
        },
        {
            direct: true,
            text: '…'
        },
        {
            direct: true,
            text: 'J’imagine que tu ne veux toujours pas de moi…'
        },
        {
            direct: true,
            text: '…comme objectif ?'
        }
    ];

    const secondTextSequence = [
        {
            direct: true,
            text: 'Qu’est-ce que tu fais ?'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Hm…'
        },
        {
            direct: true,
            text: 'Hmmmmm…'
        },
        {
            direct: true,
            text: 'Ton reflet est…'
        },
        {
            direct: true,
            text: 'Bizarre.'
        },
        {
            direct: true,
            text: 'C’est comme s’il s’était désynchronizé !'
        },
        {
            timeToWaitBefore: 10000,
            text: 'J’ai le pied mouillé.'
        },
        {
            direct: true,
            text: 'Ça rafraîchit !'
        },
        {
            timeToWaitBefore: 10000,
            text: 'Je peux te dire un secret ?'
        },
        {
            direct: true,
            text: '<span style="color: rebeccapurple">' +
                'C’est près de l’eau que je rêve le mieux.</span>'
        },
    ];

    this.nbUnlockableDialogue = secondTextSequence.length;

    const preObjectiveVector = new Vector3(-15, 0, 0.5);
    const objectiveVector = new Vector3(6, -11, 3.5);

    const pfs = this.getStelas();
    const bck = this.getBlockers();

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>Puddle 3</h3>', // after, sub
                '<h3>Réflection</h3>',
            ],
            fadeInTitle: 1000,   // for each title, time in milliseconds
            fadeOutTitle: 1000,  // time fade out each title
            keepTitle: 2000,     // time to keep each title full brightness
            fadeOutSplash: 2000, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');

                // DON’T FORGET TO UNLOCK
                backend.selfModel.unlock();

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
                return i >= 7;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;

                // apparition des stèles
                const e = backend.app.engine;
                em.addNewObjects(pfs, e.graphics, e.physics, e.graphics.animationManager);

                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                ux.validateTask();
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                const player = backend.selfModel.position;
                const destination = preObjectiveVector;
                return player.distanceTo(destination) < 2;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;
                em.setHelperCupTextSequence(secondTextSequence);

                // apparition des blockers
                const e = backend.app.engine;
                em.addNewObjects(bck, e.graphics, e.physics, e.graphics.animationManager);

                const generated = [];
                const ne = {};
                const x = objectiveVector.x;
                const y = objectiveVector.y;
                const z = objectiveVector.z;
                const objectiveID = em.addNewLittleCup(
                    ne, y, x, z, // flip
                    true,
                    false,
                    false,
                    generated
                );
                em.setObjectiveID(objectiveID);
                backend.updateEntities(ne);

                backend.selfModel.flipXYMain();

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
                ux.playBigValidateFeedback();

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
                const em = backend.entityModel;
                const i = em.getHelperCupDialogueAdvancement();
                ux.updateDialogueAdvancement(this.levelID, i);

                // ux.app.engine.audio.playCredits();
                ux.informPlayer('Level D cleared!');
                ux.validateLevel();
            }
        }
    ];
};

inherit(LevelD, Level);

extend(LevelD.prototype, {

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
        const ne = {};
        const generated = [];
        const bigCup = em.makeNewBigCup(
            0, 0, 0.5, false,
            this.textSequence
        );
        const idCup = em.addNewBigCup(ne, bigCup, generated);
        em.setHelperCupID(idCup);
        backend.updateEntities(ne);
    }

});

extend(LevelD.prototype, LevelDTerrain);
extend(LevelD.prototype, LevelDObjects);

export { LevelD };
