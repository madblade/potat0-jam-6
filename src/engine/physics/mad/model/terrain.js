/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend             from '../../../../extend';

const HeightMapConstants = {
    DEFAULT_WIDTH: 10
};

// This does not extend CollisionModel.
let HeightMapModel = function()
{
    this.isAnalytic = false;
    this.isTrimeshMap = false;

    this.isAxisAligned = false;
    this.x = 0;
    this.y = 0;
    this.extentX = 0;
    this.extentY = 0;
    this.resolutionX = 0;
    this.resolutionY = 0;
    this.data = null; // three attribute data
};

extend(HeightMapModel.prototype, {

    setData(data)
    {
        this.data = data;
    },

    collideTo()
    {
    }

});

export { HeightMapModel, HeightMapConstants };
