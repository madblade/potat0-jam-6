/**
 * Animation management.
 *
 * I’m for hire!
 * github.com/madblade
 */

'use strict';

import extend, { assert }   from '../../../extend';

import { $ }                from '../../../modules/polyfills/dom';

import { AnimationModel }   from './animations.model';
import { AnimationOuter }   from './animations.outer';
import { AnimationMixers }  from './animations.mixers';
import { TextModule }       from './text';
import { FeedbackModule }   from './feedback';
import { SecondaryModule }  from './secondary';
import {
    AnimationMixer,
    Euler,
    Quaternion,
    Raycaster,
    Vector2,
    Vector3
}                           from 'three';

let AnimationManager = function(graphics)
{
    this.graphics = graphics;

    this.mixers = new Map();
    this.times = new Map();
    this.clips = new Map();

    // feedback.
    this.currentCameraPosition = new Vector3(0, 0, 0);
    this._q = new Quaternion();
    this.oldCameraPosition = new Vector3(0, 0, 0);
    this.newCameraPosition = new Vector3(0, 0, 0);
    this.oldPitchRotationX = 0;
    this.oldYawRotationZ = 0;
    this.newPitchRotationX = 0;
    this.newYawRotationZ = 0;
    this.trauma = 0;
    this.decayRate = 0;
    this.raycastables = [];
    this.raycaster = new Raycaster();

    // opt.
    this._w0 = new Vector3(0, 0, 0);
    this._w1 = new Vector3(0, 0, 0);
    this._w2 = new Vector3(0, 0, 0);
    this._e = new Euler();
    this._r = new Vector3();
    this._xy = new Vector2();
    this._mvpp = new Vector3(0, 0, 0);
    this._mvpq = new Quaternion();
    this._mvps = new Vector3(0, 0, 0);

    // flags.
    this._debug = true;
};

extend(AnimationManager.prototype, {

    initializeAnimations()
    {
        this.mixers = new Map();
        this.times = new Map();
        this.clips = new Map();
    },

    refresh(deltaT)
    {
        // Skinned / morphed mixers + secondary physics update.
        this.updateAnimations(deltaT);

        // IK / Secondary physics.
        this.updateSecondaryAnimations(deltaT);

        // Camera effects.
        this.updateCameraFeedback(deltaT);

        // Text element update.
        this.updateTextLabels(deltaT);
    },

    restore()
    {
        this.resetCameraFeedback();
    },

    updateAnimations(deltaT)
    {
        const backend = this.graphics.app.model.backend;
        const entitiesIngame = backend.entityModel.entitiesIngame;

        this.mixers.forEach((m, id) =>
        {
            const entityModel = id !== 0 ?
                entitiesIngame.get(id) :
                backend.selfModel;

            assert(!!entityModel, '[Animations] Lone animation mixer.');
            if (!entityModel) return;

            const animationComponent = entityModel.animationComponent;
            if (!animationComponent) return;

            this.updateEntityPosition(
                entityModel,
                animationComponent,
                deltaT
            );

            this.updateEntityRotationAndTilt(
                entityModel,
                animationComponent,
                deltaT
            );

            this.updateMixerAction(
                entityModel,
                animationComponent,
                m,
                deltaT
            );
        });

        // inefficient but whatever
        // shrink entities
        entitiesIngame.forEach(e => {
            if (e.isRotating)
            {
                // compute rotation
                // e.rotation.z += 0.1;
                const p = e.graphicalComponent.position;
                // const r = e.graphicalComponent.rotation;
                const dts = deltaT / 1e3;
                const d = Math.sqrt(p.x * p.x + p.y * p.y);
                let t = Math.atan2(p.y, p.x);
                t += 0.5 * dts;
                p.set(
                    d * Math.cos(t),
                    d * Math.sin(t),
                    p.z
                );
                e.graphicalComponent.rotation.z += dts;
                return;
            }

            if (e.finalAxolotlIndex)
            {
                const i = e.finalAxolotlIndex;
                const p = e.graphicalComponent.position;
                const dts = deltaT / 1e3;
                let tt = e.graphicalComponent.ttt || 0;
                tt += dts;
                e.graphicalComponent.ttt = tt;
                if (i === 1)
                    p.y = -5 + 2.7 * Math.sin(tt / 2);
                else if (i === 2)
                    p.y = -15 - 2.7 * Math.sin(tt / 2);
                return;
            }

            if (e.isFinalCup)
            {
                // Should be in sync with axolotls.
                const p = e.graphicalComponent.position;
                const dts = deltaT / 1e3;
                let tt = e.graphicalComponent.ttt || 0;
                tt += dts;
                e.graphicalComponent.ttt = tt;
                p.x = -20 - 8. * Math.sin(tt / 2);
                return;
            }

            if (!e.isShrinking) return;

            const s = e.shrinkTime + deltaT;
            const maxTime = 100; // in ms
            if (s > maxTime) return;
            e.shrinkTime = s;

            const newScale = 1 - s / maxTime;

            const o3d = e.graphicalComponent;
            if (!o3d || !o3d.scale) return;
            o3d.scale.set(
                newScale, newScale, newScale
            );
        });
    },

    updateAnimation(entityId)
    {
        const mixer = this.mixers.get(entityId);
        const prevTime = this.times.get(entityId);
        if (mixer) {
            const time = Date.now();
            mixer.update((time - prevTime) * 0.001);
            this.times.set(entityId, time);
        } else {
            // console.log('[Animations] Undefined mixer.');
        }
    },

    addSkinnedEntityAnimation(entityId, mesh, entityModel)
    {
        const mixers = this.mixers;
        const times = this.times;
        const mixer = new AnimationMixer(mesh);
        mixers.set(entityId, mixer);
        times.set(entityId, Date.now());
        this.setupMixer(entityId, mesh, mixer, entityModel);
    },

    cleanup()
    {
        // remove all text labels
        $('.text-label').empty().remove();
    }

});

extend(AnimationManager.prototype, AnimationModel);
extend(AnimationManager.prototype, AnimationOuter);
extend(AnimationManager.prototype, AnimationMixers);
extend(AnimationManager.prototype, TextModule);
extend(AnimationManager.prototype, FeedbackModule);
extend(AnimationManager.prototype, SecondaryModule);

export { AnimationManager };
