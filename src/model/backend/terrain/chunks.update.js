/**
 * Handles terrain updates.
 */

'use strict';

import { WorldType } from './chunks';

let ChunkUpdateModule = {

    updateChunks(updates)
    {
        if (!updates) return;

        if (this.debug) {
            console.log(updates);
            let nbcc = 0;
            for (let cid in updates)
                if (updates[cid][1][1])
                    nbcc += updates[cid][1][1].length;
            console.log(nbcc);
        }

        // Stack updates, waiting for collector to refresh model.
        this.chunkUpdates.push(updates);
        this.needsUpdate = true;
    },

    processChunkInput(chunkUpdates, reportedUpdates)
    {
        let graphics = this.app.engine.graphics;
        let mustReport = false;

        for (let cu = 0, l = chunkUpdates.length; cu < l; ++cu)
        {
            let updates = chunkUpdates[cu];
            let rup = {};

            if ('worlds' in updates)
            {
                //console.log('World metadata:');
                //console.log(updates['worlds']);
                let worlds = updates.worlds;
                let worldsMeta = updates.worldsMeta;
                for (let wid in worlds) {
                    if (!worlds.hasOwnProperty(wid)) continue;

                    let wif = worlds[wid];
                    for (let id = 0, wl = wif.length; id < wl; ++id)
                        wif[id] = parseInt(wif[id], 10);

                    // Add new world and matching scene.
                    if (this.hasWorld(wid)) {
                        // console.log(`Update for a world I already have: ${wid}.`);
                        continue;
                    }

                    if (!worldsMeta || !worldsMeta.hasOwnProperty(wid)) {
                        console.error(`NO METADATA FOR NEW WORLD: ${wid}.`);
                        continue;
                    }
                    let wifm = worldsMeta[wid];
                    this.addWorldIfNotPresent(wid, wif, wifm);

                    // 1 world <-> 1 scene, multiple cameras
                    graphics.addScene(wid);

                    let newSky = graphics.addSky(wid, this.worldProperties.get(wid));
                    if (newSky)
                        this.skies.set(wid, newSky);
                }
            }

            for (let worldId in updates)
            {
                if (!updates.hasOwnProperty(worldId) ||
                    worldId === 'worlds' || worldId === 'worldsMeta')
                    continue;

                let subdates = updates[worldId];
                let sup = {};

                for (let chunkId in subdates)
                {
                    if (!subdates.hasOwnProperty(chunkId)) continue;

                    let update = subdates[chunkId];

                    if (!update) {
                        this.unloadChunk(worldId, chunkId);
                    }

                    else if (this.isChunkLoaded(worldId, chunkId) && update.length === 3)
                    {
                        this.updateChunk(worldId, chunkId, update);
                    }

                    else if (this.isChunkLoaded(worldId, chunkId) && update.length !== 3)
                    {
                        console.error(`WARN: corrupt update or model @refresh / updateChunk ${chunkId}.`);
                        console.log(update);
                        this.chunkUpdates = [];
                        return;
                    }

                    // Non-loaded chunk.
                    else if (update.length !== 2) {
                        console.error('WARN: corrupt update or model @refresh / initChunk.');
                        console.log(update);
                        return;

                        // One per iteration...
                    } else if (!mustReport) {
                        //console.log('[Server/Chunk] One more time');
                        //console.log('[Server/Chunk] Initing');
                        this.initializeChunk(worldId, chunkId, update);
                        mustReport = true;
                    } else {
                        //console.log('[Server/Chunk] Reporting');
                        sup[chunkId] = update;
                    }
                }

                if (Object.keys(sup).length > 0) {
                    rup[worldId] = sup;
                }
            }

            if (Object.keys(rup).length > 0) {
                reportedUpdates.push(rup);
            }
        }
    },

    initializeChunk(worldId, chunkId, all)
    {
        let graphics = this.app.engine.graphics;

        // Initialize model if a new world is transmitted.
        let world = this.worlds.get(worldId);
        if (!world) {
            console.error(`Got chunk ${chunkId} (${typeof worldId}) from an unknown world: ${worldId}`);
            return;
        }

        let property = this.worldProperties.get(worldId);
        let sizeX = property.chunkSizeX;
        let sizeY = property.chunkSizeY;
        let sizeZ = property.chunkSizeZ;

        let worldMeta = this.worldProperties.get(worldId);
        if (!worldMeta) { console.error(`World "${worldId}" type unknown.`); return; }
        let isWorldFlat = worldMeta.type === WorldType.FLAT;
        // || worldMeta.type === WorldType.FANTASY;
        // Water cameras not yet supported with fantasy generation
        let chunk = graphics.createChunk(chunkId, all, sizeX, sizeY, sizeZ, isWorldFlat, worldId);
        world.set(chunkId, chunk);

        // Add to scene.
        if (!chunk || !chunk.hasOwnProperty('meshes'))
        {
            console.error(`WARN. Update miss @ initializeChunk: ${chunkId}`);
            console.log(all);
            return;
        }
        let meshes = chunk.meshes;
        for (let m = 0, l = meshes.length; m < l; ++m) {
            graphics.addToScene(meshes[m], worldId);
        }
        if (chunk.shadow)
        {
            graphics.addToShadows(chunk.shadow);
            // graphics.addToScene(chunk.shadow);

            // const m = chunk.meshes[0];
            // graphics.addToScene(m, worldId);
            // let helper = new VertexNormalsHelper(m, 2, 0x00ff00, 1);
            // graphics.addToScene(helper, worldId);
        }
        if (graphics._debugChunkBoundingBoxes) {
            if (!chunk.debugMesh) console.error('[Server/Chunk] Missing debug mesh.');
            graphics.addToScene(chunk.debugMesh, worldId);
        }
    },

    updateChunk(worldId, chunkId, components)
    {
        let graphics = this.app.engine.graphics;

        let world = this.worlds.get(worldId);
        if (!world) {
            console.log('Error: updateChunk trying to access unloaded world.');
            return;
        }
        let property = this.worldProperties.get(worldId);

        let chunk = world.get(chunkId);
        if (!chunk) {
            console.log('Error: updateChunk trying to update unloaded chunk.');
            return;
        }

        let sizeX = property.chunkSizeX;
        let sizeY = property.chunkSizeY;
        let sizeZ = property.chunkSizeZ;

        let worldMeta = this.worldProperties.get(worldId);
        if (!worldMeta) { console.error(`World "${worldId}" type unknown.`); return; }
        let isWorldFlat = worldMeta.type === WorldType.FLAT;
        // || worldMeta.type === WorldType.FANTASY;
        // Water cameras not yet supported with fantasy generation
        graphics.updateChunk(
            worldId, chunk, chunkId, components,
            sizeX, sizeY, sizeZ,
            isWorldFlat
        );
    },

    unloadChunk(worldId, chunkId)
    {
        let graphics = this.app.engine.graphics;
        let world = this.worlds.get(worldId);
        if (!world) return;

        let chunk = world.get(chunkId);
        if (!chunk) {
            console.log(`WARN. Update miss @unloadChunk ${chunkId}`);
            return;
        }

        let meshes = chunk.meshes;
        for (let m = 0, l = meshes.length; m < l; ++m) {
            graphics.removeFromScene(meshes[m], worldId);
        }
        if (graphics._debugChunkBoundingBoxes) {
            if (!chunk.debugMesh) console.error('[Server/Chunk] Missing debug mesh.');
            graphics.removeFromScene(chunk.debugMesh, worldId);
        }

        world.delete(chunkId);
    },

};

export { ChunkUpdateModule };
