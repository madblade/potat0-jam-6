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
