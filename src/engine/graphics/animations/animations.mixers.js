/**
 * Holds logic for:
 * - walk / run (synchronized blend)
 * - jump
 * - crouch
 * - attack
 */

'use strict';

let AnimationMixers = {

    setupMixer(entityId, mesh, mixer, entityModel)
    {
        console.log(mesh);
    },

    updateMixerAction(
        entity,
        entityId,
        deltaT
    )
    {
        // here update mixer.
    }

};

export { AnimationMixers };
