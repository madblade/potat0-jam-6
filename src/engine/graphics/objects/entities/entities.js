/**
 * Entity loading / management.
 */

'use strict';

import { Geometry }     from 'three/examples/jsm/deprecated/Geometry';
import {
    AnimationMixer,
    AnimationClip,
    Object3D,
    Mesh,
    MeshLambertMaterial,
    BufferGeometry,
}                       from 'three';

let EntitiesModule = {

    loadReferenceGeometryFromMemory(id)
    {
        if (!this.referenceMeshes.has(id))
        {
            console.error(`[Graphics/Meshes] Could not charge a new "${id}" mesh.`);
            return;
        }

        // Beware! ’tis a geometry.
        let geometry = this.referenceMeshes.get(id);
        if (!(geometry instanceof Geometry))
            console.warn('[Graphics/Entities] Should be an instance of Geometry.');
        return geometry;
    },

    initializeEntity(entityId, model, color)
    {
        // XXX [ANIMATION] export model to format glTF
        let geometry = this.loadReferenceGeometryFromMemory(model); // Should be 'steve'.
        if (!geometry) return;
        let bufferGeometry = new BufferGeometry().fromGeometry(geometry);

        let mesh = new Mesh(bufferGeometry, new MeshLambertMaterial({
            color,
            vertexColors: true,
            morphTargets: true
        }));

        mesh.scale.set(1.0, 1.0, 1.0);
        // mesh.castShadow = true;

        let mixer = new AnimationMixer(mesh);
        let clip = AnimationClip.CreateFromMorphTargetSequence(
            'run',
            geometry.morphTargets, 30, false
        );

        mixer.clipAction(clip)
            .setDuration(1)
            .play();

        this.animationManager.addEntityAnimation(entityId, mixer);

        return mesh;
    },

    // For composite entities, wrap heavy model parts in higher level structure.
    finalizeEntity(id, createdEntity, color)
    {
        if (!createdEntity || !(createdEntity instanceof Object3D))
        {
            console.warn('[Graphics/Entities] ' +
                'Tried to finalize an entity that was not correctly initialized.');
            return;
        }

        // First only manage avatars.
        let up = new Object3D();
        let wrapper = new Object3D();
        let head = this.createMesh(
            this.createGeometry('box'),
            this.createMaterial('flat-phong',
                {color})
        );
        // head.castShadow = true;

        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.add(createdEntity); // Body.
        wrapper.add(head);

        head.position.y = 1.6;
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper.position.z = -0.7999;

        up._id = id;
        //delete createdEntity._id;

        up.getWrapper = function() {
            return wrapper;
        };

        up.getHead = function() {
            return head;
        };

        //return wrapper;
        return up;
    }

};

export { EntitiesModule };
