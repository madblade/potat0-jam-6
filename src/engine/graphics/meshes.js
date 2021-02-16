/**
 * Mesh management.
 */

'use strict';

import Shiro            from '../../assets/models/teishiro.glb';
import { ItemType }     from '../../model/backend/self/items';
import { GLTFLoader }   from 'three/examples/jsm/loaders/GLTFLoader';
import {
    Mesh,
    BoxGeometry,
    PlaneGeometry,
    Object3D
}                       from 'three';

let MeshesModule = {

    // Load meshes here.
    //    (don’t forget loadingState.notifyTaskName())
    loadReferenceMeshes()
    {
        this.referenceMeshes = new Map();
        let meshesToLoad = new Map([
            ['shiro', Shiro]
        ]);
        this._nbMeshesToLoad = meshesToLoad.size;

        let loader = new GLTFLoader(this.loadingManager);
        meshesToLoad.forEach((path, id) =>
        {
            this.loadMesh(path, loader, gltfObject => {
                this.referenceMeshes.set(id, gltfObject);
                this._nbMeshesLoadedOrError++;
            }, () => {
                this._nbMeshesLoadedOrError++;
            });
        });
    },

    loadMesh(path, loader, successCallback, errorCallback)
    {
        const loadingState = this.app.state.getState('loading');
        loader.load(path, gltf => {
            if (path === Shiro)
            {
                this.finalizeMainCharacter(gltf, successCallback);
            }
        }, () => {
            loadingState.notifyTaskName('mesh');
        }, error => {
            if (errorCallback) errorCallback();
            console.error(error);
        });
    },

    finalizeMainCharacter(gltf, callback)
    {
        let object = gltf.scene.children[0];
        console.log(object);

        object.position.set(0, -0.15, 0.07);
        object.scale.set(0.44, 0.44, 0.44);
        let wrapper = new Object3D();
        wrapper.rotation.reorder('ZYX');
        wrapper.add(object);

        // object.getWrapper = () => wrapper;

        if (callback) callback(wrapper);
    },

    getItemMesh(itemID, renderOnTop, cloneGeometry)
    {
        let itemName = this.getMeshIDFromItemID(itemID);
        if (itemName) { // It’s a handheld item with a specific mesh
            if (itemID === ItemType.PORTAL_GUN_DOUBLE) {
                // XXX [GAMEPLAY] make it purple
            } else if (itemID === ItemType.PORTAL_GUN_SINGLE) {
                // XXX [GAMEPLAY] make it blue and orange
            }
            return this.loadReferenceMeshFromMemory(itemName, renderOnTop, cloneGeometry);
        } else { // It’s probably a block.
            let g = this.createGeometry('box');
            let m = this.createMaterial('flat-phong');
            let ms = this.createMesh(g, m);
            ms.scale.set(0.4, 0.4, 0.4);
            ms.position.set(0.4, -.25, -0.25);
            this.renderOnTop(ms);
            let wrapper = new Object3D();
            wrapper.rotation.reorder('ZYX');
            wrapper.add(ms);
            return wrapper;
        }
    },

    getMeshIDFromItemID(itemID)
    {
        switch (itemID) {
            case ItemType.PORTAL_GUN_SINGLE: return 'portal-gun';
            case ItemType.PORTAL_GUN_DOUBLE: return 'portal-gun';
            case ItemType.YA: return 'ya';
            case ItemType.YARI: return 'yari';
            case ItemType.YUMI: return 'yumi-morph';
            case ItemType.KATANA: return 'katana';
            case ItemType.NAGINATA: return 'naginata';
            case ItemType.NAGAMAKI: return 'nagamaki';
            case ItemType.NODACHI: return 'nodachi';
            default: return;
        }
    },

    renderOnTop(object)
    {
        if (object.children && object.children.length === 4)
        {
            let c0 = object.children[0];
            let c1 = object.children[1];
            let c2 = object.children[2];
            let c3 = object.children[3];
            c0.renderOrder = 996; c0.material.transparent = true;
            c1.renderOrder = 997; c1.material.transparent = true;
            c2.renderOrder = 998; c2.material.transparent = true;
            c3.renderOrder = 996; c3.material.transparent = true;
            if (!this.hasShadowVolumes())
                c0.onBeforeRender = renderer => renderer.clearDepth();
        }

        if (object.material)
        {
            object.material.transparent = true;
            object.material.morphTargets = true;
            object.renderOrder = 999;
            if (!this.hasShadowVolumes())
                object.onBeforeRender = renderer => renderer.clearDepth();
        }
    },

    loadReferenceMeshFromMemory(id, renderOnTop, cloneGeometry)
    {
        if (!this.referenceMeshes.has(id)) {
            console.error(`[Graphics/Meshes] Could not charge a new "${id}" mesh.`);
            return;
        }

        let mesh = this.referenceMeshes.get(id);
        if (!(mesh instanceof Object3D))
            console.warn(`[Graphics/Meshes] "${id}" should be an instance of Object3D.`);

        let clone = cloneGeometry ? mesh.clone() : mesh;
        // clone allows to reuse objects (but then the morph targets are reset)
        // so use only for arrows in this setup.

        clone.rotation.reorder('ZYX');
        // clone.material.morphTargets = true;

        let inner = clone.children[0];
        // console.log(inner);
        if (inner && renderOnTop) this.renderOnTop(inner);
        // if (inner.children && inner.children.length === 4) this.renderOnTop(inner);
        // for (let i = 0; i < inner.children.length; ++i)
        //     inner.children[i].renderOrder = 9999;

        return clone;
    },

    createGeometry(whatGeometry)
    {
        let geometry;

        switch (whatGeometry) {
            case 'plane':
                geometry = new PlaneGeometry(32, 32, 32, 32);
                break;

            case 'box':
                geometry = new BoxGeometry(0.45, 0.45, 0.45);
                break;

            default:
                geometry = new BoxGeometry(0.5, 0.5, 1);
        }

        return geometry;
    },

    createMesh(geometry, material)
    {
        return new Mesh(geometry, material);
    }

};

export { MeshesModule };
