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

        // IK MC head
        const sm = backend.selfModel;
        const ep = sm.position;

        // IK cup eyes
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

            const euler = this._e;
            euler.setFromVector3(delta);
            leftEye.rotation.z = -euler.x;
            leftEye.rotation.x = Math.PI / 2 - euler.z;
            rightEye.rotation.copy(leftEye.rotation);
        });
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
