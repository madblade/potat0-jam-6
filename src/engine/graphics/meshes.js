/**
 * Mesh management.
 */

'use strict';

import Tato                 from '../../assets/models/tato-compact.glb';
import BigCup               from '../../assets/models/bigcup.glb';
import LittleCup            from '../../assets/models/littlecup.glb';
import Axolotl              from '../../assets/models/axolotl.glb';
import { ItemType }         from '../../model/backend/self/items';
import { GLTFLoader }       from 'three/examples/jsm/loaders/GLTFLoader';
import { SkeletonUtils }    from 'three/examples/jsm/utils/SkeletonUtils';
import {
    Mesh,
    BoxGeometry,
    PlaneGeometry,
    Object3D,
    Group,
    TetrahedronBufferGeometry,
    MeshPhongMaterial
} from 'three';

let MeshesModule = {

    // Load meshes here.
    //    (don’t forget loadingState.notifyTaskName())
    loadReferenceMeshes()
    {
        this.referenceMeshes = new Map();
        let meshesToLoad = new Map([
            ['tato', Tato],
            ['bigcup', BigCup],
            ['littlecup', LittleCup],
            ['axolotl', Axolotl]
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
            if (path === Tato)
            {
                this.finalizeMainCharacter(gltf, successCallback);
            }
            else
            {
                if (successCallback)
                    successCallback(gltf);
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
        // const clone = SkeletonUtils.clone(gltf.scene);
        if (callback) callback(gltf);
    },

    prepareMainCharacter(gltf)
    {
        let scene = SkeletonUtils.clone(gltf.scene);
        let object = scene.children[0];
        object.name = 'gltf0';
        object.position.set(0, -0.15, 0.07);
        object.scale.set(0.44, 0.44, 0.44);
        object.traverse(o => {
            if (!o.isMesh) return;
            o.userData.hasPrimaryImage = true;
            o.userData.hasReflection = true;
            // o.userData.bloom = true;
        });

        let innerWrapper = new Object3D();
        innerWrapper.name = 'inner';
        innerWrapper.add(object);

        let wrapper = new Object3D();
        wrapper.name = 'outer';
        wrapper.add(innerWrapper);
        wrapper.userData.animations = gltf.animations;

        wrapper.getInnerObject = () => innerWrapper;

        return wrapper;
    },

    prepareBigCup(gltf)
    {
        const scene = SkeletonUtils.clone(gltf.scene);
        const cup = scene.children[0];
        const leftEye = scene.children[1];
        const rightEye = scene.children[2];
        cup.name = 'gltf0';

        cup.geometry.computeVertexNormals();

        const tetGeo = new TetrahedronBufferGeometry();
        const phong = new MeshPhongMaterial(
            {
                color: '#703e9b'
            }
        );
        const tetrahedronHelper = new Mesh(tetGeo, phong);
        tetrahedronHelper.position.set(0, 3.5, 0);
        tetrahedronHelper.rotation.set(
            Math.PI / 5, 0, Math.PI / 4
        );
        tetrahedronHelper.scale.multiplyScalar(0.001);

        const innerWrapper = new Object3D();
        innerWrapper.name = 'inner';
        innerWrapper.add(cup);
        innerWrapper.add(leftEye);
        innerWrapper.add(rightEye);
        innerWrapper.add(tetrahedronHelper);

        innerWrapper.position.set(0, -0.5, 0);
        innerWrapper.scale.set(0.4, 0.4, 0.4);

        const wrapper = new Object3D();
        wrapper.name = 'outer';
        wrapper.add(innerWrapper);

        wrapper.getInnerObject = () => innerWrapper;

        return wrapper;
    },

    prepareLittleCup(gltf)
    {
        let scene = SkeletonUtils.clone(gltf.scene);
        let object = scene.children[0];
        object.name = 'gltf0';
        object.position.set(0, -0.15, 0.07);
        object.scale.set(0.44, 0.44, 0.44);

        let innerWrapper = new Object3D();
        innerWrapper.name = 'inner';
        innerWrapper.add(object);

        let wrapper = new Object3D();
        wrapper.name = 'outer';
        wrapper.add(innerWrapper);

        wrapper.getInnerObject = () => innerWrapper;

        return wrapper;
    },

    prepareAxolotl(gltf)
    {
        let scene = SkeletonUtils.clone(gltf.scene);
        let object = scene.children[0];
        object.name = 'gltf0';
        object.position.set(0, -0.15, 0.07);
        object.scale.set(0.44, 0.44, 0.44);
        // object.scale.multiplyScalar(0.010);

        // object.material.flatShading = true;
        let innerWrapper = new Object3D();
        innerWrapper.name = 'inner';
        innerWrapper.add(object);

        let wrapper = new Object3D();
        wrapper.name = 'outer';
        wrapper.add(innerWrapper);

        wrapper.getInnerObject = () => innerWrapper;

        return wrapper;
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
        if (!(mesh instanceof Object3D) && !(mesh.scene instanceof Group))
            console.warn(
                `[Graphics/Meshes] "${id}" should be an instance of Object3D.`
            );

        let clone;
        // if (id !== 'tato') clone = cloneGeometry ? mesh.clone() : mesh;
        // clone allows to reuse objects (but then the morph targets are reset)
        // so use only for arrows in this setup.

        switch (id)
        {
            case 'tato':
                clone = this.prepareMainCharacter(mesh);
                break;
            case 'bigcup':
                clone = this.prepareBigCup(mesh);
                break;
            case 'littlecup':
                clone = this.prepareLittleCup(mesh);
                break;
            case 'axolotl':
                clone = this.prepareAxolotl(mesh);
                break;
            default:
                clone = cloneGeometry ? mesh.clone() : mesh;
        }

        clone.rotation.reorder('ZYX');
        // clone.material.morphTargets = true;

        // let inner = clone.children[0];
        // console.log(inner);
        // if (inner && renderOnTop) this.renderOnTop(inner);
        // if (inner.children && inner.children.length === 4) this.renderOnTop(inner);
        // for (let i = 0; i < inner.children.length; ++i)
        //     inner.children[i].renderOrder = 9999;

        return clone;
    },

    /** @deprecated */
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

    /** @deprecated */
    createMesh(geometry, material)
    {
        return new Mesh(geometry, material);
    }

};

export { MeshesModule };
