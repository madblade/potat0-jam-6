/**
 * Holds logic for rotation interpolation.
 */

'use strict';

// import { Vector3 } from 'three';

let AnimationInterpolation = {

    updateEntityRotationAndTilt(entity, entityId, deltaT)
    {
        // Init entity model if needed.
        const gr = this.graphics;
        const backend = gr.app.model.backend;
        const initialTheta = entityId === 0 ?
            backend.selfModel.getTheta() :
            entity.rotation.z;
        if (!entity.p0)
        {
            this.initializeEntityAnimation(entity, initialTheta);
            return;
        }
        const deltaTInSeconds = deltaT / 1e3;

        // Rotation target.
        const v = entity.v0;
        const id = entityId;
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
                // console.log(`${initialTheta} -> ${theta}`);

                // Update rotation target.
                if (entity.theta1 !== entity.theta0) // was rotating
                {
                    entity.thetaT = 0.1;
                    entity.theta0 = initialTheta;
                    entity.theta1 = theta;
                }
                else // was not rotating
                {
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
            // const t = this.lerp(0, .500, entity.thetaT);

            if (t === 1) // End interpolation
            {
                entity.currentTheta = entity.theta1;
            }
            else
            {
                let targetTheta2 = targetTheta;
                // Target - source should be < pi.
                if (Math.abs(sourceTheta - targetTheta2) > pi)
                {
                    // Choose shortest path.
                    targetTheta2 =
                        targetTheta > sourceTheta ? targetTheta - 2 * pi :
                            targetTheta < sourceTheta ? targetTheta + 2 * pi : null;
                    if (targetTheta2 === null || Math.abs(sourceTheta - targetTheta2) > pi)
                        throw Error('[Animations] still target delta > pi.');
                }

                // Clamp result to [-pi, pi].
                let ct = t * targetTheta2 + (1 - t) * sourceTheta;
                if (ct > pi) ct -= 2 * pi;
                else if (ct < -pi) ct += 2 * pi;
                entity.currentTheta = ct;
            }

            // Apply changes.
            if (id === 0)
            {
                const sm = gr.app.model.backend.selfModel;
                const er = sm.getRotation();
                if (er)
                    this._r.set(er.x - pi / 2, er.y, entity.currentTheta);
                else
                    this._r.set(0, 0, entity.currentTheta);
                sm.setRotation(this._r);
            }
        }
        else
        {
            entity.theta0 = entity.theta1;
        }

        // Tilt target.
        const a = entity.a0;
        if (Math.abs(a.x) + Math.abs(a.y) > 10.1)
        {
            let r = Math.sqrt(a.x * a.x + a.y * a.y);
            r = 1.;
            // if (r < 100)    // r ~ 50 at movement startup.
            //     r = 1.2;
            // else            // r > 100 at movement stop.
            //     r = .01;

            const tet = Math.atan2(a.y, a.x) - pi / 2;
            const tx = r * Math.cos(tet);
            const ty = r * Math.sin(tet);

            if (
                !this.almostEqual(tx, entity.xy1.x) ||
                !this.almostEqual(ty, entity.xy1.y)
            )
            {
                const initX = entityId === 0 ?
                    backend.selfModel.avatar.rotation.x - pi / 2 :
                    entity.rotation.x;
                const initY = entityId === 0 ?
                    backend.selfModel.avatar.rotation.y :
                    entity.rotation.y;

                if (entity.xy0.manhattanDistanceTo(entity.xy1) > 0) // was tilting
                {
                    entity.xyT = 0.1;
                    entity.xy0.set(initX, initY);
                    entity.xy1.set(tx, ty);
                }
                else // was not tilting
                {
                    entity.xyT = 0;
                    entity.xy0.set(initX, initY);
                    entity.xy1.set(tx, ty);
                }
            }
        }

        // Tilt interpolation.
        const needsInterp1 = // target tilt (after a stop, backwards tilt)
            entity.currentXY.manhattanDistanceTo(entity.xy1) > 0;
        const needsInterp2 = // pause tilt (from backwards tilt to no tilt)
            !needsInterp1 &&
            entity.currentXY.manhattanDistanceTo(entity.xy2) > 0;
        if (needsInterp1 || needsInterp2)
        {
            // console.log(`${needsInterp1}, ${needsInterp2}`);
            const sourceXY = entity.xy0;
            const targetXY = needsInterp1 ? entity.xy1 : entity.xy2;
            entity.xyT += deltaTInSeconds;
            const t = this.smoothstep(0, .300, entity.xyT);
            if (t === 1) // End interpolation
            {
                entity.currentXY.copy(targetXY);
            }
            else // Interpolate
            {
                const ctx = t * targetXY.x + (1 - t) * sourceXY.x;
                const cty = t * targetXY.y + (1 - t) * sourceXY.y;
                entity.currentXY.set(ctx, cty);
            }

            // Apply
            if (id === 0)
            {
                const sm = gr.app.model.backend.selfModel;
                const er = sm.getRotation();
                const cxy = entity.currentXY;
                if (er)
                    this._r.set(cxy.x, cxy.y, er.z);
                else
                    this._r.set(cxy.x, cxy.y, 0);
                sm.setRotation(this._r);
            }
        }

        const needsInterp1Again =
            entity.currentXY.manhattanDistanceTo(entity.xy1) > 0;
        if (!needsInterp1Again)
        {
            entity.xy0.copy(entity.xy1);
            entity.xy1.copy(entity.xy2);
            entity.xyT = 0;
        }
    },

    almostEqual(t1, t2)
    {
        return Math.abs(t1 - t2) < 0.00001;
    },

    lerp(end1, end2, t)
    {
        return this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
    },

    smoothstep(end1, end2, t)
    {
        const x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
        return x * x * (3 - 2 * x);
    },

    clamp(t, low, high)
    {
        return Math.min(high, Math.max(low, t));
    },

};

export { AnimationInterpolation };
