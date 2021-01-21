/**
 * User experience.
 * Manages level loading, save, difficulty, etc.
 */

'use strict';

import $                    from 'jquery';

import extend               from '../../extend.js';

let UX = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};
    this.settings = {};
};

extend(UX.prototype, {
    // TODO manage level loading, saves, difficulty here.
});

export { UX };
