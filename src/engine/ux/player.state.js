/**
 * Handles player progress, state, objectives.
 */
import extend from '../../extend';

let PlayerState = function()
{
    this.level = null; // (game level, not an RP level)
    this.unlockedLevels = 0;

    this.progressInLevel = 0;
};

extend(PlayerState.prototype, {

    setLevel(newLevel)
    {
        this.level = newLevel;
        const levelID = newLevel.getID(); // IDs must be ordered!

        // Update unlocked levels.
        this.unlockedLevels = Math.max(levelID, this.unlockedLevels);

        // Reset progress in loaded level.
        this.progressInLevel = 0;
    },

    getLevel()
    {
        return this.level;
    },

    getProgressInLevel()
    {
        return this.progressInLevel;
    },

    incrementProgressInLevel()
    {
        this.progressInLevel++;
    }

});

export { PlayerState };
