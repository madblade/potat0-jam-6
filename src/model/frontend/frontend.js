/**
 * Manages whatever mechanism must remain client-side (like interaction settings),
 * along with aggregating, filtering and triggering events
 * to be sent.
 */

'use strict';

import extend               from '../../extend';

import { SelfComponent }    from './self/self';
import { EventComponent }   from './event/event';

let FrontEnd = function(app)
{
    this.app = app;

    // FrontEnd model component.
    this.selfComponent = new SelfComponent(this);

    // Event component.
    this.eventComponent = new EventComponent(this);
};

extend(FrontEnd.prototype, {

    init()
    {
        this.selfComponent.init();
        this.eventComponent.init();
    },

    refresh()
    {
        this.selfComponent.processChanges();
        this.eventComponent.pushEvents();
    },

    pushForLaterUpdate(position)
    {
        this.selfComponent.triggerChange('camera-update', position);
    },

    triggerEvent(type, action, data)
    {
        this.eventComponent.triggerEvent(type, action, data);
    },

    triggerChange(type, data)
    {
        this.selfComponent.triggerChange(type, data);
    },

    /**
     * @deprecated
     */
    getCameraInteraction()
    {
        return this.selfComponent.cameraInteraction;
    },

    cleanupFullModel()
    {
        this.selfComponent.cleanup();
    }

});

export { FrontEnd };
