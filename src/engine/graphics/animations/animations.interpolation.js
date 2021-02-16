/**
 * Holds logic for rotation interpolation.
 */

'use strict';

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
        // console.log(entity.a0.length());
        if (Math.abs(a.x) + Math.abs(a.y) > 0 && false)
        {
            let r = Math.sqrt(a.x * a.x + a.y * a.y);
            r = Math.min(1., r / 10.);
            // r = .1;
            const tx = r * Math.cos(entity.currentTheta);
            const ty = r * Math.sin(entity.currentTheta);
            window.dh.h.position.copy(entity.p0);
            window.dh.h.rotation.set(tx, ty, 0);

            if (tx !== entity.xy1.x || ty !== entity.xy1.y)
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
        else
        {
            entity.xy1.set(0, 0);
        }

        // Tilt interpolation.
        if (entity.currentXY.manhattanDistanceTo(entity.xy1) > 0)
        {
            const sourceXY = entity.xy0;
            const targetXY = entity.xy1;
            entity.xyT += deltaTInSeconds;
            const t = this.smoothstep(0, .400, entity.thetaT);
            if (t === 1) // End interpolation
            {
                entity.currentXY.copy(entity.xy1);
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
        else
        {
            entity.xy0.copy(entity.xy1);
            if (Math.abs(entity.xy1.x) + Math.abs(entity.xy1.y) > 0 && entity.xyT >= 1.)
            {
                entity.xyT = 0;
            }
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
