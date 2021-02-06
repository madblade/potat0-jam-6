/**
 *
 */

'use strict';

import extend                from '../../../extend.js';

import { InventoryModel }    from './inventory.js';
import { Object3D, Vector3, Vector4 } from 'three';
import { SelfInterpolationModule } from './self.interpolate';
import { SelfUpdateModule } from './self.update';
import { SelfObjectsModule } from './self.objects';

let SelfModel = function(app)
{
    this.app = app;
    this.xModel = null;

    // General.
    this.entityId = '-1';     // Self default
    this.worldId = '-1';      // Overworld default
    this.oldWorldId = null;

    // Model component.
    this.position = new Vector3(0, 0, 0);
    this.rotation = new Vector4(0, 0, 0, 0);
    this.inventoryModel = new InventoryModel();

    // Graphical component.
    this.worldNeedsUpdate = false;
    this.needsUpdate = false;
    this.displayAvatar = true;
    this.displayHandItem = false;

    this.avatar = null;
    this.handItem = null;
    this.handItemWrapper = new Object3D();
    this.handItemWrapper.rotation.reorder('ZYX');

    // Melee mesh
    this.meleeEffectMesh = null;
    this.needsStartMelee = false;
    this.isHittingMelee = false;
    this.meleeWorld = null;

    // Loading bow
    this.isLoadingBow = false;
    this.needsStartLoadingBow = false;
    this.needsStopLoadingBow = false;

    // Interpolation-prediction
    this.useInterpolation = false;
    if (this.useInterpolation)
        this.initInterpolation();
};

extend(SelfModel.prototype, {

    init(level)
    {
        this.loadSelf();
        let player = level.getPlayer();
        const positionVector = new Vector3().fromArray(player.position);
        const rotationVector = new Vector4().fromArray([0, 0, 0, 0]); // player.rotation
        console.log('[Model/Self] TODO bind player state from level.');
        this.updateSelf(positionVector, rotationVector, '-1'); // -1 === main world
        this.updatePosition(this.avatar, this.avatar.position);

        // Notify physics engine.
        let physics = this.app.engine.physics;
        physics.addCharacterController(this);
    },

    // Called every client frame.
    refresh()
    {
        if (!this.needsUpdate)
        {
            if (this.useInterpolation && !this.interpolationUpToDate)
                this.interpolatePredictSelfPosition();

            if (this.isHittingMelee)
                this.updateMelee();

            this.updateBow();
            return;
        }

        let avatar = this.avatar;

        if (!avatar) return;

        if (this.useInterpolation && !this.interpolationUpToDate)
            this.interpolatePredictSelfPosition();
        else
            this.directUpdateSelfPosition();

        if (this.needsStartMelee)
        {
            this.needsStartMelee = false;
            this.initMelee();
        }

        if (this.isHittingMelee)
            this.updateMelee();

        this.updateBow();

        this.needsUpdate = false;
    },

    directUpdateSelfPosition()
    {
        let p = this.position;
        let r = this.rotation;

        this.updateRotation(this.avatar, r);
        this.updatePosition(this.avatar, p);
    },

    // Called every time a server update was received.
    updateSelf(p, r, w, s)
    {
        w = w.toString();

        let pos = this.position;
        let rot = this.rotation;
        let wid = this.worldId;
        if (!pos || !rot ||
            pos.x !== p.x || pos.y !== p.y || pos.z !== p.z ||
            rot.x !== r.x || rot.y !== r.y)
        {
            this.position.copy(p);
            this.rotation.copy(r);
            this.needsUpdate = true;
            if (this.useInterpolation)
                this.interpolationUpToDate = false;
        }

        if (!wid || wid !== w)
        {
            this.needsUpdate = true;
            this.worldNeedsUpdate = true;
            this.oldWorldId = this.worldId;
            this.newWorldId = w;
            // this.worldId = w;
        }

        if (s) {
            let hasJustMeleed = s[1];
            if (hasJustMeleed)
            {
                this.needsStartMelee = true;
            }
            let loadingBow = !!s[2];
            if (loadingBow !== this.isLoadingBow)
            {
                this.isLoadingBow = loadingBow;
                if (this.isLoadingBow)
                {
                    this.needsStartLoadingBow = true;
                    this.needsStopLoadingBow = false;
                }
                else
                {
                    this.needsStopLoadingBow = true;
                    this.needsStartLoadingBow = false;
                }
            }
        }
    },

    cameraMoved(cameraObject)
    {
        let handItem = this.handItem;
        if (!handItem) return;
        handItem.rotation.x = cameraObject.pitch.rotation.x;
        handItem.rotation.z = cameraObject.yaw.rotation.z;
        let handItemWrapper = this.handItemWrapper;
        handItemWrapper.rotation.copy(cameraObject.up.rotation);
        // handItem.children[0].rotation.x += 0.01;
    },

    getSelfPosition()
    {
        return this.position;
    },

    getHeadPosition()
    {
        let head = this.avatar.getHead();
        if (!head) return null;
        return head.position;
    },

    getInventory()
    {
        return this.inventoryModel;
    },

    getTime()
    {
        return window.performance.now();
    },

    cleanup()
    {
        // General
        this.entityId = '-1';
        this.worldId = '-1';
        this.oldWorldId = null;

        // Model component.
        this.position.set(0, 0, 0);
        this.rotation.set(0, 0, 0, 0);
        this.inventoryModel.reset();

        // Graphical component.
        this.worldNeedsUpdate = false;
        this.needsUpdate = false;
        this.displayAvatar = true;
        this.displayHandItem = true;

        this.avatar = null;
        this.lastServerUpdateTime = this.getTime();
        this.averageDeltaT = -1;
        // XXX [CLEANUP] avatar graphical component.
    }

});

extend(SelfModel.prototype, SelfInterpolationModule);
extend(SelfModel.prototype, SelfUpdateModule);
extend(SelfModel.prototype, SelfObjectsModule);

export { SelfModel };
