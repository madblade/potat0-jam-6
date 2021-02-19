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
    //   0 - idle
    //   1 - crouch before jump
    //   2 - jumped
    //   3 - jump top / falling
    //   4 - reception
    //   5 - recovery from reception
    //   6 - idle
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
        if (cm.isJumping)
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

    updateToIdle(
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        // console.log('to idle');
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
        let sum = idleBlendRatio;
        for (let ai in actions)
        {
            if (ai === 'Idle') continue;
            const action = actions[ai];
            const blendRatio = action.getEffectiveWeight();
            if (sum === 1)
            {
                action.setEffectiveWeight(0);
                continue;
            }

            if (blendRatio > 0.)
            {
                // console.log(`blending from ${ai}`);
                const newWeight = 1 - idleBlendRatio;
                sum += newWeight;
                action.setEffectiveWeight(newWeight);
            }
            else
            {
                action.setEffectiveWeight(0);
            }
        }

        if (Math.abs(sum - 1) > 0.001)
        {
            // console.log(`warn ${sum}`);
            idleAction.setEffectiveWeight(1);
        }

        mixer.update(deltaTInSecs * cycleDuration);
    },

    updateWalkRunCycle(
        cm,
        distanceTravelled,
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        // console.log(distanceTravelled);
        // console.log('walk');
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
        const r2 = 1. + Math.pow(speedRatio, 2.);
        const actionDelta =
            r2 * deltaTInSeconds * cycleDuration;

        // Blend toward run.
        const ratio = Math.pow(speedRatio, 0.5);
        runningAction.setEffectiveWeight(ratio);

        // Reduce other animations.
        let sum = ratio;
        for (let ai in actions)
        {
            if (ai === 'Running') continue;
            const action = actions[ai];
            const blendRatio = action.getEffectiveWeight();
            if (blendRatio > 0.)
            {
                const newWeight = 1 - ratio;
                sum += newWeight;
                action.setEffectiveWeight(newWeight);
            }
            else
            {
                action.setEffectiveWeight(0);
            }
        }
        if (Math.abs(sum - 1) > 0.001)
        {
            // console.log(`warn ${sum}`);
            runningAction.setEffectiveWeight(1);
        }

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
        const current = cm.timeSincePreparedJump + deltaT;
        const max = cm.timeToPrepareJump;
        let normalizedT = this.clamp(current / max, 0., 1.);
        // normalizedT /= 6;

        const actions = animationComponent.actions;
        // for (let ai in actions)
        //     actions[ai].stop();

        const crouchingAction = actions['Crouching'];
        // crouchingAction.play();
        // crouchingAction.setEffectiveWeight(normalizedT);
        for (let ai in actions)
        {
            if (ai === 'Crouching') continue;
            // actions[ai].setEffectiveWeight(1 - normalizedT);
        }

        const times = animationComponent.times['Jumping'];
        const cycleDuration = times[times.length - 1];
        // jumping preparation is at 0,1 of 0,6

        // console.log(normalizedT);
        mixer.setTime(normalizedT * cycleDuration);
    },

    updateJump(
        cm,
        entityModel,
        animationComponent,
        mixer,
        deltaT
    )
    {
        console.log('to jump');
        const actions = animationComponent.actions;
        for (let ai in actions)
        {
            if (ai === 'Jumping') continue;
            actions[ai].stop();
            // actions[ai].setEffectiveWeight(0);
        }

        const jumpingAction = actions['Jumping'];
        // jumpingAction.play();
        // jumpingAction.setEffectiveWeight(1);

        // mixer.update(deltaT);
    }

};

export { AnimationMixers };
