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

    // walking / running (1 track, 5 keyframes)
    //   0 - reach left
    //   1 - pass right
    //   2 - reach right
    //   3 - pass left
    //   4 - reach left (=== 0)
    // idle (1 keyframe / track)
    // crouching (1 keyframe / track)
    // jumping (1 keyframe / track)
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
        assert('Running' in actions,
            '[Mixers] Running animation not found.'
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
            // fall-through to walking animation (blend)
        }

        const p0 = animationComponent.p0;
        const p1 = animationComponent.p1;
        const deltaP = animationComponent.displacement;
        deltaP.copy(p0).addScaledVector(p1, -1);
        const distanceTravelled = deltaP.length();

        if (distanceTravelled > 0.00001)
        {
            if (cm.onGround)
            {
                this.updateWalkRunCycle(
                    cm, distanceTravelled, entityModel,
                    animationComponent, mixer, deltaTInMillis
                );
            }
            else
            {
                this.updateJump(
                    cm, entityModel,
                    animationComponent, mixer, deltaTInMillis
                );
            }
            animationComponent.idleTime = 0;
        }
        else
        {
            if (!cm.isJumping &&
                !cm.hasJustLanded &&
                !cm.isRecoveringFromLanding &&
                !cm.isFalling
            )
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
            {
                actions[animationName].setEffectiveWeight(1);
            }
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

    // Custom animations.

    updateToIdle(
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        const actions = animationComponent.actions;
        const idleAction = actions['Idle'];

        const deltaTInSecs = deltaT / 1e3;
        animationComponent.idleTime += deltaTInSecs;
        const idleTime = animationComponent.idleTime;
        const maxIdleTime = animationComponent.timeToIdle;
        let idleBlendRatio = this.clamp(idleTime / maxIdleTime, 0., 1.);

        // Blend toward idle.
        let oldWeight = idleAction.getEffectiveWeight();
        if (idleBlendRatio < oldWeight) idleBlendRatio = oldWeight;
        idleAction.setEffectiveWeight(idleBlendRatio);

        const ba = entityModel.getBounceAmount();
        const newBa = idleBlendRatio < 1. ? ba / 2 : 0;
        entityModel.setBounceAmount(newBa);

        // Reduce other animations.
        this.updateOtherAnimationWeights(
            idleBlendRatio, 'Idle', actions
        );

        mixer.update(0);
    },

    updateWalkRunCycle(
        cm,
        distanceTravelled,
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        const actions = animationComponent.actions;
        const runningAction = actions['Running'];
        const times = animationComponent.times['Running'];
        const cycleDuration = times[times.length - 1];

        const deltaTInSeconds = deltaT / 1e3;
        const speed = distanceTravelled / deltaTInSeconds;
        const maxSpeed = cm.maxSpeedInAir;
        let speedRatio = this.clamp(speed / maxSpeed, 0., 1.);

        const minStepSize = .6;
        const maxStepSize = 1.4;
        const strideSize = Math.max(minStepSize, speedRatio * maxStepSize);
        const animationDelta = .7 * distanceTravelled / strideSize;
        const strideRatio = strideSize / maxStepSize;

        // Blend toward run.
        const oldWeight = runningAction.getEffectiveWeight();
        runningAction.setEffectiveWeight(strideRatio);
        if (strideRatio < oldWeight && !cm.isRecoveringFromLanding
            && !cm.isJumping)
        {
            actions['Idle'].setEffectiveWeight(1 - strideRatio);
        }

        // Reduce other animations.
        if (!cm.isRecoveringFromLanding)
            this.updateOtherAnimationWeights(
                strideRatio, 'Running', actions
            );

        // Starting to walk: reset model + mixer animation.
        if (animationComponent.idleTime > animationComponent.timeToIdle)
        {
            animationComponent.walkingAdvancement = 0.25 * cycleDuration;
            mixer.setTime(0.25 * cycleDuration);
        }

        // Compute stride lengths.
        animationComponent.walkingAdvancement +=
            animationDelta * cycleDuration * 0.5; // half anim = 1 step
        animationComponent.walkingAdvancement %=
            cycleDuration; // loop back
        const advancement = animationComponent.walkingAdvancement;
        const smoothed = this.doubleSmoothstep(
            advancement / cycleDuration
        );

        // Bounce with an abs sine pseudo-cycloid
        let bounceAmount = 0.1 * this.cycloidBounce(smoothed);
        // Soften at start (only walking)
        // and end (faster => smaller grav effect)
        let cr = this.catmullRom4(
            0, 2, 0, 0.2, speedRatio
        );
        bounceAmount *= cr;
        entityModel.setBounceAmount(bounceAmount);

        const oldTime = mixer.time;
        const newTime = smoothed * cycleDuration;
        const normO = oldTime / cycleDuration;
        const normN = newTime / cycleDuration;
        if (normO < .25 && normN > .25 || normO < .75 && normN > .75)
        {
            // 0. check is on water
            if (cm.onWater) {
                this.waterHit(entityModel, cm);
            }
        }

        // Apply.
        mixer.setTime(
            newTime
        );
    },

    waterHit(entityModel, cm)
    {
        const fs = entityModel.footstepMeshes;
        const nbFS = fs.length;
        const i = entityModel.currentFootStep;
        const currentFS = fs[i];
        const mesh = currentFS.getMesh();
        let us = mesh.material.uniforms;
        // us.time.value = 0.;
        const p0 = cm.position0;
        mesh.position.set(
            p0.x, p0.y, p0.z - 0.7
        );

        entityModel.currentFootStep++;
        entityModel.currentFootStep %= nbFS;
    },

    updatePrepareJump(
        cm,
        entityModel,
        animationComponent,
        mixer,
        deltaT)
    {
        const actions = animationComponent.actions;
        const crouchingAction = actions['Crouching'];
        const jumpingAction = actions['Jumping'];

        const deltaTInSecs = deltaT / 1e3;
        const current = cm.timeSincePreparedJump + deltaTInSecs;
        const max = cm.timeToPrepareJump;
        let normalizedT = this.clamp(current / max, 0., 1.);

        normalizedT = this.smoothstepAttackReverse(
            0, 1, normalizedT
        );
        if (normalizedT < 0.5)
        {
            // to crouching
            normalizedT = 2 * normalizedT;
            crouchingAction.setEffectiveWeight(normalizedT);
            this.updateOtherAnimationWeights(
                normalizedT, 'Crouching', actions
            );
        }
        else
        {
            // to jumping
            normalizedT = 2 * (normalizedT - 0.5);
            jumpingAction.setEffectiveWeight(normalizedT);
            this.updateOtherAnimationWeights(
                normalizedT, 'Jumping', actions
            );
        }

        mixer.update(0);
    },

    updateJump(
        cm,
        entityModel,
        animationComponent,
        mixer,
        deltaT
    )
    {
        const actions = animationComponent.actions;
        const jumpingAction = actions['Jumping'];
        const times = animationComponent.times['Running'];
        const cycleDuration = times[times.length - 1];

        const deltaTInSecs = deltaT / 1e3;

        const oldVZ = animationComponent.v1.z;
        const newVZ = animationComponent.v0.z;
        // if (oldVZ < 0 && newVZ > 0) {
        //     cm.timeSinceFallStarted = 0;
        // }

        cm._maxVZ = Math.max(cm._maxVZ, -newVZ);
        let capVZ = cm._maxVZ / 2;
        const startedDecelerating = -oldVZ > capVZ && -newVZ < capVZ;
        if (startedDecelerating)
        {
            cm.timeSinceFallStarted = 0;
        }
        const continuedDecelerating = -newVZ < capVZ;

        if (cm.hasJustLanded || cm.isRecoveringFromLanding)
        {
            if (cm.hasJustLanded && cm.onWater)
            {
                this.waterHit(entityModel, cm);
            }
            cm.hasJustLanded = false;
            cm.isRecoveringFromLanding = true;

            cm.timeSinceHasLanded += deltaTInSecs;
            const maxTime = cm.timeToRecoverFromLanding;
            const ratio = this.clamp(
                cm.timeSinceHasLanded / maxTime, 0, 1
            );

            const smoothed = this.smoothstepAttack(0, 1, ratio);

            if (smoothed < 0.5)
            {
                // blend to crouching
                const crouchingAction = actions['Crouching'];
                const newWeight = smoothed * 2;
                crouchingAction.setEffectiveWeight(newWeight);
                this.updateOtherAnimationWeights(
                    newWeight, 'Crouching', actions
                );
                mixer.update(0);
            }
            else
            {
                // blend to idle (might be walking too?)
                const idleAction = actions['Idle'];
                // const idleWeight = idleAction.getEffectiveWeight();
                const runningAction = actions['Running'];
                const runningWeight = runningAction.getEffectiveWeight();
                const newWeight = (smoothed - 0.5) * 2;
                if (runningWeight > 0.)
                {
                    runningAction.setEffectiveWeight(newWeight);
                    this.updateOtherAnimationWeights(
                        newWeight, 'Running', actions
                    );
                }
                else
                {
                    idleAction.setEffectiveWeight(newWeight);
                    this.updateOtherAnimationWeights(
                        newWeight, 'Idle', actions
                    );
                }
                mixer.update(0);
            }

            if (ratio === 1)
            {
                cm.timeSinceHasLanded = 0;
                cm.isRecoveringFromLanding = false;
                actions['Idle'].setEffectiveWeight(1);
                this.updateOtherAnimationWeights(
                    1, 'Idle', actions
                );
                mixer.update(0);
            }
            return;
        }

        if (newVZ > 0 && !cm.isJumping)
        {
            // [XXX] high fall detection (hit ground)
            // if (animationComponent.a0.z < -100)
            // {
            //     cm.isFalling = false;
            //     cm.hasJustLanded = true;
            //     cm.isRecoveringFromLanding = true;
            //     cm._maxVZ = 0;
            // }
            // else
            // {
            cm.isFalling = true;
            const fallingAction = actions['Falling'];
            let w = fallingAction.getEffectiveWeight();
            w = Math.min(w + deltaTInSecs / cycleDuration, 1);
            fallingAction.setEffectiveWeight(w);
            this.updateOtherAnimationWeights(
                w, 'Falling', actions
            );
            mixer.update(0);
            // }
            return;
        }
        else if (startedDecelerating || continuedDecelerating)
        {
            const fallingAction = actions['Falling'];
            cm.timeSinceFallStarted += deltaTInSecs;
            const ratio = this.clamp(
                cm.timeSinceFallStarted / cm.timeToSetFallState, 0, 1
            );
            let r = this.smoothstep(0, 1, ratio);
            fallingAction.setEffectiveWeight(r);
            this.updateOtherAnimationWeights(
                r, 'Falling', actions
            );
            mixer.update(0);
            return;
        }

        // other cases: it’s just starting to jump
        jumpingAction.setEffectiveWeight(1);
        this.updateOtherAnimationWeights(
            1, 'Jumping', actions
        );
        mixer.setTime(0);
    },

    //
    // Custom interpolants

    // interpolation between 4 evenly-spaced points on a unit interval
    catmullRom4(y0, y1, y2, y3, t)
    {
        const t2 = t * t;
        const t3 = t * t2;
        const a = 2 * t3 - 3 * t2 + 1;
        const b = t3 - 2 * t2 + t;
        const c = 1 - a;
        const d = t3 - t2;
        const p0y = y0; // starting point
        const m0y = y1 - y0; // tangent at starting
        const p1y = y3; // ending point
        const m1y = y3 - y2; // tangent at ending
        return a * p0y + b * m0y + c * p1y + d * m1y;
    },

    // 0 reach left, 1 pass, 2 reach right, 3 pass, 4 loop
    doubleSmoothstep(tNormal)
    {
        assert(tNormal >= 0. && tNormal <= 1.,
            'DSST: must normalize param.'
        );
        let t = tNormal < 0.5 ? 2 * tNormal : 2 * (tNormal - 0.5);
        const x = this.clamp(t, 0.0, 1.0);
        const smoothed = x * x * (3 - 2 * x);
        let result = 0.5 * smoothed;
        if (tNormal >= 0.5) result += 0.5;
        return result;
    },

    // 0 reach left, 1 pass, 2 reach right, 3 pass, 4 loop
    cycloidBounce(tNormal)
    {
        let t = tNormal * 2.; // scale to [0, 2]
        t = (t - 0.5) * Math.PI; // offset a quarter, scale to function
        return Math.pow(Math.abs(Math.sin(t)), 2.);
    },

};

export { AnimationMixers };
