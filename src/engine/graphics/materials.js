/**
 *
 */

'use strict';

import {
    DataTexture,
    DoubleSide,
    FrontSide,
    LuminanceFormat,
    MeshBasicMaterial,
    MeshLambertMaterial,
    MeshPhongMaterial,
    MeshToonMaterial,
    NearestFilter,
} from 'three';

let MaterialsModule = {

    createMaterial(whatMaterial, meta, worldId)
    {
        let material;

        switch (whatMaterial)
        {
            case 'flat-phong':
                material = new MeshPhongMaterial({
                    specular: 0xffffff,
                    flatShading: true,
                    color: meta && meta.color ? meta.color : null,
                });
                break;
            case 'smooth-phong':
                material = new MeshPhongMaterial({
                    shininess: meta && meta.shininess ? meta.shininess : 0,
                    specular: '#858585',
                    emissive: 0x000000,
                    side: FrontSide,
                    color: meta && meta.color ? meta.color : null,
                });
                material.receiveShadow = true;
                break;
            case 'toon':
                const nbColors = meta.nbColors;
                const colors = new Uint8Array(nbColors);
                for (let c = 0; c <= colors.length; ++c) {
                    colors[c] = (c / colors.length) * 256;
                }
                const gradientMap = new DataTexture(colors, colors.length, 1, LuminanceFormat);
                gradientMap.minFilter = NearestFilter;
                gradientMap.magFilter = NearestFilter;
                gradientMap.generateMipmaps = false;
                material = new MeshToonMaterial({
                    side: FrontSide,
                    color: meta && meta.color ? meta.color : null,
                    gradientMap
                });
                material.receiveShadow = true;
                break;

            case 'textured-phong':
                if (worldId === undefined) worldId = '-1';
                let im = this.instancedMaterials.get(worldId);
                if (!im)
                {
                    let params = {
                        side: FrontSide,
                        map: this.textureAtlas,
                        transparent: false
                    };

                    material = new MeshLambertMaterial(params);
                    let materials = [material]; // 0 -> material for main cam
                    // if (worldId === -1) materials.push(material.clone()); // 1 -> material for secondary cam
                    this.instancedMaterials.set(worldId, materials);
                }
                else
                {
                    material = im[0];
                    if (!material)
                    {
                        console.error(`[Materials] Could not get instanced material for ${worldId}.`);
                    }
                }
                break;

            case 'textured-phong-water':
                if (worldId === undefined) worldId = '-1';
                let wm = this.waterMaterials.get(worldId);
                if (!wm)
                {
                    let params = {
                        side: FrontSide,
                        map: this.textureAtlas,
                        transparent: true
                    };
                    material = new MeshLambertMaterial(params);
                    this.waterMaterials.set(worldId, material);
                }
                else
                {
                    material = wm;
                    if (!material)
                    {
                        console.error(`[Materials] Could not get instanced material for ${worldId}.`);
                    }
                }
                break;

            case 'basic-black':
                material = new MeshBasicMaterial({
                    wireframe:true,
                    color: 0x000000
                });
                break;
            case 'grey-phong-double':
                material = new MeshPhongMaterial({
                    specular: 0xaaaaaa,
                    flatShading: true,
                    side: DoubleSide,
                    color: meta && meta.color ? meta.color : null,
                });
                break;

            default: // Block material
                material = new MeshBasicMaterial({
                    color:0xff0000
                });
        }

        return material;
    }

};

export { MaterialsModule };
