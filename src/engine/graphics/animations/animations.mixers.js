/**
 * Holds logic for:
 * - walk / run (synchronized blend)
 * - jump
 * - crouch
 * - attack
 */

'use strict';

import { assert } from '../../../extend';

let AnimationMixers = {

    setupMixer(entityId, mesh, mixer, entityModel)
    {
        let animationTracks = mesh.userData.animations;
        entityModel.actionStates = {};
        entityModel.actions = {};
        entityModel.tracks = {};
        const actionStates = entityModel.actionStates;
        const actions = entityModel.actions;
        const tracks = entityModel.tracks;
        for (let i = 0; i < animationTracks.length; ++i)
        {
            const clip = animationTracks[i];
            actionStates[clip.name] = false;
            actions[clip.name] = mixer.clipAction(clip);
            tracks[clip.name] = clip;
        }
        console.log(animationTracks);
        console.log(actions);
    },

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

        // here update mixer.
        const actions = entity.actions;
        // const actionsStates = entity.actionStates;
        if ('Walking' in actions)
            actions['Walking'].play();

        mixer.update(deltaT);
    }

};

export { AnimationMixers };
