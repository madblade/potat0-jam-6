/**
 * User experience.
 * Manages level loading, save, difficulty, etc.
 */

'use strict';

import extend from '../../extend';

let Checkpoint = function(level)
{
    this.level = level;
    this.levelState = null;
    this.playerState = null;
};

extend(Checkpoint.prototype, {

    getLevel()
    {
        return this.level;
    },

    copyLevelState()
    {
        // TODO [HIGH] copy level state
    },

    copyPlayerState()
    {
        // TODO [HIGH] copy player state
    },

});

export { Checkpoint };
