/**
 *
 */

'use strict';

/** Model **/

import extend                from '../../../extend';
import { ChunkUpdateModule } from './chunks.update';

const WorldType = Object.freeze({
    FLAT: 0,
    CUBE: 1,
    SHRIKE: 2,
    UNSTRUCTURED: 3,
    FANTASY: 4,
});

let ChunkModel = function(app)
{
    this.app = app;

    // Model component.
    this.worlds = new Map();
    this.worldProperties = new Map();
    this.chunkUpdates = [];

    // Whatever lies between.
    this.skies = new Map();

    // Graphical component.
    this.needsUpdate = false;
    this.debug = false;
};

extend(ChunkModel.prototype, {

    hasWorld(worldId)
    {
        return this.worlds.has(worldId);
    },

    addWorldIfNotPresent(worldId, worldInfo, worldInfoMeta)
    {
        // console.log('This world I don\'t know... ' + worldId);
        let world = new Map();
        let properties = {
            chunkSizeX : worldInfo[0], // 16,
            chunkSizeY : worldInfo[1], // 16,
            chunkSizeZ : worldInfo[2],  // 32
            type : worldInfoMeta[0],
            radius : worldInfoMeta[1],
            center : {
                x: worldInfoMeta[2], y: worldInfoMeta[3], z: worldInfoMeta[4]
            }
        };

        properties.chunkCapacity =
            properties.chunkSizeX * properties.chunkSizeY * properties.chunkSizeZ;

        this.worlds.set(worldId, world);
        this.worldProperties.set(worldId, properties);

        return properties;
    },

    /** Dynamics **/

    init(level)
    {
        let terrain = level.getTerrain();
        if (!terrain) return;

        let graphics = this.app.engine.graphics;
        let worlds = terrain.worlds;
        for (let i = 0; i < worlds.length; ++i)
        {
            let currentWorld = worlds[i];
            let wid = currentWorld.id;
            this.worlds.set(wid, new Map()); // world id -> world = map[chunk id -> chunk]
            // graphics.addScene(wid);
            if (currentWorld.sky === 'standard')
            {
                let newSky = graphics.addSky(wid, { type: WorldType.FLAT });
                this.skies.set(wid, newSky);
            }
        }

        let heightMaps = terrain.heightmaps;
        for (let i = 0; i < heightMaps.length; ++i)
        {
            const currentHeightMap = heightMaps[i];
            const wid = currentHeightMap.world;
            if (!this.worlds.has(wid)) {
                console.warn('[Graphics/Chunks] Got a HeightMap for an unknown world.');
                continue;
            }
            const world = this.worlds.get(wid);

            let chunks = currentHeightMap.chunks;
            let nbX = currentHeightMap.nbChunksX;
            let nbY = currentHeightMap.nbChunksY;
            if (nbX > 32 || nbY > 32)
            {
                console.error('[Graphics/Chunks] Not supporting large maps (> 32 chunks).');
                continue;
            }

            // Put into loaded model.
            // if (!world.heightmaps) world.heightmaps = [currentHeightMap];
            // else world.heightmaps.push(currentHeightMap);

            for (let x = 0; x < nbX; ++x)
                for (let y = 0; y < nbY; ++y)
                {
                    const id = `${x},${y}`;
                    let c = chunks.get(id);
                    if (!c) console.warn(`[Graphics/Chunks] Could not get chunk ${id}.`);
                    this.loadChunkFromLevel(c, wid, world);
                }
        }
    },

    loadChunkFromLevel(chunk, worldId, world)
    {
        // Add to graphics.
        let graphics = this.app.engine.graphics;
        let graphicalChunk = graphics.createChunkFromLevel(chunk, worldId);
        graphics.addToScene(graphicalChunk, worldId);

        // Add to model.
        const chunkId = `${chunk.x},${chunk.y},${chunk.z}`;
        let chk = world.get(chunkId);
        if (chk)
        {
            chk.meshes.push(graphicalChunk);
            chk.water.push(chunk.isWater); // shouldn’t be needed if water.z === 0 all the time
        }
        else
        {
            world.set(chunkId, { meshes: [graphicalChunk], water: [chunk.isWater] });
        }

        // Add to physics.
        let physics = this.app.engine.physics;
        physics.addHeightMap(graphicalChunk, chunk.nbSegmentsX, chunk.nbSegmentsY);
    },

    refresh()
    {
        if (!this.needsUpdate) return;

        let chunkUpdates = this.chunkUpdates;
        let reportedUpdates = [];

        this.processChunkInput(chunkUpdates, reportedUpdates);

        this.chunkUpdates = reportedUpdates;
        if (reportedUpdates.length < 1)
            this.needsUpdate = false;
    },

    isChunkLoaded(worldId, chunkId)
    {
        let world = this.worlds.get(worldId);
        return world && world.has(chunkId);
    },

    getCloseTerrain(worldId, position)
    {
        // Only chunks within current world.

        // Get overworld by default. WARN security.
        if (!worldId) worldId = '-1';
        let world = this.worlds.get(worldId);
        if (!world) return;

        if (!position)
        {
            console.warn('[Raycaster] Player position undefined.');
            return;
        }

        let property = this.worldProperties.get(worldId);
        if (!property) return;
        let sizeX = property.chunkSizeX;
        let sizeY = property.chunkSizeY;
        let sizeZ = property.chunkSizeZ;

        const cx = Math.floor(position.x  / sizeX);
        const cy = Math.floor(position.y  / sizeY);
        const cz = Math.floor(position.z  / sizeZ);

        let fmod = (b, n) => ((Math.floor(b) % n) + n) % n;
        const fx = fmod(position.x, sizeX); const sx2 = sizeX / 2;
        const fy = fmod(position.y, sizeY); const sy2 = sizeY / 2;
        const fz = fmod(position.z, sizeZ); const sz2 = sizeZ / 2;
        let closestEight = [
            // this
            `${cx},${cy},${cz}`,

            // corner
            `${fx > sx2 ? cx + 1 : cx - 1},${fy > sy2 ? cy + 1 : cy - 1},${fz > sz2 ? cz + 1 : cz - 1}`,

            // edges
            `${fx > sx2 ? cx + 1 : cx - 1},${fy > sy2 ? cy + 1 : cy - 1},${cz}`,
            `${fx > sx2 ? cx + 1 : cx - 1},${cy},${fz > sz2 ? cz + 1 : cz - 1}`,
            `${cx},${fy > sy2 ? cy + 1 : cy - 1},${fz > sz2 ? cz + 1 : cz - 1}`,

            // faces
            `${fx > sx2 ? cx + 1 : cx - 1},${cy},${cz}`,
            `${cx},${cy},${fz > sz2 ? cz + 1 : cz - 1}`,
            `${cx},${fy > sy2 ? cy + 1 : cy - 1},${cz}`,
        ];

        let meshes = [];
        world.forEach(function(currentChunk, cid)
        {
            // XXX [GAMEPLAY] extract on 8 closest chunks.
            if (!currentChunk || !currentChunk.hasOwnProperty('meshes')) {
                console.log(`Warn: corrupted chunk inside client model ${cid}`);
                console.log(world);
                return;
            }

            if (!cid) return;
            const chunkCoords = cid.split(',');
            if (!chunkCoords || chunkCoords.length !== 3) return;
            const x = parseInt(chunkCoords[0], 10);
            const y = parseInt(chunkCoords[1], 10);
            const z = parseInt(chunkCoords[2], 10);
            const nid = `${x},${y},${z}`;
            if (closestEight.indexOf(nid) < 0) return;

            currentChunk.meshes.forEach(function(mesh) {
                if (!!mesh && !!mesh.geometry) { // empty chunk or geometry
                    meshes.push(mesh);
                }
            });
        });

        return meshes;
    },

    cleanup()
    {
        this.worlds.forEach(w => {
            w.forEach(currentChunk => {
                if (!!currentChunk && currentChunk.hasOwnProperty('meshes')) {
                    currentChunk.meshes.forEach(mesh => {
                        mesh.geometry.dispose();
                        mesh.material.dispose();
                    });
                }
            });
            w.clear();
        });
        this.worlds.clear();
        this.worldProperties.clear();
        this.chunkUpdates = [];

        // Sky collection.
        this.skies.forEach(s => {
            if (s.mesh) {
                s.mesh.geometry.dispose();
                s.mesh.material.dispose();
            }
            if (s.helper && s.helper.mesh) {
                s.helper.mesh.geometry.dispose();
                s.helper.mesh.material.dispose();
            }
        });
        this.skies.clear();

        // Graphical component.
        this.needsUpdate = false;
        this.debug = false;
        // XXX [CLEANUP] all meshes
    }
});

extend(ChunkModel.prototype, ChunkUpdateModule);

export { ChunkModel, WorldType };
