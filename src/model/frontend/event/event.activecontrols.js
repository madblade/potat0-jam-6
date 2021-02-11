/**
 *
 */

'use strict';

let ActiveControlsModule = {

    getActiveControls()
    {
        return {
            forward: false,
            backwards: false,
            right: false,
            left: false,
            up: false,
            down: false,
            run: false,

            vec: false, // for continuous input
        };
    }

};

export { ActiveControlsModule };
