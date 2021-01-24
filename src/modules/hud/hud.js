/**
 * In-game user interface.
 */

'use strict';

import extend                   from '../../extend.js';
import { $ }                    from '../polyfills/dom';
import { HUDInventoryModule }   from './hud.inventory';

let Hud = function(register)
{
    this.register = register;
    this.orangeColor = '#c96530';

    // TODO HUD Here go HUD thingies.
    this.html = `
        <div id="hud" class="noselect">
            <div id="position"></div>
            <div id="diagram"></div>
            <div id="mini-map"></div>
            <!-- <div id="chat"></div>-->
        </div>
    `;
};

extend(Hud.prototype, {

    // Game started
    initModule()
    {
        // let announce = $('#announce');
        // announce.before(this.html);

        // Quick items
        // this.initInventory();
    },

    // Game ended
    disposeModule()
    {
        $('#hud').remove();
        $('#items').remove();
    },

    updateSelfState(newState)
    {
        if (newState.hasOwnProperty('position'))
        {
            let f = Math.floor;
            let p = newState.position;
            let text = `${f(p[0])}, ${f(p[1])}, ${f(p[2])}`;
            $('#position')
                .text(text)
                .css('color', this.orangeColor);
        }

        if (newState.hasOwnProperty('itemSelect'))
        {
            let newSlot = newState.itemSelect[0];
            let oldSlot = newState.itemSelect[1];
            if (newSlot < 0 || newSlot > 7 || oldSlot < 0 || oldSlot > 7) {
                console.error('[HUD] Invalid item slot.');
            }
            $(`#item${oldSlot}`).removeClass('selected');
            $(`#item${newSlot}`).addClass('selected');
        }

        // if (newState.hasOwnProperty('itemOrientation')) {
        // let or = newState.itemOrientation;
        // $('#item_orientation')
        //     .text(or)
        //     .css('color', this.orangeColor);
        // }

        // if (newState.hasOwnProperty('itemOffset')) {
        // let of = newState.itemOffset;
        // $('#item_offset')
        //     .text(of)
        //     .css('color', this.orangeColor);
        // }
    }

});

extend(Hud.prototype, HUDInventoryModule);

export { Hud };
