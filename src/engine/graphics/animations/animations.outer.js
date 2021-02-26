/**
 * Outer object animator.
 * Manipulates 3D objects but not bones.
 *
 * Holds logic for:
 * - rotation theta from velocity
 * - rotation tilt from velocity
 * - rotation tilt from acceleration
 */

'use strict';

import { assert } from '../../../extend';

let AnimationOuter = {

    updateEntityRotationAndTilt(
        entityModel,
        animationComponent,
        deltaT)
    {
        const initialTheta = entityModel.getTheta();

        // Init entity model if needed.
        if (!animationComponent.p0)
        {
            this.initializeEntityAnimation(animationComponent, initialTheta);
            return;
        }
        const deltaTInSeconds = deltaT / 1e3;

        this.applyRotationFromVelocity(
            entityModel,
            animationComponent,
            initialTheta,
            deltaTInSeconds
        );

        this.applyTiltFromVelocity(
            entityModel,
            animationComponent,
            deltaTInSeconds
        );

        if (!animationComponent.isJumping)
            this.applyTiltFromAcceleration(
                entityModel,
                animationComponent,
                deltaTInSeconds
            );
    },

    applyRotationFromVelocity(
        entityModel,
        animationComponent,
        initialTheta,
        deltaTInSeconds
    )
    {
        const entity = animationComponent;
        const sm = entityModel;

        // Rotation target.
        const v = entity.v0;
        const pi = Math.PI;
        if (Math.abs(v.x) + Math.abs(v.y) > 0.)
        {
            let theta = Math.atan2(v.y, v.x) - pi / 2;
            // Clamp theta between [-pi, pi].
            if (theta > pi) theta -= 2 * pi;
            else if (theta < -pi) theta += 2 * pi;
            else if (theta > 2 * pi || theta < -2 * pi)
                throw Error('[Animations] Invalid target theta.');

            // Set rotation target.
            if (!this.almostEqual(entity.theta1, theta))
            {
                // Update rotation target.
                if (entity.theta1 !== entity.theta0)
                {
                    // was rotating
                    entity.thetaT = 0.1;
                    entity.theta0 = initialTheta;
                    entity.theta1 = theta;
                }
                else
                {
                    // was not rotating
                    entity.thetaT = 0;
                    entity.theta0 = initialTheta;
                    entity.theta1 = theta;
                }
            }
        }

        // Rotation interpolation.
        if (entity.currentTheta !== entity.theta1)
        {
            const sourceTheta = entity.theta0;
            const targetTheta = entity.theta1;
            entity.thetaT += deltaTInSeconds;
            const t = this.smoothstep(0, .400, entity.thetaT);

            if (t === 1) // End interpolation
            {
                entity.currentTheta = entity.theta1;
            }
            else
            {
                let targetTheta2 = targetTheta;
                // Target - source should be < pi.
                if (Math.abs(sourceTheta - targetTheta2) > pi) {
                    // Choose shortest path.
                    targetTheta2 =
                        targetTheta > sourceTheta ? targetTheta - 2 * pi :
                            targetTheta < sourceTheta ? targetTheta + 2 * pi :
                                null;
                    if (targetTheta2 === null ||
                        Math.abs(sourceTheta - targetTheta2) > pi
                    )
                        throw Error('[Animations] still target delta > pi.');
                }

                // Clamp result to [-pi, pi].
                let ct = t * targetTheta2 + (1 - t) * sourceTheta;
                if (ct > pi) ct -= 2 * pi;
                else if (ct < -pi) ct += 2 * pi;
                entity.currentTheta = ct;
            }

            // Apply changes.
            const er = sm.getRotation();
            if (er)
            {
                this._r.set(er.x - pi / 2, er.y, entity.currentTheta);
                sm.setRotation(this._r);
            }
        } else {
            entity.theta0 = entity.theta1;
        }
    },

    applyTiltFromVelocity(
        entityModel,
        animationComponent,
        deltaTInSeconds
    )
    {
        let maxVelocityTilt = 0.25 * Math.PI / 8;

        const entity = animationComponent;
        const sm = entityModel;
        const pe = entityModel.physicsEntity;
        assert(pe && pe.collisionModel,
            '[Animations] Could not get entity collision model.'
        );
        const cm = pe.collisionModel;
        const pi = Math.PI;

        // Direct rotation.
        const v = entity.v0;
        const s = cm.isJumping ? -1 : 1;
        if (cm.isJumping) maxVelocityTilt *= 4;
        const vx = s * v.x;
        const vy = s * v.y;
        const oldTiltX = entity.velTilt.x;
        const oldTiltY = entity.velTilt.y;
        const tet = Math.atan2(vy, vx) - pi / 2;
        let norm = Math.sqrt(vx * vx + vy * vy);

        norm /= cm.maxSpeedInAir;
        norm = Math.min(norm, 1.);
        norm *= maxVelocityTilt;

        // const timeToMV = pe.collisionModel.timeToReachMaxVel || 0.100;
        let d = 5.9 * deltaTInSeconds * 2.;
        d = Math.min(d, 1.);

        const targetTiltX = norm * Math.cos(tet);
        const targetTiltY = norm * Math.sin(tet);
        const dx = d * (targetTiltX - oldTiltX);
        const dy = d * (targetTiltY - oldTiltY);
        if (Math.abs(dx) + Math.abs(dy) > 0.)
        {
            let newTiltX = oldTiltX + dx;
            if (Math.abs(newTiltX) < 0.001) newTiltX = 0;
            let newTiltY = oldTiltY + dy;
            if (Math.abs(newTiltY) < 0.001) newTiltY = 0;

            // Apply changes.
            const er = sm.getRotation();
            if (er)
            {
                this._r.set(
                    er.x - pi / 2 + dx,
                    er.y + dy,
                    er.z
                );
                sm.setRotation(this._r);
                entity.velTilt.set(newTiltX, newTiltY);
            }
        }
    },

    applyTiltFromAcceleration(
        entityModel,
        animationComponent,
        deltaTInSeconds
    )
    {
        const maxAccelerationTilt = 0.5 * Math.PI / 8;

        const entity = animationComponent;

        // Tilt target.
        const a = entity.a0;
        if (Math.abs(a.x) + Math.abs(a.y) > -0.1)
        {
            let r = Math.sqrt(a.x * a.x + a.y * a.y);
            const cm = entityModel.physicsEntity.collisionModel;

            const wantedXY = cm.wantedXY;

            let acc = 1.;
            if (cm && cm.timeToReachMaxVel)
                acc = cm.maxSpeedInAir / cm.timeToReachMaxVel;
            r /= acc;
            // Old tilting method:
            // r ~ 0 : nothing happens (slight gamepad oscillation)
            // r > 1.1 : halt (stopped holding controls)
            // r ~ 1 : regular acceleration
            // r in [0, 1] : clamped acceleration (gamepad)

            // Correct slight oscillations around 0.
            // if (r < 0.001) r = 0.;
            // Correct slight oscillations around 1.
            // if (Math.abs(r - 1.) < 0.001) r = 1.;
            // Gamepad: correct oscillations between acceleration states.
            // Require acceleration to be held at least during 2 frames
            // const na = entity.a0.angleTo(entity.a1);
            // if (r < 1. && Math.abs(na) > 0.5) r = 0.;

            // Compute angles.
            let needsToSwitchTarget = r > 0.;
            const pi = Math.PI;
            let tet = Math.atan2(a.y, a.x) - pi / 2;
            const oldR = entity.towardsR;
            const oldT = entity.towardsT;
            // Gamepad: set current r to max r when the angle is small.
            if (needsToSwitchTarget && r <= 1.)
                if (Math.abs(oldT - tet) < 0.5 && r < oldR)
                    r = oldR;

            // Halt: reduce halting amplitude.
            if (r > 2.)
            {
                if (Math.abs(pi / 2 - Math.abs(entity.a0.angleTo(entity.v0))) < 0.001)
                {
                    // To trigger only when the user stopped going forward,
                    // set r / lastWantedXY here.
                }
                else
                {
                    // branches here after a sharp turn or hitting an object;
                    // the latter is interesting, I need to figure out
                    // how to get rid of the former
                }

                r = .5;
                entity.lastWantedXY.set(0, 0);
            }
            else // ignore small acceleration inputs
            {
                r = 0;
            }

            if (r < 1)
            // no big acceleration delta: wire user controls instead
            {
                const wl = wantedXY.length();
                const lastWantedXY = entity.lastWantedXY;
                const lwl = lastWantedXY.length();
                if (
                    (wl > lwl ||
                    Math.abs(lastWantedXY.dot(wantedXY) / (wl * lwl)) < 0.999
                    ) && this.dotV2V3(wantedXY, entity.v0) < -0.99
                )
                {
                    tet = Math.atan2(-wantedXY.y, -wantedXY.x) - pi / 2;
                    r = wl;
                }
                lastWantedXY.copy(wantedXY);
            }

            r *= maxAccelerationTilt;
            needsToSwitchTarget = r > 0;

            // const vt = entity.velTilt;
            const tx = r * Math.cos(tet);// + vt.x;
            const ty = r * Math.sin(tet);// + vt.y;

            // Switch target if needed.
            if (
                needsToSwitchTarget &&
                (!this.almostEqual(tx, entity.xy1.x) ||
                !this.almostEqual(ty, entity.xy1.y))
            )
            {
                const initX = entityModel.getRotationX() - pi / 2;
                const initY = entityModel.getRotationY();

                const vt = entity.velTilt;
                entity.xyT = 0;
                entity.xy0.set(initX - vt.x, initY - vt.y);
                entity.xy1.set(tx, ty);
                entity.currentXY.copy(entity.xy0);
                entity.towardsR = r;
                entity.towardsT = tet;
            }
        }

        // Tilt interpolation.
        const needsInterp1 = // target tilt (after a stop, backwards tilt)
            entity.currentXY.manhattanDistanceTo(entity.xy1) > 0;
        if (needsInterp1)
        {
            const sourceXY = entity.xy0;
            const targetXY = entity.xy1;
            entity.xyT += deltaTInSeconds;

            let t;
            let timeToInterp;
            if (targetXY.manhattanDistanceTo(entity.xy2) < 0.001)
            // distance to snapshot (is it the last velTilt?)
            {
                timeToInterp = .600;
                t = this.smoothstep(0, timeToInterp,
                    entity.xyT);
            }
            else
            {
                timeToInterp = .200;
                t = this.smoothstepAttack(0, timeToInterp,
                    entity.xyT);
            }

            if (t === 1) // end interpolation
            {
                entity.currentXY.copy(targetXY);
            }
            else // interpolate
            {
                const ctx = t * targetXY.x + (1 - t) * sourceXY.x;
                const cty = t * targetXY.y + (1 - t) * sourceXY.y;
                entity.currentXY.set(ctx, cty);
            }

            // Apply.
            const sm = entityModel;
            const er = sm.getRotation();
            // sum acceleration + velocity tilts
            const cxy = entity.currentXY;
            const vt = entity.velTilt;
            if (er)
            {
                this._r.set(
                    cxy.x + vt.x,
                    cxy.y + vt.y,
                    er.z
                );
                sm.setRotation(this._r);
            }
        }

        const needsInterp1Again =
            entity.currentXY.manhattanDistanceTo(entity.xy1) > 0;
        if (!needsInterp1Again &&
            entity.xy1.manhattanDistanceTo(entity.xy2) > 0)
        {
            entity.xy0.copy(entity.xy1);
            entity.xy1.copy(entity.xy2); // === (0, 0)
            entity.currentXY.copy(entity.xy0);
            entity.xyT = 0;
        }
    },

    dotV2V3(v2, v3)
    {
        const n1 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const n2 = Math.sqrt(v3.x * v3.x + v3.y * v3.y);
        if (n1 === 0 || n1 === 0) return 0;
        return (v2.x * v3.x + v2.y * v3.y) / (n1 * n2);
    },

    almostEqual(t1, t2)
    {
        return Math.abs(t1 - t2) < 0.00001;
    },

    lerp(end1, end2, t)
    {
        return this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
    },

    smootherstep(end1, end2, t)
    {
        let x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
        return x * x * x * (x * (x * 6 - 15) + 10);
    },

    smoothstep(end1, end2, t)
    {
        const x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
        return x * x * (3 - 2 * x);
    },

    // harder at startup
    smoothstepAttack(end1, end2, t)
    {
        let x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
        x = Math.pow(x, .5);
        return x * x * (3 - 2 * x);
    },

    // softer at startup
    smoothstepAttackReverse(end1, end2, t)
    {
        let x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
        x = Math.pow(1 - x, .5);
        const res = x * x * (3 - 2 * x);
        return 1 - res;
    },

    clamp(t, low, high)
    {
        return Math.min(high, Math.max(low, t));
    },

};

export { AnimationOuter };
