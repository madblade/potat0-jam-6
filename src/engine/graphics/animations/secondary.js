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
            const mp = this._w0;
            mp.copy(leftEye.position)
                .add(rightEye.position)
                .multiplyScalar(0.2);
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

                const yOTarget = Math.atan2(
                    mainLookerDelta.y,
                    mainLookerDelta.x);

                const er = sm.getRotation();
                // er.x = up, er.z = theta

                // headBone.rotation.y = -euler.x;
                // x == vertical, y == horizontal
                // headBone.rotation.x += er.y; //er.x - Math.PI / 2;

                const diff = yOTarget - er.z;
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
