/**
 * Level E.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';
import { Vector3 }          from 'three';
import { LevelETerrain }    from './terrain';
import { LevelEObjects }    from './objects';

let LevelE = function(title, id)
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

    this.textSequence = [
        {
            direct: true,
            text: 'Encore ?'
        },
        {
            direct: true,
            text: 'J’ai des yeux, je te signale !'
        },
        {
            direct: true,
            text: 'Je te vois me tourner autour…'
        },
        {
            direct: true,
            text: 'Si tu ne veux pas de moi, rien ne t’oblige à rester.'
        },
        {
            direct: true,
            text: 'Puisque c’est comme ça, tiens !'
        },
        {
            direct: true,
            text: 'Et bonne chance pour trouver la bonne !'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Elles ne peuvent pas te voir.'
        },
        {
            direct: true,
            text: '<span style="color: rebeccapurple">Tristesse.</span>'
        }
    ];

    const objectiveVector = new Vector3(5, 5, 5.5);

    // const pfs = this.getPlatforms();

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>Puddle 4</h3>', // after, sub
                '<h3>Beaucoup</h3>',
            ],
            fadeInTitle: 1,   // for each title, time in milliseconds
            fadeOutTitle: 1,  // time fade out each title
            keepTitle: 2,     // time to keep each title full brightness
            fadeOutSplash: 2, // time to fade out the title screen
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
                return i >= 4;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;

                ux.playLittleValidateFeedback();

                // const e = backend.app.engine;
                // em.addNewObjects(pfs, e.graphics, e.physics, e.graphics.animationManager);

                const generated = [];
                const ne = {};
                // const x = objectiveVector.x;
                // const y = objectiveVector.y;
                // const z = objectiveVector.z;

                const factor = 1.1;
                const objectiveID = em.addNewLittleCup(
                    ne, 4 * factor, 6 * factor, 3,
                    false,
                    false,
                    false,
                    generated,
                    true
                );

                // 100 should do
                for (let i = 1; i < 15; ++i)
                    for (let j = 1; j < 15; ++j)
                    {
                        if (i === 4 && j === 6) continue;
                        em.addNewLittleCup(
                            ne,
                            (i % 2 > 0 ? i : -i) * factor,
                            (j % 2 > 0 ? j : -j) * factor,
                            3,
                            true, false, false,
                            generated,
                            true
                        );
                    }

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
                ux.app.engine.audio.playCredits();
                ux.informPlayer('Level E cleared!');
                ux.validateLevel();
            }
        }
    ];
};

inherit(LevelE, Level);

extend(LevelE.prototype, {

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
            0, 0, 0.6, false,
            this.textSequence
        );
        const idCup = em.addNewBigCup(ne, bigCup, generated);
        em.setHelperCupID(idCup);
        backend.updateEntities(ne);
    }

});

extend(LevelE.prototype, LevelETerrain);
extend(LevelE.prototype, LevelEObjects);

export { LevelE };
