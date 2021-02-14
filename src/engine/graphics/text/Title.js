/**
 * In-game text graphical component.
 */

'use strict';

import extend      from '../../../extend';

let Title = function(text)
{
    this.text = text;

    let div = document.createElement('div');
    div.className = 'title-label';
    div.style.position = 'absolute';
    this.width = 300;
    this.height = 100;
    div.style.width = this.width.toString();
    div.style.height = this.height.toString();
    div.style.textAlign = 'center';
    div.innerHTML = text;
    div.style.top = '-1000';
    div.style.left = '-1000';
    div.style.zIndex = '2';
    div.style.userSelect = 'none';

    this.element = div;
    document.body.appendChild(div);
};

extend(Title.prototype, {

    center()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const element = this.element;

        element.style.display = 'block';
        element.style.left = `${Math.floor(width / 2 - element.offsetWidth / 2)}px`;
        element.style.top = `${Math.floor(height / 2 - element.offsetHeight / 2)}px`;
    },

    setText(text)
    {
        this.text = text;
        this.element.innerHTML = text;
    },

    setOpacity(opacity)
    {
        this.element.style.opacity = opacity;
    },

    hide()
    {
        this.element.style.display = 'none';
    }

});

export { Title };
