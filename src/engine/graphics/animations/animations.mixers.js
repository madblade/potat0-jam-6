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
            actionStates[clip.name] = false;
            actions[clip.name] = mixer.clipAction(clip);
            tracks[clip.name] = clip;
            times[clip.name] = clip.tracks[0].times;
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
        entity,
        entityId,
        mixer,
        deltaT
    )
    {
        assert(!!entity.actionStates,
            '[Mixers] Animation not properly initialized.'
        );
        const actions = entity.actions;
        assert('Walking' in actions,
            '[Mixers] Walking animation not found.'
        );

        // here update mixer.
        // const actionsStates = entity.actionStates;
        actions['Running'].play();
        const times = entity.times['Running'];
        const cycleDuration = times[times.length - 1];

        const p0 = entity.p0;
        const p1 = entity.p1;
        const deltaP = entity.displacement;
        deltaP.copy(p0).addScaledVector(p1, -1);
        const distanceTravelled = deltaP.length();
        // console.log(distanceTravelled);

        const normalizedDelta = distanceTravelled / 4;
        if (normalizedDelta > 1. || normalizedDelta === 0.) return;
        const actionDelta = normalizedDelta * cycleDuration;

        mixer.update(actionDelta);
    },

    updateRunCycle()
    {
    },

    updateJumpCycle()
    {
    }

};

export { AnimationMixers };
