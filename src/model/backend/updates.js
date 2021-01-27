/**
 *
 */

'use strict';

let UpdateModule = {

    /**
     * @param data
     * format:
     *
     * av.position, [rot[0], oldRot[0], rot[2], rot[3]], av.worldId,
     * [av.hit, av._isHitting, av._loadingRanged, av._isParrying]
     *
     */
    updateMe(data)
    {
        if (!this.isRunning) return;

        const mainState = data[0];
        const position = mainState[0];
        const rotation = mainState[1];
        const world = mainState[2];
        const states = mainState[3];
        this.selfModel.updateSelf(
            position, rotation, world, states
        );
    },

    /**
     * @param data
     * format:
     *
     * {
     *    entityId: // 1st entity
     *       null .................. removed entity
     *       {p: [], r:[], k:''} ... added or updated entity,
     *    entityId: // etc.
     * }
     *
     */
    updateEntities(data)
    {
        if (!this.isRunning) return;

        this.entityModel.updateEntities(data);
    },

    /**
     * @param data
     * format:
     *
     * {
     *    worldsMeta: {worldId:[type, r, cx,cy,cz]} . World metadata
     *    worlds: {worldId:[x,y,z]} ................. World chunk dimensions
     *    worldId:
     *       {chunkId: [fastCC, fastCCId]} ........... Added chunk
     *       {chunkId: [removed, added, updated]} .... Updated chunk
     *       {chunkId: null} ......................... Removed chunk
     * }
     *
     */
    updateChunks(data)
    {
        if (!this.isRunning) return;

        this.chunkModel.updateChunks(data);
    },

    /**
     * @param data
     * format:
     *
     * {
     *    portalId:
     *       null ................................... removed portal
     *       [otherId, chunkId, worldId, ...state] .. new or updated portal
     * }
     *
     */
    updateX(data)
    {
        if (!this.isRunning) return;

        this.xModel.updateX(data);
    }

};

export { UpdateModule };
