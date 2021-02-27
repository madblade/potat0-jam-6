/**
 * Level X.
 */

'use strict';

import extend, { inherit }  from '../../../../extend';

import { Level }            from '../../level';

let LevelX = function(title, id)
{
    Level.call(this, title, id);

    this.scenario = [
        {
            type: 'splash',
            titles: [
                '<h3>FIN</h3>', // after, sub
                '<h3><b>Potat0 Game Jam</b> No.6</h3>' +
                'thème: « le vrai objectif est caché »',
                '<h3>musique originale<br/> TheLevg34</h3>',
                '<h3>gameplay, programmation, modèles, animations, ' +
                'design, texte<br/>madblade</h3>',
                '<h3>moteur maison' +
                '<br/>madblade</h3>',
                '<h1>Puddle Game</h1>', // main
                '<h3>Merci d’avoir joué !</h3>',
            ],
            fadeInTitle: 1000,   // for each title, time in milliseconds
            fadeOutTitle: 1000,  // time fade out each title
            keepTitle: 2000,    // time to keep each title full brightness
            fadeOutSplash: 3000, // time to fade out the title screen
            performWhenConditionMet: function(backend, ux)
            {
                ux.informPlayer('Vous gagnâtes !');
            }
        },
    ];
};

inherit(LevelX, Level);

extend(LevelX.prototype, {

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
