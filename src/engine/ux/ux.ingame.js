/**
 * Manages in-game experience / scenario / events.
 */

let UXIngameModule = {

    refreshIngame()
    {
        const playerState = this.playerState;
        const level = playerState.getLevel();
        if (!level) {
            console.log('[UX] Player level not found');
            return;
        }
        const progressInLevel = playerState.getProgressInLevel();
        const scenario = level.getScenario();
        const currentTask = scenario[progressInLevel];

        switch (currentTask.type)
        {
            case 'splash':
                // TODO graphics timeout / fade out
                console.log('[UX] Splash progress.');
                break;
            case 'event':
                // TODO check task progress
                console.log('[UX] Event progress.');
                break;
            default:
                console.log('[UX] Task not recognized.');
                break;
        }
    }

};

export { UXIngameModule };
