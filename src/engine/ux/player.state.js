/**
 * Handles player progress, state, objectives.
 */
import extend from '../../extend';

let PlayerState = function()
{
    this.level = null; // (game level, not an RP level)
    this.unlockedLevels = 0;
};

extend(PlayerState.prototype, {

    setLevel(newLevel)
    {
        this.level = newLevel;
        const levelID = newLevel.getID(); // IDs must be ordered!
        this.unlockedLevels = Math.max(levelID, this.unlockedLevels);
    }

});

export { PlayerState };
