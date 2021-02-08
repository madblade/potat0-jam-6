/**
 * Manages time seen from the user’s perspective.
 * Doesn’t manage physics’ time.
 */

let UXTimeModule = {

    setupClocks()
    {
        this.paused = true;
        this.timeAppStarted = Date.now();
        this.timeNow = this.timeAppStarted;
        // this.elapsedSinceAppStarted = this.timeAppStarted;
        this.timeOfLastIngameFrame = 0;
        this.elapsedSinceLastIngameFrame = 0;

        this.totalIngameTime = 0;
        this.ingameTimeSinceLastEvent = 0;
    },

    refreshClocks()
    {
        this.timeNow = Date.now();

        if (!this.paused)
        {
            if (this.timeOfLastIngameFrame)
                this.elapsedSinceLastIngameFrame = this.timeNow -
                    this.timeOfLastIngameFrame;
            else
                this.timeOfLastIngameFrame = 0;

            this.timeOfLastIngameFrame = this.timeNow;
            const elapsed = this.elapsedSinceLastIngameFrame;
            this.totalIngameTime += elapsed;
            this.ingameTimeSinceLastEvent += elapsed;
            this.refreshIngame();
        }
    },

    setGamePaused(paused)
    {
        this.paused = paused;
        if (paused) this.timeOfLastIngameFrame = 0;
        else this.timeOfLastIngameFrame = Date.now();
    },

    isGamePaused()
    {
        return this.paused;
    },

    getElapsed()
    {
        return this.elapsedSinceLastIngameFrame;
    },

};

export { UXTimeModule };
