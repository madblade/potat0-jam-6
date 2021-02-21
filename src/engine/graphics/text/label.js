/**
 * HTML Label object to be displayed on top of the scene.
 */

'use strict';

import extend      from '../../../extend';

import {
    Vector2,
    Vector3
}                   from 'three';

let Label = function(text)
{
    this.text = text;

    let div = document.createElement('div');
    div.className = 'text-label';
    div.style.position = 'absolute';
    div.style.width = '100';
    div.style.height = '100';
    div.innerHTML = text;
    div.style.top = '-1000';
    div.style.left = '-1000';
    // let _this = this;
    // TODO [GAMEPLAY] bind text to physics camera and call
    //      updatePosition before every render.

    this.element = div;
    this.parent = false;
    this.position = new Vector3(0, 0, 0);
    this.coords2D = new Vector2(0, 0);
};

extend(Label.prototype, {

    setHTML(html) {
        this.element.innerHTML = html;
    },

    setParent(object3d)
    {
        this.parent = object3d;
    },

    updatePosition(camera)
    {
        if (parent)
        {
            this.position.copy(this.parent.position);
        }

        const coords2D = this.get2DCoords(this.position, camera);

        // Detect changes.
        if (this.coords2D.manhattanDistanceTo(coords2D) === 0)
            return;
        this.coords2D.set(coords2D.x, coords2D.y);

        // Culling.
        if (coords2D.x < 0 || coords2D.y < 0 ||
            coords2D.x > window.innerWidth ||
            coords2D.y > window.innerHeight)
        {
            this.element.style.display = 'none';
        }
        else
        {
            this.element.style.display = 'block';
            this.element.style.left = `${coords2D.x}px`;
            this.element.style.top = `${coords2D.y}px`;
        }
    },

    get2DCoords(position, camera)
    {
        const vector = position.project(camera);
        vector.x = (vector.x + 1) / 2 * window.innerWidth;
        vector.y = -(vector.y - 1) / 2 * window.innerHeight;
        return vector;
    }
});

export { Label };
