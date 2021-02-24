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
    // div.style.width = '200';
    // div.style.height = '200';
    div.innerHTML = text;
    div.style.top = '-1000';
    div.style.left = '-1000';
    div.style.zIndex = '2';
    div.style.display = 'none';
    // let _this = this;

    // XXX put it into some outer div.
    document.body.appendChild(div);

    this.element = div;
    this.parent = null;
    this.position = new Vector3(0, 0, 0);
    this.coords2D = new Vector2(0, 0);
};

extend(Label.prototype, {

    setText(newText)
    {
        this.text = newText;
        this.setHTML(newText);
    },

    getText()
    {
        return this.text;
    },

    setHTML(html)
    {
        this.element.innerHTML = html;
    },

    setParent(object3d)
    {
        this.parent = object3d;
    },

    updatePosition(camera, newPosition)
    {
        if (!newPosition && this.parent)
        {
            this.position.copy(this.parent.position);
        }
        if (newPosition)
            this.position.copy(newPosition);

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
            this.element.style.left = `${Math.floor(coords2D.x)}px`;
            this.element.style.top = `${Math.floor(coords2D.y)}px`;
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
