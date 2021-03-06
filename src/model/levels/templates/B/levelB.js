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
            direct: true,
            text: 'Devant tes yeux !'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Hum.'
        },
        {
            direct: true,
            text: 'Il y a quelque chose qui cloche…'
        },
        {
            direct: true,
            text: 'Pourquoi je n’ai pas de reflet ?'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Tu as bien un reflet, toi !'
        },
        {
            direct: true,
            text: '…'
        },
        {
            direct: true,
            text: 'Étrange…'
        },
        {
            direct: true,
            text: 'Peut-être qu’on n’a pas tous la chance d’en avoir un.'
        },
        {
            timeToWaitBefore: 10000,
            text: 'J’aimerais bien avoir un reflet.'
        },
        {
            timeToWaitBefore: 5000,
            text: 'Mais bon, tant que tu es là…'
        },
        {
            direct: true,
            text: 'C’est que tout va pour le mieux !'
        },
        {
            timeToWaitBefore: 5000,
            text: '…pas vrai ?'
        },
        {
            timeToWaitBefore: 5000,
            text: '<span style="color: rebeccapurple">C’est bien pour moi que tu es là, non ?</span>'
        }
    ];

    this.nbUnlockableDialogue = this.textSequence.length;

    const objectiveVector = new Vector3(2, -12, 3);

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>Puddle 1</h3>', // after, sub
                '<h3>L’eaubjectif</h3>',
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

                ux.playLittleValidateFeedback();

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

                ux.informPlayer('Level B cleared!');
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

extend(LevelB.prototype, LevelBTerrain);
extend(LevelB.prototype, LevelBObjects);

export { LevelB };
