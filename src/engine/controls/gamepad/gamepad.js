/**
 * Handles Gamepad API.
 */

'use strict';

import { GamepadListenerModule } from './listeners';
import extend                    from '../../../extend';

let GamepadModule = {

    startGamepadListeners()
    {
    },

    stopGamepadListeners()
    {
    },

    updateControlsGamepadDevice()
    {
        // Right stick: camera movement
        this.rotateCameraFromRightStickGamepad();

        // Left stick: player movement
        this.movePlayerFromLeftStickGamepad();
    }

};

extend(GamepadModule, GamepadListenerModule);

export { GamepadModule };
