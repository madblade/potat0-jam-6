/**
 * Loading state.
 */

'use strict';

import extend  from '../../extend';

import { $ }   from '../../modules/polyfills/dom';

let LoadingState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'loading';
    this.html = `
        <div class="container"> <div class="col-12">

            <div class="flex-fill title noselect loading-menu">
                <p>Chargement…</p>
            </div>
            <div class="flex-fill loading-menu" id="loading-task"></div>
            <div class="flex-fill progress">
                <div id="loading-progress" class="progress-bar progress-bar-striped"
                    role="progressbar"
                    aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                </div>
            </div>
            <div class="loading-menu" id="loading-file"></div>

        </div> </div>
        `;

    this.progressElement = null;
    this.taskElement = null;
};

extend(LoadingState.prototype, {

    start()
    {
        $('#announce')
            .empty()
            .removeClass()
            .addClass('main-menu')
            .append(this.html)
            .css('position', '')
            .show();

        this.progressElement = $('#loading-progress');
        this.taskElement = $('#loading-task');
    },

    end()
    {
        return new Promise(function(resolve) {
            const loader = $('#announce');
            // loader.fadeOut(200, function() {
            loader.empty();
            resolve();
            // });
        });
    },

    notifyTaskName(taskName)
    {
        if (this.taskElement)
            this.taskElement.html(`Chargement des fichiers “${taskName}”…`);
    },

    notifyProgress(url, itemsLoaded, itemsTotal)
    {
        const newProgress = Math.floor(
            100 * parseFloat(itemsLoaded) / parseFloat(itemsTotal)
        );
        if (!this.progressElement)
            this.progressElement = $('#loading-progress');
        if (this.progressElement)
            this.progressElement
                .attr('aria-valuenow', newProgress)
                .css('width', `${newProgress}%`);

        const fileElement = $('#loading-file');
        if (fileElement) fileElement.html(url);
    },

    notifyError(url)
    {
        console.log(`[States/Loading] There was an error loading ${url}.`);
    },

    navigate() {}, // does nothing while loading

});

export { LoadingState };
