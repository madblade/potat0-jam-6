/**
 * IK and secondary physics.
 */

'use strict';

import { IKSolver, Solver } from './ik/IKSolver';
import {
    Skeleton,
    Vector3
}                           from 'three';

let SecondaryModule = {

    updateSecondaryAnimations() // deltaT)
    {
        // XXX [IK] here manage IKs.
        this.mixers.forEach(m => {
            const iks = m.iks;
            if (iks)
            {
                const solver = iks.solver;
                const skeleton = iks.skeleton;
                const targetPoint = iks.targetPoint;
                const constraints = skeleton.constraints;
                const enforceConstraints = true;

                const nbIter = 5;
                solver.solve(
                    Solver.CCD, skeleton.bones,
                    targetPoint,
                    nbIter, constraints, enforceConstraints
                );
            }
        });

        const backend = this.graphics.app.model.backend;
        const sm = backend.selfModel;
        const ep = sm.position;

        // IK cup eyes
        let mainLookerFound = false;
        const mainLookerDelta = this._w2;
        const em = backend.entityModel;
        const lookers = em.lookers;
        lookers.forEach(l =>
        {
            const gc = l.graphicalComponent;
            const outer = gc.children[0];
            const leftEye = outer.children[1];
            const rightEye = outer.children[2];

            // compute world positions
            const mp = this._w0;
            let mw = leftEye.matrixWorld;
            const worldPosition = this._mvpp;
            mw.decompose(worldPosition, this._q, this._w0);
            mp.copy(worldPosition);

            mw = rightEye.matrixWorld;
            mw.decompose(worldPosition, this._q, this._w0);
            mp.add(worldPosition)
                .multiplyScalar(0.5); // take half.

            const delta = this._w1;
            delta.copy(ep)
                .addScaledVector(mp, -1);
            delta.normalize();

            if (!mainLookerFound)
            {
                mainLookerDelta.copy(delta).negate();
                mainLookerFound = true;
            }

            const euler = this._e;
            euler.setFromVector3(delta);
            leftEye.rotation.z = -euler.x;
            leftEye.rotation.x = Math.PI / 2 - euler.z;
            rightEye.rotation.copy(leftEye.rotation);
        });

        // IK MC head
        const av = sm.avatar;
        if (av)
        {
            const pi = Math.PI;
            const pi2 = pi / 2;
            const ac = sm.animationComponent;
            const idleTime = ac.idleTime;
            const timeToIdle = ac.timeToIdle;
            // if (idleTime > timeToIdle)// &&
            // idleTime < 2 * timeToIdle)
            {
                const progress = (idleTime - timeToIdle) /
                    timeToIdle;

                // rotate head of progress
                const headBone = av
                    .children[0].children[0].children[0]
                    .children[0].children[0].children[0]
                    .children[0].children[0];

                const er = sm.getRotation();

                const v2 = this._xy;
                v2.set(mainLookerDelta.x, mainLookerDelta.y)
                    .normalize();
                const v3 = this._w0;
                v3.set(v2.x, v2.y, 0);
                window.dh.h.setDirection(v3);
                let modelTheta = er.z - pi2;
                if (modelTheta > pi) modelTheta -= 2 * pi;
                else if (modelTheta < -pi) modelTheta += 2 * pi;

                v3.set(Math.cos(modelTheta), Math.sin(modelTheta), 0);
                window.dh.h2.setDirection(v3);

                let yOTarget = Math.atan2(v2.y, v2.x);
                if (yOTarget > pi) yOTarget -= 2 * pi;
                else if (yOTarget < -pi) yOTarget += 2 * pi;

                // er.x = up, er.z = theta

                // headBone.rotation.y = -euler.x;
                // x == vertical, y == horizontal
                // headBone.rotation.x += er.y; //er.x - Math.PI / 2;

                const deltaTheta = Math.abs(yOTarget - modelTheta);
                // console.log(deltaTheta);
                // console.log(deltaTheta);
                if (deltaTheta < Math.PI / 2)
                {
                    // console.log('yah');
                    headBone.rotation.y = yOTarget - modelTheta;
                }
                else
                {
                    // console.log('nah');
                    headBone.rotation.y = 0;
                }
                // console.log(Math.abs(yOTarget - er.z));
                // headBone.rotation.y = diff + Math.PI / 2;

                // headBone.rotation.y = er.z; //er.x - Math.PI / 2;
            }
            // else
            // {
            //     x = 0.01734646181511995
            //     y = 0.
            //     z = 0.
            // }
        }
    },

    createIKSolver(listOfBones, constraints, objectMixer)
    {
        // example
        constraints = constraints || {
            effector: 4,
            links: [
                { id: 0 },
                { id: 1,
                    rotationMin: new Vector3(
                        -Math.PI / 2, -Math.PI / 2, -Math.PI / 2
                    ),
                    rotationMax: new Vector3(
                        Math.PI / 2, Math.PI / 2, Math.PI / 2
                    )
                },
                { id: 2, limitation: new Vector3(0, 0, 1) },
                { id: 3, limitation: new Vector3(1, 0, 0) },
            ],
            minAngle: 0.,
            maxAngle: 1.0
        };

        const skeleton = new Skeleton(listOfBones);

        // prepare FABRIK
        let chainProxy = [];
        chainProxy.push(new Vector3(0, 0, 0));
        const nbBones = listOfBones.length;
        for (let i = 0; i < nbBones; ++i)
        {
            const boneLength = 0; // XXX compute current bone length
            chainProxy.push(new Vector3(0, boneLength, 0));
        }

        skeleton.constraints = constraints;
        skeleton.chainProxy = chainProxy;

        let solver = new IKSolver();
        let targetPoint = new Vector3(0, 10, 0);

        objectMixer.iks = {
            solver,
            targetPoint,
            skeleton,
        };
    }

};

export { SecondaryModule };
