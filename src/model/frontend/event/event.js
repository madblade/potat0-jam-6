/**
 * Frontend output,
 * where events are pushed to the server / physics engine / game logic component.
 */

'use strict';

import extend                   from '../../../extend';

import { TriggersModule }       from './event.triggers';
import { ActiveControlsModule } from './event.activecontrols';

let EventComponent = function(clientModel)
{
    this.clientModel = clientModel;

    this.eventsToPush = [];
    this.activeControls = {};
    this.numberOfEvents = 0;

    this.maxNumberOfEventsPer16ms = 10000;
    // Unlimited events for solo-mode
    // (and we know Chrome likes to fire mouse events much faster than animationFrame)
    // (also likes to generate garbage with every new animationFrame call)
    // (if you are from the V8 team and read this, please consider fixing
    //  https://bugs.chromium.org/p/chromium/issues/detail?id=120186)
};

extend(EventComponent.prototype, {

    init()
    {
        // XXX [REFACTOR] put this in self model
        this.activeControls = this.getActiveControls();
    },

    triggerEvent(type, action, data)
    {
        switch (type)
        {
            case 'm':
                this.triggerMovement(type, action, data);
                break;
            case 'a':
                this.triggerAction(type, action);
                break;
            case 'r':
                this.triggerRotation(type, action);
                break;
            case 'u': // use item
                this.triggerUse(type, action);
                break;
            case 'ray': // Ray casted.
                this.triggerRayAction(type, action);
                break;
            default:
                break;
        }

        // Refresh, count transmitted items, if > threshold, stock them
        this.numberOfEvents++;
    },

    pushEvents()
    {
        let events = this.eventsToPush;

        let maxNumberOfEvents = this.maxNumberOfEventsPer16ms;
        if (this.numberOfEvents > maxNumberOfEvents) {
            this.filterEvents(); // Remove unnecessary events.
            console.log(`Calm down, user... ${this.numberOfEvents} unstacked events detected.`);
        }

        // Push to server
        // XXX [PERF] simplify and aggregate per client.
        for (let eventId = 0, length = events.length; eventId < length; ++eventId)
        {
            let currentEvent = events[eventId];
            // connectionEngine.send(currentEvent[0], currentEvent[1]);
            // TODO [CRIT] send proper events to PhysicsEngine
            let physics = this.clientModel.app.engine.physics;
            physics.pushEvent(currentEvent);
        }

        // Flush
        this.eventsToPush = [];
        this.numberOfEvents = 0;
    },

    getEventsOfType(type)
    {
        let events = this.eventsToPush;
        let result = [];

        // N.B. prefer straight cache-friendly traversals
        for (let eventId = 0, length = events.length; eventId < length; ++eventId) {
            let currentEvent = events[eventId];

            if (currentEvent[0] === type) {
                result.push(currentEvent);
            }
        }

        return result;
    },

    filterEvents()
    {
        let events = this.eventsToPush;
        let filteredEvents = [];
        let lastRotation;

        // Remove all rotations except the last.
        for (let i = 0, l = events.length; i < l; ++i) {
            let currentEvent = events[i];
            if (!currentEvent) continue;
            if (currentEvent[0] !== 'r') {
                lastRotation = events[i];
            }
            else {
                filteredEvents.push(currentEvent);
            }
        }

        filteredEvents.push(lastRotation);
        this.eventsToPush = filteredEvents;
    }

});

extend(EventComponent.prototype, TriggersModule);
extend(EventComponent.prototype, ActiveControlsModule);

export { EventComponent };
