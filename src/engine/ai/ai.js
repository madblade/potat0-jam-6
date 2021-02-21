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
        // console.log('IA update');
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
