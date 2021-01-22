/**
 * Physics.
 */

import extend    from '../../extend';
import { engine } from './engine/engine';

let Physics = function(app)
{
    this.app = app;

    this.Ammo = null;
    this.isLoaded = false;
};

extend(Physics.prototype, {

    preload()
    {
        window.addEventListener('DOMContentLoaded', () => {

            // Ammo().then(AmmoLib =>
            // {
            //     this.Ammo = AmmoLib;
            //     this.isLoaded = true;
            //     console.log('Loaded Ammo.js');
            // });

            engine.init(() =>
            {
                console.log('Physics initialized.');
                this.isLoaded = true;
            });
        });
    },

    init()
    {
        // TODO worker
    }

});

export { Physics };
