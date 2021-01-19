/**
 * (c) madblade 2021
 */

// TODO ACESFilmicToneMapping

import { Game } from './game';

window.register = (function()
{
    let app = new Game.Core();
    app.start();
    return app.register;
}());
