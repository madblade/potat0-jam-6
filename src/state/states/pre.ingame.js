/**
 * Almost in-game.
 * Signifies the user that it is necessary to click
 * before a pointer lock request can be completed.
 */

'use strict';

import extend from '../../extend';

import { $ } from '../../modules/polyfills/dom';

let PreIngameState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'preingame';
    this.html = `
        <table class="table border rounded noselect" style="width:100%">
            <tr id="request-pl"><td>Click to play</td></tr>
        </table>
    `;
};

extend(PreIngameState.prototype, {

    start()
    {
        $('#announce')
            .empty()
            .removeClass()
            .addClass('settings')
            .append(this.html)
            .center()
            // .fadeIn()
            .show();

        $('#request-pl').click(() => {
            const state = this.stateManager;
            state.setState('ingame');
            state.app.engine.controls.requestStartControls();
            state.app.setFocused(true);
        });
    },

    end()
    {
        $('#request-pl').off('click');
        return new Promise(function(resolve) {
            let requestTab = $('#announce');
            // requestTab.fadeOut(200, function() {
            requestTab.empty().removeClass('settings');
            resolve();
            // });
        });
    },

    navigate(option)
    {
        // only validate.
        if (option === 'enter')
        {
            $('#request-pl').trigger('click');
        }
    },

});

export { PreIngameState };
