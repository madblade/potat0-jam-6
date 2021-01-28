/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import extend      from '../../../../extend';
import { Matrix4 } from 'three';

const HeightMapConstants = {
    DEFAULT_EXTENT: 10
};

// This does not extend CollisionModel.
let HeightMapModel = function(i, j, nbVerticesX, nbVerticesY)
{
    this.isAnalytic = false; // the most efficient
    this.isHeightBuffer = false; // implicit triangulation
    this.isTrimeshMap = true; // default. explicit vertices, implicit world transform

    this.isAxisAligned = false;
    this.x = i;
    this.y = j;
    this.extentX = HeightMapConstants.DEFAULT_EXTENT;
    this.extentY = HeightMapConstants.DEFAULT_EXTENT;
    this.nbVerticesX = nbVerticesX;
    this.nbVerticesY = nbVerticesY;
    this.data = null; // three attribute data

    this.elementSizeX = this.extentX / (nbVerticesX - 1);
    this.elementSizeY = this.extentY / (nbVerticesY - 1);
    this.localTransform = new Matrix4(); // not used.
};

extend(HeightMapModel.prototype, {

    setData(data)
    {
        this.data = data;
        if (this.isTrimeshMap)
        {
            this.localTransform.copy(data.matrixWorld); // .invert();
        }
    },

    computeNormal(x, y)
    {
        // should be used to move characters down.
        // XXX interpolate normals from Three.
    },

    collideTo()
    {
    }

});

export { HeightMapModel, HeightMapConstants };
