
'use strict';

class TimeUtils
{
    static getTimeSecMillis()
    {
        const performance = global.performance || {};
        const performanceNow =
            performance.now        ||
            performance.mozNow     ||
            performance.msNow      ||
            performance.oNow       ||
            performance.webkitNow  ||
            function() { return new Date().getTime(); };

        let clocktime = performanceNow.call(performance) * 1e-3;
        let nanoseconds = Math.floor(clocktime % 1 * 1e9);
        return nanoseconds / 1e6;
    }

    static getTimeSecNano(arg)
    {
        const performance = global.performance || {};
        const performanceNow =
            performance.now        ||
            performance.mozNow     ||
            performance.msNow      ||
            performance.oNow       ||
            performance.webkitNow  ||
            function() { return new Date().getTime(); };

        let hrt = function(previousTimestamp)
        {
            let clocktime = performanceNow.call(performance) * 1e-3;
            let seconds = Math.floor(clocktime);
            let nanoseconds = Math.floor(clocktime % 1 * 1e9);
            if (previousTimestamp) {
                seconds = seconds - previousTimestamp[0];
                nanoseconds = nanoseconds - previousTimestamp[1];
                if (nanoseconds < 0) {
                    seconds--;
                    nanoseconds += 1e9;
                }
            }
            return [seconds, nanoseconds];
        };

        return hrt(arg);
    }
}

export default TimeUtils;
