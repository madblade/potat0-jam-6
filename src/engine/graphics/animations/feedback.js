/**
 * Feedback effects such as camera shake, etc.
 */

'use strict';

import { Vector3 } from 'three';

let FeedbackModule = {

    saveOldRotation(oldPitchRotationX, oldYawRotationZ)
    {
        this.oldPitchRotationX = oldPitchRotationX;
        this.oldYawRotationZ = oldYawRotationZ;
    },

    saveNewRotation(newPitchRotationX, newYawRotationZ)
    {
        this.newPitchRotationX = newPitchRotationX;
        this.newYawRotationZ = newYawRotationZ;
    },

    saveOldPosition(oldPosition)
    {
        this.oldCameraPosition.copy(oldPosition);
    },

    saveNewPosition(newPosition)
    {
        this.newCameraPosition.copy(newPosition);
    },

    updateCameraFeedback(deltaT)
    {
        const graphics = this.graphics;
        const manager = graphics.cameraManager;
        const mainCamera = manager.mainCamera;

        // Asymptotic smoothing of camera position
        const currentCP = this.currentCameraPosition;
        // const oldCP = this.oldCameraPosition;
        const newCP = this.newCameraPosition;
        if (currentCP.manhattanDistanceTo(newCP) > 0.)
        {
            const ratioTo60FPS = Math.min(deltaT / 16., 2.);
            // const delta = ratioTo60FPS;
            // progress 10% each 16ms.
            const vecToTarget = this._w0;
            vecToTarget.set(
                ratioTo60FPS * 0.4 * (newCP.x - currentCP.x),
                ratioTo60FPS * 0.4 * (newCP.y - currentCP.y),
                ratioTo60FPS * 0.1 * (newCP.z - currentCP.z),
            );
            currentCP.add(vecToTarget);
        }

        // XXX feedback shaking exactly here
        // decay trauma

        // Apply.
        mainCamera.setCameraPosition(currentCP.x, currentCP.y, currentCP.z);

        // Correction camera vs wall. (Ad-hoc!)
        const realCamera = mainCamera.cameraObject;
        const realCameraPosition = this._w0;
        realCamera.getWorldPosition(realCameraPosition);
        const raycaster = this.raycaster;
        const far = currentCP.distanceTo(realCameraPosition);
        const direction = this._w1;
        direction.copy(realCameraPosition).addScaledVector(currentCP, -1).normalize();
        raycaster.set(currentCP, direction);
        raycaster.far = far + 10.;
        const objects = this.raycastables;
        if (objects.length)
        {
            const intersects = raycaster.intersectObjects(objects);
            if (intersects.length)
            {
                const i0 = intersects[0];
                if (i0 && i0.point)
                {
                    const dist = i0.distance;
                    if (dist < 2)
                    {
                        const nz = (dist - 0.5) / 1.5;
                        const pw = Math.pow(nz, 2.);
                        mainCamera.cameraObject.position.z = 1.5 * pw + 0.5;
                    }
                }
            }
        }
    },

    addRaycastable(mesh)
    {
        this.raycastables.push(mesh);
    },

    resetRaycastables()
    {
        this.raycastables = [];
    },

    resetCameraFeedback()
    {
        // TODO revert camera position!
        const graphics = this.graphics;
        const manager = graphics.cameraManager;
        const mainCamera = manager.mainCamera;

        const newCP = this.newCameraPosition;
        mainCamera.setCameraPosition(newCP.x, newCP.y, newCP.z);
        mainCamera.cameraObject.position.z = 2.;
    }

};

export { FeedbackModule };
