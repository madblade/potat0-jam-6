/**
 * Mouse config entrypoint.
 */

'use strict';

import extend                   from '../../../extend';

import { FirstPersonModule }    from './first-person';
import { ListenerModule }       from './listeners';
import { PointerLockModule }    from './pointerlockedcontrols';

let MouseModule = {

    setupMouse()
    {
        this.buttons = Object.freeze({left: 1, middle: 2, right: 3});

        // Click / move handlers.
        this.setupPointerLock();
    },

    startMouseListeners()
    {
        if (this.isTouch)
            console.warn('[Keyboard] requested keyboard listeners on a touch device.');

        this.registerMouseMove();
        this.registerMouseDown();
        this.registerMouseUp();
        this.registerMouseWheel();
    },

    stopMouseListeners()
    {
        this.unregisterMouseMove();
        this.unregisterMouseDown();
        this.unregisterMouseUp();
        this.unregisterMouseWheel();
    }

};

// Pack module.
extend(MouseModule, ListenerModule);
extend(MouseModule, FirstPersonModule);
extend(MouseModule, PointerLockModule);

export { MouseModule };
