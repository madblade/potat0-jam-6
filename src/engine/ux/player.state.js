/**
 * Handles player progress, state, objectives.
 */
import extend from '../../extend';

let PlayerState = function()
{
    this.level = null; // (game level, not an RP level)
    this.unlockedLevels = 0;

    this.progressInLevel = 0;
    this.progressInCurrentTask = 0;
};

extend(PlayerState.prototype, {

    // Levels
    // 1 level = 1 transition screen

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
    },

    resetProgressInLevel()
    {
        this.progressInLevel = 0;
    },

    // Tasks
    // (e.g. transition title number, level subtasks)

    getProgressInCurrentTask()
    {
        return this.progressInCurrentTask;
    },

    incrementProgressInCurrentTask()
    {
        this.progressInCurrentTask++;
    },

    resetProgressInCurrentTask()
    {
        this.progressInCurrentTask = 0;
    }

});

export { PlayerState };
