/**
 * Physics.
 */

import extend    from '../../extend';
import * as Ammo from '../../libs/ammo.wasm';

let Physics = function(app)
{
    this.app = app;

    this.Ammo = null;
    this.isLoaded = false;
};

extend(Physics.prototype, {

    preload()
    {
        let scope = this;
        window.addEventListener('DOMContentLoaded', function() {
            // eslint-disable-next-line no-undef
            Ammo().then(function(AmmoLib)
            {
                scope.Ammo = AmmoLib;
                scope.isLoaded = true;
                console.log('Loaded Ammo.js');
            });
        });
    },

    init()
    {
        // TODO worker
    }

});

export { Physics };
