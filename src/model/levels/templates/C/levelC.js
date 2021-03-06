/**
 * Level C.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';
import { Vector3 }          from 'three';
import { LevelCTerrain }    from './terrain';
import { LevelCObjects }    from './objects';

let LevelC = function(title, id)
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
            text: ''
        },
        {
            direct: true,
            text: 'Euh…'
        },
        {
            direct: true,
            text: 'J’ai bien vu ce que tu as fait…'
        },
        {
            direct: true,
            text: 'Ce n’était clairement pas mon reflet !'
        },
        {
            direct: true,
            text: 'Cette… <i>chose</i> que tu as prise !'
        },
        {
            timeToWaitBefore: 5000,
            text: 'C’est pas moi ton objectif, alors ?'
        },
        {
            direct: true,
            text: 'Tristesse.'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Oh, on dirait que la patience porte ses fruits.'
        },
        {
            timeToWaitBefore: 10000,
            text: 'J’ai toujours été une quiche en <i>platformer</i>.'
        },
        {
            direct: true,
            text: '…peut-être parce que je ne peux pas sauter.'
        },
        {
            timeToWaitBefore: 5000,
            text: '<span style="color: rebeccapurple">' +
                'Peu importe de ne pas savoir sauter tant qu’on sait rêver !</span>'
        }
    ];

    this.nbUnlockableDialogue = this.textSequence.length;

    const objectiveVector = new Vector3(5, 5, 5.5);

    const pfs = this.getPlatforms();

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>Puddle 2</h3>', // after, sub
                '<h3>Trop heaut</h3>',
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
                return i >= 4;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                const em = backend.entityModel;

                ux.playLittleValidateFeedback();

                const e = backend.app.engine;
                em.addNewObjects(pfs, e.graphics, e.physics, e.graphics.animationManager);

                const generated = [];
                const ne = {};
                const x = objectiveVector.x;
                const y = objectiveVector.y;
                const z = objectiveVector.z;
                const objectiveID = em.addNewLittleCup(
                    ne, x, y, z,
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
                const em = backend.entityModel;
                const i = em.getHelperCupDialogueAdvancement();
                ux.updateDialogueAdvancement(this.levelID, i);

                ux.informPlayer('Level C cleared!');
                ux.validateLevel();
            }
        }
    ];
};

inherit(LevelC, Level);

extend(LevelC.prototype, {

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

extend(LevelC.prototype, LevelCTerrain);
extend(LevelC.prototype, LevelCObjects);

export { LevelC };
