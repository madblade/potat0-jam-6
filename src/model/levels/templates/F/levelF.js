/**
 * Level F.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';
import { LevelFTerrain }    from './terrain';
import { LevelFObjects }    from './objects';

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
        }
    ];

    const pfs = this.getPlatforms();

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>Puddle 5</h3>', // after, sub
                '<h3>Synchreaune</h3>',
            ],
            fadeInTitle: 1,   // for each title, time in milliseconds
            fadeOutTitle: 1,  // time fade out each title
            keepTitle: 2,     // time to keep each title full brightness
            fadeOutSplash: 2, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Go to checkpoint!');

                const em = backend.entityModel;
                const e = backend.app.engine;
                em.addNewObjects(pfs, e.graphics, e.physics, e.graphics.animationManager);

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
                return i >= 1;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;

                em.setHelperCupTextSequence(ts1);

                em.debloomMainCup();

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

                em.setHelperCupTextSequence(ts2);
                ux.playLittleValidateFeedback();

                // const e = backend.app.engine;
                // em.addNewObjects(pfs, e.graphics, e.physics, e.graphics.animationManager);

                const generated = [];
                const ne = {};

                em.addNewAxolotl(ne, 0, 0, 2,
                    true, true,
                    generated, false
                );

                backend.updateEntities(ne);

                em.addNewAxolotl(ne, 0, 10, 2,
                    true, true,
                    generated, false
                );

                // const factor = 1.2;
                // const objectiveID = em.addNewLittleCup(
                //     ne, -4 * factor, -6 * factor, 3,
                //     false,
                //     false,
                //     false,
                //     generated,
                //     true
                // );

                // TODO going back and forth
                // TODO axolotl same

                // em.setObjectiveID(objectiveID);
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
                const em = backend.entityModel;
                const p = em.getObjectivePosition();
                const player = backend.selfModel.position;
                // const d = player.distanceTo(p);
                // window.dh.sg1.position.copy(p);
                // return d < 1;
                return false;
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
                // ux.app.engine.audio.playCredits();
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
