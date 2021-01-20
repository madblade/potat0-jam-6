/**
 * (c) madblade 2021
 */

import                './style/app.css';

import { Game } from './game';

window.register = (function()
{
    let app = new Game.Core();
    app.start();
    return app.register;
}());
