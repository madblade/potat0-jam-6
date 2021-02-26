/**
 * Entity model component.
 */

'use strict';

import extend, { assert }   from '../../../extend';

import { Vector3 }          from 'three';

let Entity = function(id, graphicalComponent, worldId)
{
    this.id = id;
    this.worldId = worldId;

    this.position = new Vector3(0, 0, 0);
    this.rotation = new Vector3(0, 0, 0);
    this.needsUpdate = true;
    this.useInterpolation = false; // this would be used for multiplayer

    this.isProjectile = false;
    this.inScene = false;
    this.helper = null;

    // Graphics
    this.graphicalComponent = graphicalComponent;
    this.shrinkTime = 0.;
    this.isShrinking = false;
    this.textComponent = null;

    // Animations
    this.animationComponent = Object.create(null);
    this.bounceAmount = 0;
    this.originalZ = 0;

    // Physics
    this.physicsEntity = null;

    // IA
    this.intelligence = null;

    // Cache
    this._r = new Vector3(0, 0, 0);
};

extend(Entity.prototype, {

    getHelper()
    {
        return this.helper;
    },

    setHelper(object3D)
    {
        this.helper = object3D;
    },

    getObject3D()
    {
        return this.graphicalComponent;
    },

    getTheta()
    {
        assert(!!this.graphicalComponent,
            '[EntityModel] Cannot get graphical component.'
        );
        return this.graphicalComponent.getInnerObject().rotation.y;
    },

    setRotation(r, gc)
    {
        if (!gc) gc = this.graphicalComponent;
        const object = gc.getInnerObject();
        gc.rotation.x = r.x + Math.PI / 2;
        gc.rotation.y = r.y + 0;

        object.rotation.y = r.z;
    },

    getRotation()
    {
        const gc = this.graphicalComponent;
        assert(!!gc,
            '[EntityModel] Cannot get graphical component.'
        );
        if (!gc) return;
        const object = gc.getInnerObject();
        this._r.set(
            gc.rotation.x,
            gc.rotation.y,
            object.rotation.y
        );
        return this._r;
    },

    getRotationX()
    {
        assert(!!this.graphicalComponent,
            '[SelfModel] Cannot get graphical component.'
        );
        return this.avatar.rotation.x;
    },

    getRotationY()
    {
        assert(!!this.graphicalComponent,
            '[SelfModel] Cannot get graphical component.'
        );
        return this.graphicalComponent.rotation.y;
    },

    setBounceAmount(amount)
    {
        this.bounceAmount = amount;
        this.graphicalComponent.position.z = this.originalZ + amount;
    },

    getBounceAmount()
    {
        return this.bounceAmount;
    },

    getWorldId()
    {
        return this.worldId;
    },

    setWorldId(worldId)
    {
        this.worldId = worldId;
    },

    getTime()
    {
        return window.performance.now();
    },

    initInterpolation()
    {
        this.useInterpolation = true;
        // Setup interpolation routines
        this.lastUpdateTime = this.getTime();
        this.averageDeltaT = this.lastUpdateTime;
        this.lastServerUpdateTime = this.lastUpdateTime;
        this.lastPFromServer = new Vector3(0, 0, 0);
        this.currentPFromServer = new Vector3(0, 0, 0);
        this.interpolatingP = new Vector3(0, 0, 0);
        this.lastRFromServer = new Vector3(0, 0, 0);
        this.currentRFromServer = new Vector3(0, 0, 0);
        this.interpolatingR = new Vector3(0, 0, 0);
    }

});

export { Entity };
