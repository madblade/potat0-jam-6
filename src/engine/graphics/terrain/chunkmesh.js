import {
    BoxBufferGeometry, Mesh, MeshBasicMaterial,
    DoubleSide, Vector3
} from 'three';
import { Water } from '../water/water';

let ChunksMeshModule = {

    createChunkMesh(geometry, isWater, isWorldFlat, worldId)
    {
        if (isWater)
        {
            // low-res
            if (!isWorldFlat || !this.rendererManager.waterReflection || worldId !== '-1')
            {
                let material = this.createMaterial(
                    'textured-phong-water', 0xaaaaaa, worldId
                );
                material.transparent = true;
                material.opacity = 0.5;
                material.side = DoubleSide;
                return new Mesh(geometry, material);
            }
            else
            {
                const waterResolution = this.waterRTTResolution;
                return new Water(
                    this,
                    geometry,
                    {
                        textureWidth: waterResolution,
                        textureHeight: waterResolution,
                        waterNormals: this.textureWaterNormals,
                        alpha: 1.0,
                        sunDirection: new Vector3(0., 0., 0.7),
                        sunColor: 0xffffff,
                        waterColor: 0x7b8a99,
                        // distortionScale: 3.7,
                        distortionScale: 0.1,
                        size: 20.0,
                        fog: false
                    },
                    worldId
                );
            }
        }
        else
        {
            // let c = '#3e94d7';
            let material = this.createMaterial(
                // 'textured-phong', 0xaaaaaa, worldId
                'grey-phong-double', 0xaaaaaa, worldId
            );
            return new Mesh(geometry, material);
        }
    },

    createChunkDebugMesh(chunkSizeX, chunkSizeY, chunkSizeZ)
    {
        return new Mesh(
            new BoxBufferGeometry(
                chunkSizeX, chunkSizeY, chunkSizeZ,
                1, 1, 1),
            new MeshBasicMaterial({wireframe: true, color: 0x00ff00})
        );
    }

};

export { ChunksMeshModule };
