/**
 * AI.
 */

'use strict';

import extend       from '../../extend';

let AI = function(app)
{
    this.app = app;

    this.intelligentEntities = new Map();
};

extend(AI.prototype, {

    refresh()
    {
        // console.log('IA update');
        const entities = this.intelligentEntities;

        let updates = '';
        entities.forEach((e, id) =>
        {
            updates += `${e}, ${id}`;
        });
        console.log(updates);
    },

});

export { AI };
