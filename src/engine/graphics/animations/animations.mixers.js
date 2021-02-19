/**
 * Holds logic for:
 * - walk / run (synchronized blend)
 * - jump
 * - crouch
 * - attack
 */

'use strict';

import { assert }  from '../../../extend';

import { Vector2 } from 'three';
import time        from '../../physics/mad/time';

let AnimationMixers = {

    setupMixer(entityId, mesh, mixer, entityModel)
    {
        // Animation data.
        let animationTracks = mesh.userData.animations;
        entityModel.actionStates = {};
        entityModel.actions = {};
        entityModel.tracks = {};
        entityModel.times = {};
        const actionStates = entityModel.actionStates;
        const actions = entityModel.actions;
        const tracks = entityModel.tracks;
        const times = entityModel.times;
        for (let i = 0; i < animationTracks.length; ++i)
        {
            const clip = animationTracks[i];
            const name = clip.name;
            actionStates[name] = 0.; // blend ratio
            const action = mixer.clipAction(clip);
            action.setEffectiveWeight(0);
            action.play();
            actions[name] = action;
            tracks[name] = clip;
            times[name] = clip.tracks[0].times;
        }

        // Utility data.
        entityModel.displacement = new Vector2(0, 0);
    },

    // walking / running:
    //   0 - reach left
    //   1 - pass right
    //   2 - reach right
    //   3 - pass left
    //   4 - reach left (=== 0)
    // idle / crouching
    //   0 - idle
    //   1 - half crouched
    //   2 - crouched
    // jumping
    //   0 - jumped
    //   1 - jump top / falling
    //   2 - reception
    //   3 - recovery from reception
    //   4 - idle
    updateMixerAction(
        entityModel,
        animationComponent,
        mixer,
        deltaTInMillis
    )
    {
        assert(!!animationComponent.actionStates,
            '[Mixers] Animation not properly initialized.'
        );
        const actions = animationComponent.actions;
        assert('Walking' in actions,
            '[Mixers] Walking animation not found.'
        );

        const cm = entityModel.physicsEntity.collisionModel;
        if (cm.isPreparingJump)
        {
            this.updatePrepareJump(
                cm, entityModel,
                animationComponent, mixer, deltaTInMillis
            );
            animationComponent.idleTime = 0;
            return;
        }
        if (cm.isJumping ||
            cm.hasJustLanded ||
            cm.isRecoveringFromLanding)
        {
            this.updateJump(
                cm, entityModel,
                animationComponent, mixer, deltaTInMillis
            );
            animationComponent.idleTime = 0;
            return;
        }

        const p0 = animationComponent.p0;
        const p1 = animationComponent.p1;
        const deltaP = animationComponent.displacement;
        deltaP.copy(p0).addScaledVector(p1, -1);
        const distanceTravelled = deltaP.length();

        if (distanceTravelled > 0.00001)
        {
            // TODO if idle time > limit idle time
            //  then reset animation to start.
            this.updateWalkRunCycle(
                cm, distanceTravelled, entityModel,
                animationComponent, mixer, deltaTInMillis
            );
            animationComponent.idleTime = 0;
        }
        else
        {
            this.updateToIdle(
                entityModel,
                animationComponent, mixer, deltaTInMillis
            );
        }
    },

    updateOtherAnimationWeights(
        newWeight,
        animationName,
        actions)
    {
        if (newWeight === 1)
        {
            for (let ai in actions) {
                if (ai === animationName) continue;
                actions[ai].setEffectiveWeight(0);
            }
            return;
        }

        // Compute sum.
        let sum = 0;
        for (let ai in actions) {
            if (ai === animationName) continue;
            const action = actions[ai];
            sum += action.getEffectiveWeight();
        }

        // Correct glitch on gamepad.
        if (sum + newWeight < 1)
        {
            if (sum < 0.01 && newWeight < 1)
                actions[animationName].setEffectiveWeight(1);
        }

        // Reduce other actions.
        const remainder = 1 - newWeight;
        if (sum > 0)
        {
            for (let ai in actions) {
                if (ai === animationName) continue;
                const action = actions[ai];
                const proportionalWeight = action.getEffectiveWeight() / sum;
                action.setEffectiveWeight(remainder * proportionalWeight);
            }
        }
    },

    updateToIdle(
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        // console.log('idle');
        const actions = animationComponent.actions;
        const idleAction = actions['Idle'];
        const times = animationComponent.times['Idle'];
        const cycleDuration = times[times.length - 1];

        const deltaTInSecs = deltaT / 1e3;
        animationComponent.idleTime += deltaTInSecs;
        const idleTime = animationComponent.idleTime;
        const maxIdleTime = animationComponent.timeToIdle;
        let idleBlendRatio = this.clamp(idleTime / maxIdleTime, 0., 1.);

        // Blend toward idle.
        let oldWeight = idleAction.getEffectiveWeight();
        if (idleBlendRatio < oldWeight) idleBlendRatio = oldWeight;
        idleAction.setEffectiveWeight(idleBlendRatio);

        // Reduce other animations.
        this.updateOtherAnimationWeights(
            idleBlendRatio, 'Idle', actions
        );

        mixer.update(0.2 * deltaTInSecs * cycleDuration);
    },

    updateWalkRunCycle(
        cm,
        distanceTravelled,
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        // console.log('walk');
        // console.log(distanceTravelled);
        const actions = animationComponent.actions;
        const runningAction = actions['Running'];
        const times = animationComponent.times['Running'];
        const cycleDuration = times[times.length - 1];

        const normalizedDelta = distanceTravelled / 4;
        const deltaTInSeconds = deltaT / 1e3;
        const speed = distanceTravelled / deltaTInSeconds;
        const maxSpeed = cm.maxSpeedInAir;
        let speedRatio = this.clamp(speed / maxSpeed, 0., 1.);
        // speedRatio *= speedRatio;

        // const stepSize = distanceTravelled; //(speedRatio) * 4;
        // const progressInStep = distanceTravelled / stepSize;
        // const actionDelta = progressInStep * cycleDuration;
        const r2 = 1. + 0.7 * Math.pow(speedRatio, 2.);
        const actionDelta =
            r2 * deltaTInSeconds * cycleDuration;

        // Blend toward run.
        const ratio = Math.pow(speedRatio, 0.5);
        runningAction.setEffectiveWeight(ratio);

        // Reduce other animations.
        this.updateOtherAnimationWeights(
            ratio, 'Running', actions
        );

        // TODO smoothstep run palliers
        // TODO bounce
        // const maxTime = cycleDuration;// * 4 / 6;
        // const time = mixer.time % cycleDuration;
        // let newTime = time + actionDelta;
        // newTime = Math.max(newTime, maxTime);
        // mixer.setTime(newTime);
        mixer.update(actionDelta);
    },

    updatePrepareJump(
        cm,
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        console.log('to prepare');
        const actions = animationComponent.actions;
        const crouchingAction = actions['Crouching'];
        const times = animationComponent.times['Running'];
        const cycleDuration = times[times.length - 1];

        const deltaTInSecs = deltaT / 1e3;
        const current = cm.timeSincePreparedJump + deltaTInSecs;
        const max = cm.timeToPrepareJump;
        let normalizedT = this.clamp(current / max, 0., 1.);
        // normalizedT /= 6;

        crouchingAction.setEffectiveWeight(normalizedT);

        // reduce other weights
        this.updateOtherAnimationWeights(
            normalizedT, 'Crouching', actions
        );

        mixer.update(0.2 * deltaTInSecs * cycleDuration);
    },

    updateJump(
        cm,
        entityModel,
        animationComponent,
        mixer,
        deltaT
    )
    {
        // console.log('jump');
        const actions = animationComponent.actions;
        const jumpingAction = actions['Jumping'];
        const times = animationComponent.times['Jumping'];
        const cycleDuration = times[times.length - 1];

        const deltaTInSecs = deltaT / 1e3;

        jumpingAction.setEffectiveWeight(1);
        this.updateOtherAnimationWeights(
            1, 'Jumping', actions
        );

        const oldVZ = animationComponent.v1.z;
        const newVZ = animationComponent.v0.z;
        // if (oldVZ < 0 && newVZ > 0) {
        //     cm.timeSinceFallStarted = 0;
        // }

        cm._maxVZ = Math.max(cm._maxVZ, -newVZ);
        let capVZ = cm._maxVZ / 2;
        // const startedDecelerating = newVZ > 0;
        const startedDecelerating = -oldVZ > capVZ && -newVZ < capVZ;
        if (startedDecelerating)
        {
            cm.timeSinceFallStarted = 0;
        }
        const continuedDecelerating = -newVZ < capVZ;

        if (cm.hasJustLanded || cm.isRecoveringFromLanding)
        {
            cm.hasJustLanded = false;
            cm.isRecoveringFromLanding = true;

            cm.timeSinceHasLanded += deltaTInSecs;
            const maxTime = cm.timeToRecoverFromLanding;
            const ratio = this.clamp(
                cm.timeSinceHasLanded / maxTime, 0, 1
            );
            const smoothed = this.smoothstepAttack(0, 1, ratio);
            const start = 0.25 * cycleDuration;
            const end = cycleDuration;
            const dur = end - start;
            const nt = start + dur * smoothed;
            mixer.setTime(nt);

            if (ratio === 1)
            {
                jumpingAction.setEffectiveWeight(0);
                actions['Idle'].setEffectiveWeight(1);
                mixer.update(0);
                cm.timeSinceHasLanded = 0;
                cm.isRecoveringFromLanding = false;
            }
            return;
        }

        if (startedDecelerating || continuedDecelerating)
        {
            cm.timeSinceFallStarted += deltaTInSecs;
            // from jumping upwards to falling
            const maxTime = 0.25 * cycleDuration;
            const ratio = this.clamp(
                cm.timeSinceFallStarted / cm.timeToSetFallState, 0, 1
            );
            let r = this.smoothstep(0, 1, ratio);
            const newTime = r * maxTime;
            mixer.setTime(newTime);
            return;
        }

        // other cases: it’s just starting to jump
        mixer.setTime(0);
    }

};

export { AnimationMixers };
