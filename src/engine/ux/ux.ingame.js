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

                const titles = currentTask.titles;
                const progressInCurrentTask = playerState.getProgressInCurrentTask();
                const rendererManager = this.app.engine.graphics.rendererManager;

                // check if we already started transitioning…
                if (playerState.getProgressInCurrentTask() >= titles.length)
                {
                    if (!rendererManager.isTransitioning)
                    // the renderer manager should have ended transitioning!
                    {
                        // call things to perform (level model logic)
                        const backend = this.app.model.backend;
                        currentTask.performWhenConditionMet(backend, this);

                        // go to next task!
                        playerState.resetProgressInCurrentTask(); // goto next set of tasks
                        playerState.incrementProgressInLevel(); // 1 level = n tasks
                    }
                    break;
                }

                // Smoothe in / out consecutive titles.
                const currentTitle = titles[progressInCurrentTask];
                const timeIn = this.ingameTimeSinceLastEvent;
                const fadeInTime = currentTask.fadeInTitle;
                const keepTime = currentTask.keepTitle;
                const fadeOutTime = currentTask.fadeOutTitle;
                if (timeIn < fadeInTime)
                {
                    rendererManager.setInTitleScene(true);
                    rendererManager.setTitleSceneText(currentTitle);
                    rendererManager.setTitleOpacity(timeIn / fadeInTime);
                }
                else if (timeIn < fadeInTime + keepTime)
                {
                    rendererManager.setInTitleScene(true);
                    rendererManager.setTitleSceneText(currentTitle);
                    rendererManager.setTitleOpacity(1.);
                }
                else if (timeIn < fadeInTime + fadeOutTime + keepTime)
                {
                    rendererManager.setInTitleScene(true);
                    rendererManager.setTitleSceneText(currentTitle);
                    rendererManager.setTitleOpacity(
                        1. - (timeIn - fadeInTime - keepTime) / fadeOutTime
                    );
                }
                else
                {
                    // go to next title!
                    this.ingameTimeSinceLastEvent = 0;
                    playerState.incrementProgressInCurrentTask();

                    // check if there are any titles left to be displayed…
                    if (playerState.getProgressInCurrentTask() >= titles.length)
                    {
                        // if not, transition out to next task!
                        if (!rendererManager.isTransitioning)
                        {
                            // set transition from title
                            rendererManager.setTransitionDuration(currentTask.fadeOutSplash);
                            rendererManager.startSceneTransition(false);
                        }
                    }
                }

                // console.log('[UX] Splash progress.');
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
