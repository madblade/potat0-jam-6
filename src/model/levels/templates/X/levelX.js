/**
 * Level X.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }              from '../../level';
import { HeightMapConstants } from '../../../../engine/physics/mad/model/terrain';

let LevelX = function(title, id)
{
    Level.call(this, title, id);

    this.player = {
        position: [0, -10, 1.5],
        rotation: [0, 0, Math.PI]
    };

    this.terrain = {};
    this.generateTerrain();

    this.objects = [];
    this.generateStaticObjects();

    this.textSequence = [
        {
            direct: true,
            text: 'Merci d’avoir joué !'
        },
        {
            direct: true,
            text: 'Ce dernier niveau avec les plateformes était particulièrement frustrant…'
        },
        {
            direct: true,
            text: 'Bravo !'
        },
        {
            direct: true,
            text: 'Voilà, c’est fini.'
        },
        {
            direct: true,
            text: 'Tada !'
        },
        {
            timeToWaitBefore: 5000,
            text: '<span style="color: rebeccapurple">Merci de m’avoir tenu compagnie !</span>'
        },
    ];

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>FIN</h3>', // after, sub

                '<h3><b>Potat0 Game Jam</b> No.6</h3>' +
                'thème: « le vrai objectif est caché »',

                '<h3>musique originale<br/> <small>TheLevg34</small></h3>',

                '<h3>musique originale <small>(post-crédits)</small><br/> ' +
                '<small>TheLevg34 et Nicolas Dross</small></h3>',

                '<h3>gameplay, programmation, modèles, animations, ' +
                'design et bugs divers<br/><small>madblade</small></h3>',

                '<h3>moteur maison (open-source GPLv3)' +
                '<br/><small>madblade</small></h3>',

                '<h3>asset CC BY 4.0 (attribution)' +
                '<br/><small>modèle d’axolotl par xiaotian_63</small></h3>',

                '<h3>assets CC0 (domaine public)' +
                '<br/><small>sfx de marche / saut</small></h3>',

                '<h1>Puddle Game</h1>', // main

                '<h3>Merci d’avoir joué !</h3>',

                '<h3></h3>',
                '<h3></h3>',
                '<h3></h3>',
                '<h3></h3>',
                '<h3></h3>',
                '<h3></h3>',
                '<h3></h3>',
                '<h3></h3>',
                '<h3></h3>',
            ],
            fadeInTitle: 1000,   // for each title, time in milliseconds
            fadeOutTitle: 1000,  // time fade out each title
            keepTitle: 2000,    // time to keep each title full brightness
            fadeOutSplash: 3000, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Vous gagnâtes !');

                backend.selfModel.unlock();
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
                ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                ux.validateTask();
                ux.app.engine.audio.playBonusCredits();
            }
        },
        { // force user to quit via menu
            type: 'event',
            // eslint-disable-next-line no-unused-vars
            checkCondition: function(backend, ux)
            {
                return false;
            },
            // eslint-disable-next-line no-unused-vars
            performWhenConditionMet: function(backend, ux)
            {
                // ux.informPlayer('Checkpoint passed! Go to the next checkpoint…');
                // ux.validateTask();
            }
        },
    ];
};

inherit(LevelX, Level);

extend(LevelX.prototype, {

    generateTerrain()
    {
        let chunks = new Map();
        let points = [];
        const nbSegmentsX = 2;
        const nbSegmentsY = 2;
        const nbVerticesX = nbSegmentsX + 1;
        const nbVerticesY = nbSegmentsY + 1;
        const widthX = HeightMapConstants.DEFAULT_EXTENT;
        const widthY = HeightMapConstants.DEFAULT_EXTENT;

        for (let i = 0; i < nbVerticesX; ++i)
            for (let j = 0; j < nbVerticesY; ++j)
                points.push(
                    0.
                );
        // points.push(0.);

        chunks.set('0,0', {
            x: 0, y: 0, z: 0,
            nbSegmentsX, nbSegmentsY,
            widthX, widthY,
            points,
            isWater: false,
            color: '#161616',
            shininess: 0.1
        });

        this.terrain = {
            worlds: [
                {
                    id: '-1',
                    sky: 'standard'
                }
            ],
            heightmaps: [
                {
                    world: '-1',
                    nbChunksX: 1,
                    nbChunksY: 1,
                    chunks
                }
            ]
        };
    },

    generateStaticObjects()
    {
        const objects = [];
        const walls = this.generateWalls();
        objects.push(...walls);

        const placeHolders = [
            {
                type: 'box',
                reflection: true,
                image: true,
                stone: true,
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                w: 1,
                h: 1,
                d: 0.05
            },
        ];
        objects.push(...placeHolders);

        const cupCM = {
            type: 'box',
            reflection: false,
            image: false,
            platform: true,
            position: [0, 0, 0.5],
            rotation: [0, 0, 0],
            w: 0.5,
            h: 0.5,
            d: 1.15
        };
        objects.push(cupCM);

        this.objects = objects;
    },

    generateWalls()
    {
        const mapWidth = 35;
        const wallHeight = 10;

        const mw2 = mapWidth / 2;
        const wh2 = wallHeight / 2;
        return [
            {
                type: 'box',
                // reflection: true,
                image: true,
                wall: true,
                position: [0, mw2, wh2 - 0.1],
                rotation: [0, 0, 0],
                w: mapWidth,
                h: 2,
                d: wallHeight
            },
            {
                type: 'box',
                // reflection: true,
                image: true,
                wall: true,
                position: [0, -mw2, wh2 - 0.1],
                rotation: [0, 0, 0],
                w: mapWidth,
                h: 2,
                d: wallHeight
            },
            {
                type: 'box',
                // reflection: true,
                image: true,
                wall: true,
                position: [mw2, 0, wh2 - 0.1],
                rotation: [0, 0, 0],
                w: 2,
                h: mapWidth,
                d: wallHeight
            },
            {
                type: 'box',
                // reflection: true,
                image: true,
                wall: true,
                position: [-mw2, 0, wh2 - 0.1],
                rotation: [0, 0, 0],
                w: 2,
                h: mapWidth,
                d: wallHeight
            },
        ];
    },

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

export { LevelX };
