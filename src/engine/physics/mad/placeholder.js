/**
 * (c) madblade 2021 all rights reserved
 * Broad phase optimization.
 */

'use strict';

let PlaceHolder = function(
    ix, iy, iz, aabbCenter
)
{
    this.indexOnXArray = ix;
    this.indexOnYArray = iy;
    this.indexOnZArray = iz;
    this.collisionModel = { aabbCenter };

    this.isStatic = true;
    this.isPlaceHolder = true;
};

export { PlaceHolder };
