/**
 * Legacy car helper.
 */

'use strict';

import { inherit }          from '../../../extend';

import {
    BufferAttribute,
    BufferGeometry,
    LineBasicMaterial,
    LineSegments,
}                           from 'three';

let CarHelper = function(a, c, d)
{
    d = .6 * -d;
    this.py = a[1] - c[1];
    a = new Float32Array(
        [-.2, 0, 0, .2, 0, 0, 0, 0, 0, 0, .4, 0, 0, 0, -.2, 0, 0, .2,
            a[0] - d, this.py, a[2], a[0] - d, this.py + 1, a[2], -a[0] + d,
            this.py, a[2], -a[0] + d, this.py + 1, a[2], -a[0] + d, this.py,
            -a[2], -a[0] + d, this.py + 1, -a[2], a[0] - d, this.py, -a[2],
            a[0] - d, this.py + 1, -a[2], a[0] - d, this.py, a[2], -a[0] + d,
            this.py, a[2], a[0] - d, this.py, -a[2], -a[0] + d, this.py, -a[2]]
    );
    c = new Float32Array([1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
        0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,
        1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0]
    );
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(a, 3));
    this.geometry.setAttribute('color', new BufferAttribute(c, 3));
    this.positions = this.geometry.attributes.position.array;
    this.material = new LineBasicMaterial({
        vertexColors: true,
        name: 'helper'
    });
    LineSegments.call(this, this.geometry, this.material);
};

inherit(CarHelper, LineSegments);

CarHelper.prototype.dispose = function()
{
    this.geometry.dispose();
    this.material.dispose();
};
CarHelper.prototype.updateSuspension = function(a, c, d, e)
{
    this.positions[22] = this.py - a;
    this.positions[28] = this.py - c;
    this.positions[34] = this.py - d;
    this.positions[40] = this.py - e;
    this.geometry.attributes.position.needsUpdate = !0;
};

export { CarHelper };
