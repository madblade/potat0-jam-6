/**
 * Common utility for gamepad navigation.
 */

import extend from '../../extend';
import { $ }  from '../polyfills/dom';

let GamepadNavigable = function(maxActiveItems)
{
    this.activeItem = 0;
    this.maxActiveItem = maxActiveItems;
};

extend(GamepadNavigable.prototype, {

    // Abstract
    selectItems()
    {
        throw Error('[Navigable] selectItems is abstract.');
    },

    // Inherited
    navigate(options)
    {
        let didSomething = false;

        if (options === 'up')
        {
            this.activeItem--;
            if (this.activeItem < 0)
                this.activeItem = this.maxActiveItem;
            didSomething = true;
            this.highlightActiveItem();
        }
        else if (options === 'down')
        {
            this.activeItem++;
            if (this.activeItem > this.maxActiveItem)
                this.activeItem = 0;
            didSomething = true;
            this.highlightActiveItem();
        }
        else if (options === 'enter')
        {
            didSomething = true;
            this.clickActiveItem();
        }
        else if (options === 'back')
        {
            didSomething = true;
            this.clickReturn();
        }

        return didSomething;
    },

    highlightActiveItem()
    {
        const items = this.selectItems();
        if (items.length < 1) return;
        const ai = this.activeItem;
        for (let i = 0; i < items.length; ++i)
            if (i === ai) items[i].addClass('gamepad-selected');
            else items[i].removeClass('gamepad-selected');
    },

    clickActiveItem()
    {
        const items = this.selectItems();
        if (items.length < 1) return;
        const ai = this.activeItem;
        items[ai].trigger('click');
    },

    clickReturn()
    {
        const r = $('#return');
        if (r)
            r.trigger('click');
    }

});

export { GamepadNavigable };
