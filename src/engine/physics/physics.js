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
        window.addEventListener('DOMContentLoaded', () =>
        {
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
