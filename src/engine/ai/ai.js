/**
 * AI.
 */

import extend       from '../../extend';

let AI = function(app)
{
    this.app = app;
};

extend(AI.prototype, {

    refresh()
    {
        // console.log('IA update');
    },

});

export { AI };
