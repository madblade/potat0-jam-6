/**
 * (c) madblade 2021 all rights reserved
 */

'use strict';

import { Object3D }  from 'three';

let PhysicsInputModule = {

    addCharacterController(playerSelfModel)
    {
        const position = playerSelfModel.position;
        const options = {
            intelligent: true,
            static: false,
            character: true,
            bumperRadius: 0.5,
            lifterDelta: 0.31,
            lifterRadius: 0.41
            // lifterRadius: 0.00004
        };

        const pe = this.addPhysicsEntity(position, options);
        playerSelfModel.physicsEntity = pe;
    },

    pushEvent(e)
    {
        // the user is / controls the first entity so far.
        const entityId = 0;
        const entity = this.sweeper.physicsEntities[entityId];
        if (!entity) throw Error(`[Mad/Input] Entity ${entityId} not found.`);
        const cm = entity.collisionModel;
        const d = cm._d;

        let changed = false;
        if (e[0] === 'r' || e[0] === 'c') // rotation or camera change
            changed = true;

        if (e[0] === 'm')
            switch (e[1])
            {
                case 'f': if (!d[0]) changed = true; d[0] = !0; break;
                case 'b': if (!d[1]) changed = true; d[1] = !0; break;
                case 'r': if (!d[2]) changed = true; d[2] = !0; break;
                case 'l': if (!d[3]) changed = true; d[3] = !0; break;
                case 'u': if (!d[4]) changed = true; d[4] = !0; break;
                case 'd': if (!d[5]) changed = true; d[5] = !0; break;
                case 'vec': cm._ww = e[2]; changed = true; break;

                case 'fx': if (d[0]) changed = true; d[0] = !1; break;
                case 'bx': if (d[1]) changed = true; d[1] = !1; break;
                case 'rx': if (d[2]) changed = true; d[2] = !1; break;
                case 'lx': if (d[3]) changed = true; d[3] = !1; break;
                case 'ux': if (d[4]) changed = true; d[4] = !1; break;
                case 'dx': if (d[5]) changed = true; d[5] = !1; break;
                case 'xx': d.fill(false); changed = true; break;
                case 'vecx': cm._ww = null; changed = true; break;
                default:
                    return;
            }

        if (changed)
            this.computeWantedVelocity(cm);
    },

    computeWantedVelocity(collisionModel)
    {
        const wv = collisionModel.wantedVelocity;
        const ww = collisionModel._ww;

        const d = collisionModel._d;
        const isFw = d[0] !== d[1];
        const isRg = d[2] !== d[3];
        const isUd = d[4] !== d[5];
        if (!isFw && !isRg && !isUd && !ww)
        {
            collisionModel.wantsToMove = false;
            collisionModel.instantaneousVelocity = 0;
            collisionModel.instantaneousVelocityXY.set(0, 0);
            // ^  large post-mort. acceleration
            wv.set(0, 0, 0);
            return;
        }

        const lq = this._q;

        // default vector is the camera forward projected on (x,y)
        // or the camera up projected on (x, y)
        const f = this._f;
        f.set(0, 0, -1); // camera looks at -z
        const cam = this.physics.app.engine.graphics.cameraManager.mainCamera;
        cam.cameraObject.matrixWorld.decompose(this._p, lq, this._s);
        // const q = cam.cameraObject.quaternion;
        f.applyQuaternion(lq);
        if (Math.abs(f.x) + Math.abs(f.y) > 0.01)
            wv.set(f.x, f.y, 0).normalize();
        else
        {
            // console.log('DBG: forward computed from the up vector.');

            // retry with up if camera is vertical
            const u = this._f;
            u.copy(Object3D.DefaultUp); // camera up is +y
            u.applyQuaternion(lq); // more efficient
            wv.set(u.x, u.y, 0).normalize();
        }

        const from = this._ffr;
        const to = this._fto;
        from.set(0, 1, 0);
        // forward is +y, right is +x, up is +z

        let norm = 1.0;
        if (ww) // from sticks
        {
            to.set(ww[0], ww[1], 0);
            norm = to.length();
            to.multiplyScalar(1 / norm);
            norm *= 10.;
        }
        else
            to.set(
                d[2] ? 1 : d[3] ? -1 : 0, // right
                d[0] ? 1 : d[1] ? -1 : 0, // forward
                0, // d[4] ? 1 : d[5] ? -1 : 0 // up
            ).normalize();

        if (to.manhattanLength() > 0)
        {
            lq.setFromUnitVectors(from, to);
            wv.applyQuaternion(lq);
        }
        else wv.set(0, 0, 0);
        wv.z = d[4] ? 1 : d[5] ? -1 : 0;

        wv.multiplyScalar(norm);

        if (wv.manhattanLength() > 0)
        {
            collisionModel.wantsToMove = true;
        }
        else
        {
            collisionModel.instantaneousVelocity = 0;
            collisionModel.instantaneousVelocityXY.set(0, 0);
            // ^  large post-mort. acceleration effect
        }
    },

};

export { PhysicsInputModule };
