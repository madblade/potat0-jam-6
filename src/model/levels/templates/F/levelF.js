/**
 * Level F.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }         from '../../level';
import { LevelFTerrain } from './terrain';
import { LevelFObjects } from './objects';
import { Vector3 }       from 'three';

let LevelF = function(title, id)
{
    Level.call(this, title, id);

    this.terrain = {};
    this.generateTerrain();

    this.objects = [];
    this.generateStaticObjects();

    this.player = {
        position: [0, -17, 1.5],
        rotation: [0, 0, Math.PI],
    };

    this.textSequence = [
        {
            direct: true,
            text: 'Regarde !'
        },
        {
            direct: true,
            text: 'Je brille !!'
        },
    ];

    const ts1 = [
        {
            direct: true,
            text: 'Je brille !!'
        },
        {
            direct: true,
            text: 'Je brille !!'
        }
    ];

    const ts2 = [
        {
            direct: true,
            text: 'Hein ?'
        },
        {
            direct: true,
            text: 'Tu as bien vu que je brillais ?'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Ça te donne pas envie que je sois ton objectif ?'
        },
        {
            direct: true,
            text: '…s’il te plaît ?'
        },
        {
            direct: true,
            text: '…tant pis, j’imagine.'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Ces colonnes m’ont l’air glissantes…'
        },
        {
            direct: true,
            text: 'Et ces reflets pour le moins <i>insolites</i>.'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Tant que tout bouge en rythme,'
        },
        {
            direct: true,
            text: 'la vie est moins monotone.'
        },
        {
            timeToWaitBefore: 20000,
            text: 'J’aimerais bien savoir danser.'
        },
        {
            direct: true,
            text: '<span style="color: rebeccapurple">Comme ça on pourrait valser ensemble…</span>'
        },
    ];

    this.nbUnlockableDialogue = ts2.length;

    const pfs = this.getPlatforms();

    const cbs = this.getClimbers();

    const ov1 = new Vector3(-8.5, -8, 12);

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>Puddle 5</h3>', // after, sub
                '<h3>Synchreaune</h3>',
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

                const sm = backend.selfModel;
                sm.avatar.traverse(o => {
                    if (o.isMesh)
                    {
                        o.userData.bloom = true;
                    }
                });

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
                return i >= 1;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;
                em.setHelperCupTextSequence(ts1);
                em.debloomMainCup();
                const sm = backend.selfModel;
                sm.avatar.traverse(o => {
                    if (o.isMesh)
                    {
                        o.userData.bloom = false;
                    }
                });

                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                ux.validateTask();
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                const em = backend.entityModel;
                const i = em.getHelperCupDialogueAdvancement();
                return i >= 1;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;

                const e = backend.app.engine;
                em.addNewObjects(pfs, e.graphics, e.physics, e.graphics.animationManager);

                const generated = [];
                const ne = {};
                const a1Index = em.addNewAxolotl(ne, 30, -5, 6,
                    false, false,
                    generated, 1
                );
                const a2Index = em.addNewAxolotl(ne, 30, -15, 6,
                    false, false,
                    generated, 2
                );
                const objectiveID = em.addNewLittleCup(
                    ne, -20, -8, 12,
                    true,
                    true,
                    false,
                    generated,
                    false,
                    true
                );
                em.setObjectiveID(objectiveID);
                em.setAxolotlIndex1(a1Index);
                em.setAxolotlIndex2(a2Index);
                backend.updateEntities(ne);

                em.setHelperCupTextSequence(ts2);
                ux.playLittleValidateFeedback();

                em.addNewObjects(cbs, e.graphics, e.physics, e.graphics.animationManager);

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
                const d = player.distanceTo(ov1);
                return d < 1;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                ux.playLittleValidateFeedback();
                const em = backend.entityModel;
                em.disappearObjective();
                em.revealAxolotl1();
                em.revealAxolotl2();

                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                ux.validateTask();
            }
        },
        {
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                const em = backend.entityModel;
                const p = em.getObjectivePosition();
                const player = backend.selfModel.position;
                const d = player.distanceTo(p);
                return d < 2;
            },
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                ux.playBigValidateFeedback();

                const em = backend.entityModel;
                em.triggerObjectiveShrink();

                ux.validateTask(); // goto next task

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
                ux.app.engine.audio.playCredits();
                ux.informPlayer('Level E cleared!');
                ux.validateLevel();
            }
        }
    ];
};

inherit(LevelF, Level);

extend(LevelF.prototype, {

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
            0, 0, 0.6, true,
            this.textSequence
        );
        const idCup = em.addNewBigCup(ne, bigCup, generated);
        em.setHelperCupID(idCup);
        backend.updateEntities(ne);
    }

});

extend(LevelF.prototype, LevelFTerrain);
extend(LevelF.prototype, LevelFObjects);

export { LevelF };
