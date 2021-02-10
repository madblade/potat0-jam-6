/**
 *
 */

'use strict';

import { $ } from '../../modules/polyfills/dom';

import extend from '../../extend.js';

let PreIngameState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'preingame';
    this.html = `
<!--        <div class="panel panel-default border rounded">-->
            <table class="table border rounded noselect" style="width:100%">
                <tr id="request-pl"><td>Click to play</td></tr>
            </table>
<!--        </div>-->
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
            .fadeIn();

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
            requestTab.fadeOut(200, function() {
                requestTab.empty().removeClass('settings');
                resolve();
            });
        });
    }

});

export { PreIngameState };
