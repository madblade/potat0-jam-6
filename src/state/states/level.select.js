/**
 * List, join, request game creation in a given server.
 */

'use strict';

import extend         from '../../extend.js';
import { $ }          from '../../modules/polyfills/dom.js';
import { GameHeader } from './mainmenu';

let LevelSelectState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'level-select';

    this.htmlHead = `
    <div class="container">
        ${GameHeader}
    `;

    this.htmlControls = `
    <div class="container">

        <hr />

        <!-- Current progress -->
        <div class="input-group">
            <div class="input-group-prepend mb-1 flex-fill">
                <span class="input-group-text flex-fill">Farthest Checkpoint</span>
            </div>
            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light"
                    id="button-resume" style="float:none">
                    Play
                </button>
            </div>
        </div>

        <!-- TODO LOAD from save state -->
        <div class="input-group">
            <div class="custom-file">
                <input type="file" class="custom-file-input" id="load-game-path" disabled>
                <label class="custom-file-label" for="customFileLang">Import Save File (coming soon)</label>
            </div>

            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light" id="button-load-game" style="float:none" disabled>
                    Import
                </button>
            </div>
        </div>

        <hr />

        <div class="input-group">
            <button class="btn btn-outline-light btn-block" id="button-return-main">
                Back
            </button>
        </div>
    </div>
      `;
};

extend(LevelSelectState.prototype, {

    getCommandsHTML()
    {
        return this.htmlControls;
    },

    getInstancesHTMLContainer()
    {
        return `
            <div class="container" id="game-instances-table">
                ${this.getInstancesHTMLTable()}
            </div>
        `;
    },

    getInstancesHTMLTable()
    {
        let content = `
            <table class="table table border rounded noselect"
            style="width:100%">`;

        let levels = this.stateManager.app.model.levels.getLevels();

        if (levels)
            for (let l = 0; l < levels.length; ++l)
            {
                const level = levels[l];
                content += `
                    <div class="input-group">
                        <div class="input-group-prepend mb-1 flex-fill">
                            <span class="input-group-text flex-fill">${level.getTitle()}</span>
                        </div>
                        <div class="input-group-append mb-1">
                            <button class="btn btn-outline-light level-join"
                                id="button-join-level-${l}" style="float:none">
                                Play
                            </button>
                        </div>
                    </div>
                `;
            }

        content += '</table>';
        return content;
    },

    start()
    {
        // Add content then fade in.
        let hub = $('#announce');
        hub.empty()
            .removeClass()
            .addClass('hub')
            .append(
                this.htmlHead +
                this.getInstancesHTMLContainer() +
                this.getCommandsHTML()
            )
            .css('position', '')
            .fadeIn();

        // Add listeners.
        this.startListeners();
    },

    startTableListeners()
    {
        let app = this.stateManager.app;

        $('.level-join').click(function() {
            let buttonId = $(this).attr('id');
            let levelIdString = buttonId.substring('button-join-level-'.length);
            let levelId = parseInt(levelIdString, 10);
            let ux = app.engine.ux;
            let level = app.model.levels.getLevel(levelId);
            ux.joinLevel(level);
        });

        $('#button-resume').click(function() {
            let ux = app.engine.ux;
            ux.joinFarthestCheckpoint();
        });
    },

    startListeners()
    {
        let app = this.stateManager.app;

        this.startTableListeners();

        $('#button-return-main').click(function() {
            // Necessary to disconnect from WebRTC socket
            // (among, possibly, other things).
            app.setState('main');
        });

        // XXX To implement: saving / loading
        // $('#button-load-game').click(function() {
        // load-game-path
        // });
    },

    stopTableListeners()
    {
        $('.level-join').off('click');
    },

    stopListeners()
    {
        this.stopTableListeners();
        $('#button-return-main').off('click');
        // $('#button-load-game').off('click');
    },

    end()
    {
        // Remove jQuery listeners.
        this.stopListeners();

        // Fade out hub announce.
        return new Promise(function(resolve) {
            let hub = $('#announce');
            hub.fadeOut(200, function() {
                hub.empty().removeClass('hub');
                resolve();
            });
        });
    }

});

export { LevelSelectState };
