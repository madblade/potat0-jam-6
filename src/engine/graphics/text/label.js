/**
 * HTML Label object to be displayed on top of the scene.
 */

'use strict';

import extend      from '../../../extend';

import {
    Vector2,
    Vector3
}                   from 'three';

let Label = function(textSequence)
{
    this.textSequence = textSequence;
    this.textIndex = 0;
    if (textSequence.length < 1)
        throw Error('[Label] Must have a text sequence with TEXT INSIDE.');

    this.time = 0;
    this.fadeInTime = 100; // ms
    this.fadeOutTime = 500; // ms
    this.displayTime = 3000; // ms

    const firstText = textSequence[0];
    const text = firstText.text;
    this.text = text || 'Allo?';

    let div = document.createElement('div');
    div.className = 'text-label';
    div.style.position = 'absolute';
    div.style.width = '400';
    div.style.height = '200';
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

    stepTextSequence()
    {
        const ts = this.textSequence;
        const nbT = ts.length;
        const ti = this.textIndex + 1;
        if (ti < nbT)
        {
            // display next text
            this.textIndex = ti;
            const nextText = ts[ti].text;
            this.setText(nextText);
            this.resetTime();
        }
    },

    unstepTextSequence()
    {
        const ts = this.textSequence;
        const ti = this.textIndex - 1;
        if (ti >= 0)
        {
            // display next text
            this.textIndex = ti;
            const nextText = ts[ti].text;
            this.setText(nextText);
            this.resetTime();
        }
    },

    advanceTime(deltaT)
    {
        this.time += deltaT;
    },

    resetTime()
    {
        this.time = 0;
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

        // Fade out.
        // const cts = this.textSequence[this.textIndex];
        const fadeIn = this.fadeInTime;
        const fadeOut = this.fadeOutTime;
        const displayTime = this.displayTime;
        const t = this.time;
        let newOpacity = 0;
        if (t < fadeIn)
        {
            newOpacity = t / fadeIn;
        }
        else if (t < fadeIn + displayTime)
        {
            // nothing
            newOpacity = 1;
        }
        else if (t < fadeIn + displayTime + fadeOut)
        {
            newOpacity = 1 - (t - displayTime - fadeIn) / fadeOut;
        }
        else
        {
            newOpacity = 0;
        }

        // transparency culling
        if (newOpacity === 0)
        {
            this.element.style.display = 'none';
            return;
        }
        // console.log(Math.floor(newOpacity * 100));
        this.element.style.opacity = `${Math.floor(newOpacity * 100)}%`;

        // Detect changes.
        if (this.coords2D.manhattanDistanceTo(coords2D) === 0)
        {
            return;
        }
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
