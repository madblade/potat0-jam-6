/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend            from '../../../extend';

let Collider = function(sweeper)
{
    this.sweeper = sweeper;
};

extend(Collider.prototype, {

    collidePairs()
    {
        let pairs = this.sweeper.potentialCollidingPairs;
        // TODO narrow phase detection + position correction
    }

});

export { Collider };
