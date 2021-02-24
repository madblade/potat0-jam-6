/**
 * Camera wrapper.
 */

'use strict';

import extend           from '../../../extend';

import {
    Object3D,
    PerspectiveCamera,
    Quaternion,
    Vector3
}                       from 'three';

let Camera = function(
    fov, aspect, nearPlane, farPlane, worldId
)
{
    // Wrap for primitive manipulation simplicity.
    let camera = new PerspectiveCamera(fov, aspect, nearPlane, farPlane);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    let pitch = new Object3D();
    let yaw = new Object3D();
    let up = new Object3D();
    pitch.add(camera);
    yaw.add(pitch);
    up.add(yaw);
    up.rotation.reorder('ZYX');

    // 4D logic
    this.worldId = worldId;
    this.cameraId = null;
    this.cameraTransform = [
        0, 0, 0,    // Pos transform
        0, 0, 0     // Rot transform
    ];

    // Don't expose these internal variables.
    this.up = up;                   // 3D 'gravity' constraint (full rotation)
    this.yaw = yaw;                 // Top-level    (rotation.z, position)
    this.pitch = pitch;             // Intermediate (rotation.x)
    this.cameraObject = camera;     // Explicit     (constant)

    this.screen = null;
};

extend(Camera.prototype, {

    setCameraId(cameraId)
    {
        this.cameraId = cameraId;
    },

    getCameraId()
    {
        return this.cameraId;
    },

    setWorldId(worldId)
    {
        this.worldId = worldId;
    },

    getWorldId()
    {
        return this.worldId;
    },

    getRecorder()
    {
        return this.cameraObject;
    },

    get3DObject()
    {
        return this.up;
    },

    getCameraPosition()
    {
        return this.up.position;
    },

    getUpRotation()
    {
        return this.up.rotation;
    },

    rotateX(deltaX)
    {
        let pitch = this.pitch;
        pitch.rotation.x += deltaX;
        pitch.rotation.x = Math.max(0, Math.min(1.1 * Math.PI / 2, pitch.rotation.x));
    },

    rotateZ(deltaZ)
    {
        let yaw = this.yaw;
        yaw.rotation.z += deltaZ;
    },

    setUpRotation(x, y, z)
    {
        let up = this.up;
        up.rotation.x = x;
        up.rotation.y = y;
        up.rotation.z = z;
    },

    getXRotation()
    {
        return this.pitch.rotation.x;
    },

    setXRotation(rotationX)
    {
        this.pitch.rotation.x = rotationX;
    },

    getZRotation()
    {
        return this.yaw.rotation.z;
    },

    setZRotation(rotationZ)
    {
        this.yaw.rotation.z = rotationZ;
    },

    copyCameraPosition(otherCamera)
    {
        if (otherCamera)
        {
            let up = this.up.position;
            let oup = otherCamera.getCameraPosition();
            up.x = oup.x;
            up.y = oup.y;
            up.z = oup.z;
        }
    },

    copyCameraUpRotation(otherCamera)
    {
        if (otherCamera)
        {
            let ur = this.up.rotation;
            let our = otherCamera.getUpRotation();
            ur.x = our.x;
            ur.y = our.y;
            ur.z = our.z;
        }
    },

    addPositionTransform()
    {
        let p = this.up.position;
        let transform = this.cameraTransform;
        if (!transform) return;
        p.x += transform[0];
        p.y += transform[1];
        p.z += transform[2];
    },

    addRotationTransform()
    {
        // let rup = this.get3DObject().rotation;
        // let transform = this.cameraTransform;
        // if (!transform) return;
        // rup.x += transform[3];
    },

    setCameraPosition(x, y, z)
    {
        let up = this.up;

        up.position.x = x;
        up.position.y = y;
        // console.log(z);
        up.position.z = z;
    },

    setScreen(screen)
    {
        if (screen) this.screen = screen;
    },

    getScreen()
    {
        return this.screen; // || (function() {throw Error('Screen ' + this.getCameraId + ' undefined')})();
    },

    setCameraTransform(cameraTransform)
    {
        this.cameraTransform = cameraTransform;
    },

    getCameraTransform()
    {
        return this.cameraTransform;
    },

    /** @deprecated */
    setFirstPerson()
    {
        this.cameraObject.position.z = 0;
    },

    setThirdPerson()
    {
        let p = this.cameraObject.position;
        p.set(0, 0, 2);
        this.setXRotation(Math.PI / 3);
    },

    getCameraForwardVector()
    {
        let nv = new Vector3(0, -1, 0);
        // nv.normalize();
        let camQ = new Quaternion();
        this.cameraObject.getWorldQuaternion(camQ);
        nv.applyQuaternion(camQ);
        return nv;
    },

    getModelForwardVector()
    {
        let nv = new Vector3(0, 0, -1);
        let camQ = new Quaternion();
        this.cameraObject.getWorldQuaternion(camQ);
        nv.applyQuaternion(camQ);
        return nv;
    }

});

export { Camera };
