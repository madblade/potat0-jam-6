/**
 * List, join, request game creation in a given server.
 */

'use strict';

import extend, { inherit }  from '../../extend';

import { $ }                from '../../modules/polyfills/dom';
import { GameHeader }       from './mainmenu';
import { GamepadNavigable } from '../../modules/navigation/navigable.gamepad';

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
        <!-- <div class="input-group">-->
        <!--     <div class="input-group-prepend mb-1 flex-fill">-->
        <!--         <span class="input-group-text flex-fill">Last Checkpoint</span>-->
        <!--     </div>-->
        <!--     <div class="input-group-append mb-1">-->
        <!--         <button class="btn btn-outline-light"-->
        <!--             id="button-resume" style="float:none">-->
        <!--             Charger-->
        <!--         </button>-->
        <!--     </div>-->
        <!-- </div>-->

        <!-- <div class="input-group">-->
        <!--     <div class="custom-file">-->
        <!--         <input type="file" class="custom-file-input" id="load-game-path" disabled>-->
        <!--         <label class="custom-file-label" for="customFileLang">Import Save File (coming soon)</label>-->
        <!--     </div>-->

        <!--     <div class="input-group-append mb-1">-->
        <!--         <button class="btn btn-outline-light" id="button-load-game" style="float:none" disabled>-->
        <!--             Import-->
        <!--         </button>-->
        <!--     </div>-->
        <!-- </div>-->

        <div class="input-group">
            <button class="btn btn-outline-secondary btn-block" id="return">
                Retour
            </button>
        </div>
    </div>
      `;

    // This is a menu, we need navigable functionality.
    const nbNavigableObjects = 2; // farthest and back
    GamepadNavigable.call(this, nbNavigableObjects);
};

inherit(LevelSelectState, GamepadNavigable);

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
            <hr/>
            <div class="noselect"
            style="width:100%"><div class="row">`;

        const app = this.stateManager.app;
        const levels = app.model.levels.getLevels();

        if (levels)
        {
            const nbLevels = levels.length;
            const ux = app.engine.ux;
            const maxLevel = ux.playerState.getFarthestLevel();

            for (let l = 0; l < nbLevels; ++l)
            {
                const level = levels[l];
                const enabled = level.getID() <= maxLevel;
                const levelTitle = enabled ? level.getTitle() : '???';

                content += `
                    <div class="col col-4">
                        <div class="input-group">
                            <div class="input-group-prepend mb-1 flex-fill">
                                <span class="input-group-text flex-fill">${levelTitle}</span>
                            </div>
                            <div class="input-group-append mb-1">
                                <button class="btn btn-outline-light level-join"
                                    id="button-join-level-${l}" style="float:none"  ${enabled ? '' : 'disabled'}>
                                    Charger
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        content += '</div></div>';
        return content;
    },

    start()
    {
        // Add content then fade in.
        let announce = $('#announce');
        announce.empty()
            .removeClass()
            .addClass('level-select')
            .append(
                this.htmlHead +
                this.getInstancesHTMLContainer() +
                this.getCommandsHTML()
            )
            // .css('position', '')
            // .fadeIn();
            .center()
            .show();

        // Retrieve nb of navigable menus.
        const ux = this.stateManager.app.engine.ux;
        const maxLevel = ux.playerState.getFarthestLevel();
        this.maxActiveItem = 2 + // return & load farthest
            (maxLevel + 1) - // selectable levels
            1; // starts at 0

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
            if (level.getTitle() === 'Générique')
                ux.app.engine.audio.playCredits();
            else
                ux.app.engine.audio.playMusic();
            ux.joinLevel(level);
        });

        // $('#button-resume').click(function() {
        //     let ux = app.engine.ux;
        //     ux.joinFarthestCheckpoint();
        // });
    },

    startListeners()
    {
        let app = this.stateManager.app;

        this.startTableListeners();

        $('#return').click(function() {
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

        // Clear announce.
        return new Promise(function(resolve) {
            let announce = $('#announce');
            // announce.fadeOut(200, function() {
            announce.empty().removeClass('hub');
            resolve();
            // });
        });
    },

    // Gamepad navigation

    navigate(navigationOptions)
    {
        this.super.navigate.call(this, navigationOptions);

        if (navigationOptions === 'back')
            $('#return').trigger('click');
    },

    selectItems()
    {
        const app = this.stateManager.app;
        const levels = app.model.levels.getLevels();

        const selectableItems = [];

        if (levels)
        {
            // const nbLevels = levels.length;
            const ux = app.engine.ux;
            const maxLevel = ux.playerState.getFarthestLevel();
            for (let i = 0; i <= maxLevel; ++i)
            {
                const lid = `#button-join-level-${i}`;
                selectableItems.push($(lid));
            }
        }

        // selectableItems.push($('#button-resume'));
        selectableItems.push($('#return'));

        return selectableItems;
    }

});

export { LevelSelectState };
