/**
 * (c) madblade 2021 all rights reserved
 *
 * Heightmap collision model.
 */

'use strict';

import extend               from '../../../../extend';

import {
    Matrix4,
    Vector3
}                           from 'three';

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
    this.localTransform = new Matrix4(); // should not be used: implicit transform.

    this._normal = new Vector3();
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

    getData()
    {
        if (!this.data) throw Error('[Terrain] Uninitialized height data.');
        return this.data;
    },

    getNormal(localX, localY)
    // localX in [0, extentX]
    // localY in [0, extentY]
    // careful: result will be reallocated next time the function is called
    {
        if (!this.isTrimeshMap) throw Error('[Terrain] Unsupported heightmap');
        // should be used to move characters down.
        // XXX interpolate normals from Three.
        const data = this.getData();
        const nbVerticesX = this.nbVerticesX;
        const nbVerticesY = this.nbVerticesY;
        // const pa = data.geometry.attributes.position.array;
        const x = Math.floor(localX / this.extentX * (nbVerticesX - 1));
        const y = Math.floor(localY / this.extentY * (nbVerticesY - 1));

        const na = data.geometry.attributes.normal.array;
        const a = 3 * (x + nbVerticesX * y); // 0, 0
        this._normal.set(na[a], na[a + 1], na[a + 2]);

        return this._normal;
        // can be recomputed from the bottom left corner.
        // const b = x + nbVerticesX * (y + 1); // 0, 1
        // const c = x + 1 + nbVerticesX * (y + 1); // 1, 1
        // const d = x + 1 + nbVerticesX * y; // 1, 0
        // const heightA = pa[3 * a + 2];
        // const heightB = pa[3 * b + 2];
        // const heightC = pa[3 * c + 2];
        // const heightD = pa[3 * d + 2];
    },

    collideTo()
    {
    }

});

export { HeightMapModel, HeightMapConstants };
