/**
 * AI.
 */

'use strict';

import extend       from '../../extend';

let AI = function(app)
{
    this.app = app;

    this.intelligentEntities = new Map();

    this._debug = false;
};

extend(AI.prototype, {

    refresh()
    {
        // XXX IA update / targets / cooldown / etc.
        const entities = this.intelligentEntities;

        entities.forEach((e, id) =>
        {
            if (this._debug)
                console.log(`${e}, ${id}`);
        });
    },

    cleanupFullAI()
    {
        this.intelligentEntities.clear();
    }

});

export { AI };
