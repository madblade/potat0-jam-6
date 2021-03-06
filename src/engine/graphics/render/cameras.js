/**
 * Camera management.
 */

'use strict';

import extend                   from '../../../extend';

import { Camera }               from './camera';
import { WaterCameraModule }    from '../objects/water/watercamera';
import {
    Matrix4,
    PerspectiveCamera,
    Plane,
    Raycaster,
    Vector2,
    Vector3,
    Vector4,
}                               from 'three';

const DEFAULT_CAMERA = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.0001,
    far: 100000
};

let CameraManager = function(graphicsEngine)
{
    this.graphicsEngine = graphicsEngine;

    // Camera properties.
    this.mainFOV = DEFAULT_CAMERA.fov;
    this.mainAspect = window.innerWidth / window.innerHeight;
    this.mainNear = DEFAULT_CAMERA.near;
    this.mainFar = DEFAULT_CAMERA.far;

    // Cameras.
    this.mainCamera = this.createCamera(false, -1);
    this.mainCamera.setCameraId(-1);
    this.mainCamera.setThirdPerson();

    // Raycast with different near plane
    this.mainRaycasterCamera = this.createCamera(true, -1);
    this.raycaster = this.createRaycaster();

    // Portals
    this.subCameras = new Map();
    this.stencilCamera = new PerspectiveCamera(
        this.mainFOV, this.mainAspect, this.mainNear, this.mainFar
    );
    this.stencilCamera.matrixAutoUpdate = false;

    // Water
    this.waterCamera = this.createWaterCamera();
    // this.waterCameraHelper = new CameraHelper(this.waterCamera.camera);
    // this.waterCameraHelper = new CameraHelper(this.mainCamera.cameraObject);

    // Optimization
    this._renderPortals = false;
    this.incomingRotationEvents = [];
    this.oldTheta0 = 0;
    this.oldTheta1 = 0;
    this.correctSpikes = false;
    this.smartAccumulation = true;
    this._debug = false;
    this._r = new Vector4(0, 0, 0, 0);
    this._rotation = [0, 0, 0, 0];
    this._acc = [0, 0, 0, 0, 0]; // last is deltaT
};

// Factory.

extend(CameraManager.prototype, {

    createCamera(forRaycaster, worldId)
    {
        // Resize (when window is resized on hub, portals are not affected)
        this.mainAspect = window.innerWidth / window.innerHeight;

        return new Camera(
            this.mainFOV,
            this.mainAspect,
            forRaycaster ? 0.1 : this.mainNear,
            this.mainFar,
            worldId);
    },

    addCamera(
        frameSource, frameDestination,
        cameraPath, cameraTransform, screen)
    {
        let cameraId = cameraPath;

        if (this.subCameras.has(cameraId))
        {
            // console.log('[CameraManager] Skipping camera addition.');
            // This happens quite often.
            return;
        }

        let mainCamera = this.mainCamera;
        let camera = this.createCamera(false);
        camera.setCameraId(cameraId);
        camera.setCameraTransform(cameraTransform);
        if (screen) camera.setScreen(screen);
        this.subCameras.set(cameraId, camera);

        camera.copyCameraPosition(mainCamera);
        camera.copyCameraUpRotation(mainCamera);
        camera.setZRotation(mainCamera.getZRotation());
        camera.setXRotation(mainCamera.getXRotation());
    },

    addCameraToScene(cameraId, worldId, screen)
    {
        worldId = parseInt(worldId, 10);

        let camera = this.subCameras.get(cameraId);
        if (!camera && cameraId === this.mainCamera.getCameraId())
            camera = this.mainCamera;
        if (!camera) {
            console.log(`@addCamera: could not get wrapper for camera ${cameraId}`);
            return;
        }

        camera.setWorldId(worldId);
        if (screen) camera.setScreen(screen);
        this.graphicsEngine.addToScene(camera.get3DObject(), worldId);

        camera.getRecorder().updateProjectionMatrix();
        camera.getRecorder().updateMatrixWorld();
        camera.getRecorder().matrixWorldInverse
            .copy(camera.getRecorder().matrixWorld).invert();
        // .getInverse(camera.getRecorder().matrixWorld);
        // console.log(`Successfully added side camera to scene ${worldId}`);
    },

    removeCameraFromScene(cameraId, worldId)
    {
        worldId = parseInt(worldId, 10);
        let camera = this.subCameras.get(cameraId);
        if (!camera && cameraId === this.mainCamera.getCameraId())
            camera = this.mainCamera;
        if (!camera)
        {
            console.log(`@removeCamera: could not get wrapper for camera ${cameraId}.`);
            return;
        }

        if (!worldId) worldId = camera.getWorldId();

        this.graphicsEngine.removeFromScene(
            camera.get3DObject(), worldId, true
        );
    },

    switchMainCameraToWorld(oldMainSceneId, sceneId)
    {
        let mainCamera = this.mainCamera;
        let mainRaycasterCamera = this.mainRaycasterCamera;
        let graphics = this.graphicsEngine;

        graphics.removeFromScene(mainCamera.get3DObject(), oldMainSceneId);
        graphics.removeFromScene(mainRaycasterCamera.get3DObject(),
            oldMainSceneId);

        graphics.addToScene(mainCamera.get3DObject(), sceneId);
        graphics.addToScene(mainRaycasterCamera.get3DObject(), sceneId);
    },

    /** @deprecated */
    switchToCamera(oldWorldId, newWorldId)
    {
        console.log(`Deprecated call to switchToCamera ${newWorldId}.`);
    },

    // Update.
    updateCameraPosition(vector)
    {
        let x = vector.x;
        let y = vector.y;
        let z = vector.z;
        const cam = this.mainCamera;

        // Save old.
        let animationManager = this.graphicsEngine.animationManager;
        animationManager.saveOldPosition(cam.getCameraPosition());
        // Do update.
        cam.setCameraPosition(x, y, z);
        // Save new.
        animationManager.saveNewPosition(cam.getCameraPosition());
    },

    addCameraRotationEvent(relX, relY, absX, absY, deltaTMillis)
    {
        this.incomingRotationEvents.push([relX, relY, absX, absY, deltaTMillis]);
    },

    // _mm2()
    // {
    //     if (!this._m) this._m = [0, 0, 0, 0];
    //     else
    //     {
    //         const m = this._m;
    //         m[0] = m[1] = m[2] = m[3] = 0;
    //     }
    //     if (!this._m2) this._m2 = [0, 0, 0, 0];
    //     else
    //     {
    //         const m = this._m2;
    //         m[0] = m[1] = m[2] = m[3] = 0;
    //     }
    // },

    accumulateRotationEvents(incoming, accumulator, dt)
    {
        if (this.smartAccumulation && incoming.length > 2)
        {
            // this._mm2();
            // const m = this._m;
            // const m2 = this._m2;

            const dbg = this._debug;
            // correction by neighborhood
            for (let i = 0, l = incoming.length; i < l; ++i)
            {
                let inc = incoming[i];
                let next;
                let next2;
                if (i === 0)
                {
                    next = incoming[i + 1];
                    next2 = incoming[i + 2];
                }
                else if (i === l - 1)
                {
                    next = incoming[i - 1];
                    next2 = incoming[i - 2];
                }
                else
                {
                    next = incoming[i + 1];
                    next2 = incoming[i - 1];
                }

                for (let j = 0; j < 4; ++j)
                {
                    const mj = Math.abs(next[j]) + 1;
                    const m2j = Math.abs(next2[j]) + 1;
                    const ij = Math.abs(inc[j]) + 1;
                    if (ij > 20 * mj && ij > 20 * m2j)
                    {
                        if (dbg)
                            console.log(`[Cameras] Smart accumulation corrected ${ij},${mj},${m2j}.`);
                        inc[j] = 0; // mj[j];
                    }
                }
            }

            for (let i = 0, l = incoming.length; i < l; ++i)
            {
                let inc = incoming[i];
                for (let j = 0; j < 4; ++j)
                {
                    accumulator[j] += dt * inc[j];
                }
            }

            return;
        }

        for (let i = 0, l = incoming.length; i < l; ++i)
        {
            let inc = incoming[i];
            for (let j = 0; j < 4; ++j)
                accumulator[j] += dt * inc[j];
        }
    },

    refresh() // deltaT)
    {
        let incoming = this.incomingRotationEvents;
        if (incoming.length < 1) return;

        const acc = this._acc;
        acc.fill(0);

        let dtInSecs = 16. / 1e3;
        // larger dt => larger rotation BUT also larger
        // movementX / movementY
        // so no need to timescale again…

        // FF, as anyone with sanity would do.
        if (incoming.length === 1)
        {
            // console.log('inc small');
            let inc = incoming[0];
            acc[0] = inc[0] * dtInSecs;
            acc[1] = inc[1] * dtInSecs;
            acc[2] = inc[2] * dtInSecs;
            acc[3] = inc[3] * dtInSecs;
            // acc[4] = inc[4]; // deltaT
        }

        // Chrome (there is a bug in Chrome for that! insane.)
        else if (incoming.length > 1)
        {
            let spikeDetected = false;
            this.accumulateRotationEvents(incoming, acc, dtInSecs);

            if (this.correctSpikes)
            {
                // Reset on mean average.
                acc[0] /= incoming.length;
                acc[1] /= incoming.length;
                acc[2] /= incoming.length;
                acc[3] /= incoming.length;
                const thresh = 20; // This is a low threshold!
                for (let i = 0, l = incoming.length; i < l; ++i)
                {
                    let inc = incoming[i];
                    if (Math.abs(inc[0]) > thresh * Math.abs(acc[0])) {
                        spikeDetected = true;
                        inc[0] = acc[0];
                    }
                    if (Math.abs(inc[1]) > thresh * Math.abs(acc[1])) {
                        spikeDetected = true;
                        inc[1] = acc[1];
                    }
                    if (Math.abs(inc[2]) > thresh * Math.abs(acc[2])) {
                        spikeDetected = true;
                        inc[2] = acc[2];
                    }
                    if (Math.abs(inc[3]) > thresh * Math.abs(acc[3])) {
                        spikeDetected = true;
                        inc[3] = acc[3];
                    }
                }

                if (spikeDetected)
                {
                    acc.fill(0);
                    this.accumulateRotationEvents(incoming, acc);
                }
            }
        }

        // Flush.
        this.incomingRotationEvents.length = 0;

        const rotation = this._rotation;
        // rotation.fill(0);
        this.updateCameraRotation(acc[0], acc[1], acc[2], acc[3], rotation);

        // Here we could perform additional filtering
        if (rotation)
        {
            let clientModel = this.graphicsEngine.app.model.frontend;
            clientModel.triggerEvent('r', rotation);
        }
    },

    clipOblique(mirror, mirrorCamera, localRecorder)
    {
        let matrix = new Matrix4();
        matrix.extractRotation(mirror.matrix);

        // Reversal criterion: vector(pos(x)-pos(cam)) dot vector(x normal)

        // x normal
        let vec1 = new Vector3(0, 0, 1);
        vec1.applyMatrix4(matrix);

        // pos(x)-pos(camera)
        let posX = mirror.position;
        //let  = localRecorder.position;
        let posC = new Vector3();
        posC.setFromMatrixPosition(localRecorder.matrixWorld);

        let vec2 = new Vector3();
        vec2.x = posX.x - posC.x;
        vec2.y = posX.y - posC.y;
        vec2.z = posX.z - posC.z;

        // mirrorCamera.getWorldDirection(vec2);

        //let camPosition = new Vector3();
        //camPosition.setFromMatrixPosition(mirrorCamera.matrixWorld);
        //let vec1 = mirror.normal;
        //let vec2 = new Vector3(0,0, -1);
        //vec2.applyQuaternion(mirrorCamera.quaternion);
        //let vec2 = new Vector3(mirrorCamera.matrix[8], mirrorCamera.matrix[9], mirrorCamera.matrix[10]);

        if (!vec1 || !vec2)
        {
            console.log('[XCam] Dot product error.');
            return;
        }

        //let dot = mirror.position.dot(camPosition);
        let dot = vec1.dot(vec2);
        let s = Math.sign(dot);
        //console.log(s);
        //console.log(dot);
        let normalFactor = 1; // [Expert] replace with -1 to invert normal.
        let N = new Vector3(0, 0, s * normalFactor);
        N.applyMatrix4(matrix);

        //update mirrorCamera matrices!!
        //mirrorCamera.
        mirrorCamera.updateProjectionMatrix();
        mirrorCamera.updateMatrixWorld();
        // mirrorCamera.matrixWorldInverse.getInverse(mirrorCamera.matrixWorld);
        mirrorCamera.matrixWorldInverse.copy(mirrorCamera.matrixWorld).invert();

        // now update projection matrix with new clip plane
        // implementing code from: http://www.terathon.com/code/oblique.html
        // paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
        let clipPlane = new Plane();
        clipPlane.setFromNormalAndCoplanarPoint(N, mirror.position);
        clipPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);

        clipPlane = new Vector4(
            clipPlane.normal.x,
            clipPlane.normal.y,
            clipPlane.normal.z,
            clipPlane.constant);

        let q = new Vector4();
        let projectionMatrix = mirrorCamera.projectionMatrix;

        let sgn = Math.sign;
        q.x = (sgn(clipPlane.x) +
            projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (sgn(clipPlane.y) +
            projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) /
            mirrorCamera.projectionMatrix.elements[14];

        // Calculate the scaled plane vector
        let c = new Vector4();
        c = clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

        // Replace the third row of the projection matrix
        projectionMatrix.elements[2] = c.x;
        projectionMatrix.elements[6] = c.y;
        projectionMatrix.elements[10] = c.z + 1.0;
        projectionMatrix.elements[14] = c.w;
    },

    /** @deprecated */
    setAbsRotationFromServer(theta0, theta1)
    {
        if (this.oldTheta1 === theta1 && this.oldTheta0 === theta0) return false;
        this.setAbsRotation(theta0, theta1);
        this.oldTheta0 = theta0;
        this.oldTheta1 = theta1;
        return true;
    },

    setAbsRotation(theta0, theta1)
    {
        let camera = this.mainCamera;
        // let raycasterCamera = this.mainRaycasterCamera;
        theta1 = Math.max(0, Math.min(Math.PI, theta1));

        // v  Direct camera update, do not use for multiplayer.
        camera.setUpRotation(theta1, 0, theta0);

        // raycasterCamera.setUpRotation(theta1, 0, theta0);
    },

    setRelRotation(theta0, theta1)
    {
        let camera = this.mainCamera;
        let raycasterCamera = this.mainRaycasterCamera;
        // let rotationZ = camera.getZRotation();
        // let rotationX = camera.getXRotation();
        raycasterCamera.setZRotation(theta0);
        raycasterCamera.setXRotation(theta1);
        camera.setZRotation(theta0);
        camera.setXRotation(theta1);
    },

    updateCameraRotation(relX, relY, absX, absY, result)
    {
        // Rotate main camera.
        let camera = this.mainCamera;

        // Save rotation for animation / effects.
        let animationManager = this.graphicsEngine.animationManager;
        let rotationZ = camera.getZRotation();
        let rotationX = camera.getXRotation();
        animationManager.saveOldRotation(rotationX, rotationZ);
        // Do rotate.
        camera.rotateZ(-relX);
        camera.rotateX(-relY);
        // Save new rotation.
        rotationZ = camera.getZRotation();
        rotationX = camera.getXRotation();
        animationManager.saveNewRotation(rotationX, rotationZ);

        // Current up vector -> angles.
        let up = camera.get3DObject().rotation;
        let theta0 = up.z;
        let theta1 = up.x;

        // Rotate raycaster camera.
        // let raycasterCamera = this.mainRaycasterCamera;
        // raycasterCamera.setZRotation(rotationZ);
        // raycasterCamera.setXRotation(rotationX);

        // v  This is to rotate the global Z of camera.
        if (absX !== 0 || absY !== 0)
        {
            // Add angles.
            this.setAbsRotation(theta0 + absX, theta1 + absY);
            // theta0 = theta0 + absX;
            // theta1 = Math.max(0, Math.min(Math.PI, theta1 + absY));
            // camera.setUpRotation(theta1, 0, theta0);
            // raycasterCamera.setUpRotation(theta1, 0, theta0);
        }

        // Apply transform to portals.
        // if (this._renderPortals)
        //     this.updateCameraPortals(camera, rotationZ, rotationX, theta1, theta0);

        // Apply transform to local model.
        // this.graphicsEngine.app.model.backend.selfModel.cameraMoved(this.mainCamera);

        // drunken controls: tmpQuaternion.set(- movementY * 0.002, - movementX * 0.002, 0, 1).normalize();
        // camera.quaternion.multiply(tmpQuaternion);
        // camera.rotation.setFromQuaternion(camera.quaternion, camera.rotation.order);
        if (!result) return;
        result[0] = rotationZ;
        result[1] = rotationX;
        result[2] = theta0;
        result[3] = theta1;
    },

    updateCameraPortals(camera, rotationZ, rotationX, theta1, theta0)
    {
        let localRecorder = camera.getRecorder();
        this.subCameras.forEach(subCamera => //, cameraId
        {
            // remark. shouldn’t i clip after having rotated?
            subCamera.setZRotation(rotationZ);
            subCamera.setXRotation(rotationX);
            subCamera.setUpRotation(theta1, 0, theta0);
            subCamera.addRotationTransform();

            let mirrorCamera = subCamera.getRecorder();
            let mirror = subCamera.getScreen().getMesh();
            //let camera = mirrorCamera;
            if (mirrorCamera) {
                this.clipOblique(mirror, mirrorCamera, localRecorder);
            }
        });
    },

    resize(width, height)
    {
        let aspect = width / height;

        // Main cam
        let camera = this.mainCamera.getRecorder();
        camera.aspect = aspect;
        camera.updateProjectionMatrix();

        // Raycast
        let raycasterCamera = this.mainRaycasterCamera.getRecorder();
        raycasterCamera.aspect = aspect;
        raycasterCamera.updateProjectionMatrix();

        // Portals
        this.subCameras.forEach(function(currentCamera/*, cameraId*/) {
            let recorder = currentCamera.getRecorder();
            recorder.aspect = aspect;
            recorder.updateProjectionMatrix();
        });
        this.stencilCamera.aspect = aspect;
        this.stencilCamera.updateProjectionMatrix();

        // Water
        this.waterCamera.camera.aspect = aspect;
        this.waterCamera.camera.updateProjectionMatrix();
    },

    // Raycasting.
    createRaycaster()
    {
        return new Raycaster();
    },

    performRaycast()
    {
        let graphicsEngine = this.graphicsEngine;
        let chunkModel = graphicsEngine.app.model.backend.chunkModel;
        let selfModel = graphicsEngine.app.model.backend.selfModel;

        let raycaster = this.raycaster;
        let camera = this.mainRaycasterCamera.getRecorder();
        let mc = this.mainCamera.getRecorder();
        mc.updateMatrixWorld();
        camera.matrixWorld.copy(mc.matrixWorld);
        let terrain = chunkModel.getCloseTerrain(selfModel.worldId, selfModel.position);

        let intersects;
        raycaster.setFromCamera(new Vector2(0, 0), camera);
        intersects = raycaster.intersectObjects(terrain);

        return intersects;
    },

    cleanup()
    {
        this.mainCamera = this.createCamera(false, -1);
        this.mainCamera.setCameraId(-1);
        this.mainCamera.setThirdPerson();
        this.subCameras.clear();
        this.mainRaycasterCamera = this.createCamera(true, -1);
        this.raycaster = this.createRaycaster();
        this.oldTheta0 = 0;
        this.oldTheta1 = 0;
    }

});

extend(CameraManager.prototype, WaterCameraModule);

/** Interface with graphics engine. **/

let CamerasModule = {

    getCameraCoordinates()
    {
        return this.cameraManager.mainCamera.getCameraPosition();
    },

    getCameraForwardVector()
    {
        return this.cameraManager.mainCamera.getCameraForwardVector();
    },

    getModelForwardVector()
    {
        return this.cameraManager.mainCamera.getModelForwardVector();
    },

    /** @deprecated */
    switchToCamera(oldId, newId)
    {
        return this.cameraManager.switchToCamera(oldId, newId);
    }

};

export { CameraManager, CamerasModule, DEFAULT_CAMERA };
