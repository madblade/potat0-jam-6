/**
 * Connect to a distant / local server or launch a local server.
 */

'use strict';

import extend from '../../extend';
import { $ } from '../../modules/polyfills/dom.js';

const GameHeader = `
<div class="container small-title">
    <h2>Potat0 Jam No. 6 / alpha-0.0</h2>
</div>
`;

let MainMenuState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'main';

    this.htmlHead = `
        <div class="container">
            ${GameHeader}
        `;

    this.htmlQuick =
        `
        <div class="row col-12"><div class="col-12">

        <div class="input-group mb-1 center-block" id="play-quick">
            <div class="input-group-append flex-fill">
                <button id="button-play"
                    class="btn btn-outline-light flex-fill" type="button">New Game</button>
            </div>
        </div>

        <div class="input-group mb-1 center-block" id="load">
            <div class="input-group-append flex-fill">
                <button id="button-load"
                    class="btn btn-outline-light flex-fill" type="button">Load</button>
            </div>
        </div>

        </div></div>
        `;

    this.htmlTail = '</div>';
};

extend(MainMenuState.prototype, {

    startListeners()
    {
        $('#button-play').click(() => {
            this.stateManager.app.engine.ux.startNewGame();
        });

        $('#button-load').click(() => {
            this.stateManager.setState('level-select');
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
        $('#button-play').off('click');
        $('#button-load').off('click');
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

export { MainMenuState, GameHeader };
