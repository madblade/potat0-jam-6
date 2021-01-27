/**
 * HTML Label object to be displayed on top of the scene.
 */
import { Vector3 } from 'three';
import extend      from '../../../extend';

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
    // TODO [GAMEPLAY] bind text to physics camera and call updatePosition before every render.

    this.element = div;
    this.parent = false;
    this.position = new Vector3(0, 0, 0);
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
        if (parent) {
            this.position.copy(this.parent.position);
        }

        let coords2d = this.get2DCoords(this.position, camera);

        // Culling
        if (coords2d.x < 0 || coords2d.y < 0 ||
            coords2d.x > window.innerWidth ||
            coords2d.y > window.innerHeight)
        {
            this.element.style.display = 'none';
        }
        else
        {
            this.element.style.display = 'block';
            this.element.style.left = `${coords2d.x}px`;
            this.element.style.top = `${coords2d.y}px`;
        }
    },

    get2DCoords(position, camera)
    {
        let vector = position.project(camera);
        vector.x = (vector.x + 1) / 2 * window.innerWidth;
        vector.y = -(vector.y - 1) / 2 * window.innerHeight;
        return vector;
    }
});

export { Label };
