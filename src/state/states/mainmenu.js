/**
 * Connect to a distant / local server or launch a local server.
 */

'use strict';

import extend from '../../extend';
import { $ } from '../../modules/polyfills/dom.js';

let MainMenuState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'main';

    this.htmlHead = `
        <div class="container">
            <div class="container small-title">
                <h2>spix RC-0.1</h2>
            </div>
        `;

    this.htmlQuick =
        `
        <div class="row col-12"><div class="col-12">

        <label for="play-quick">Solo mode</label>
        <div class="input-group mb-1 center-block" id="play-quick">

            <div class="d-none d-sm-block input-group-prepend flex-fill">
                <span class="input-group-text flex-fill">No time to set up a server?</span>
            </div>
            <div class="input-group-append">
                <button id="button-play-quick"
                    class="btn btn-outline-light" type="button">I want to play at once; make it so!</button>
            </div>

        </div>

        </div></div>
        `;

    this.htmlTail = '</div>';
};

extend(MainMenuState.prototype, {

    startListeners()
    {
        $('#button-play-quick').click(() => {
            this.stateManager.app.join();
            this.stateManager.app.joinedServer();
        });
    },

    start()
    {
        $('#announce').empty()
            .removeClass()
            .addClass('main-menu')
            .append(
                this.htmlHead +
                this.htmlQuick +
                this.htmlTail
            )
            .css('position', '')
            .show();

        this.startListeners();
    },

    stopListeners()
    {
        $('#button-play-quick').off('click');
    },

    end()
    {
        this.stopListeners();

        return new Promise(function(resolve) {
            $('#announce')
                .empty();
            resolve();
        });
    },

});

export { MainMenuState };
