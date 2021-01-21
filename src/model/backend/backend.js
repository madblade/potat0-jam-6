/**
 * Contains game-specific data structures.
 */

'use strict';

import extend           from '../../extend.js';

import { ChunkModel }   from './chunks.js';
import { EntityModel }  from './entities/entities.js';
import { SelfModel }    from './self/self.js';
import { XModel }       from './x/x.js';

import { UpdateModule } from './updates.js';

let BackEnd = function(app)
{
    this.app = app;

    this.selfModel      = new SelfModel(app);
    this.chunkModel     = new ChunkModel(app);
    this.entityModel    = new EntityModel(app);
    this.xModel         = new XModel(app, this.selfModel);
    this.selfModel.xModel = this.xModel;

    this.isRunning = false;
};

extend(BackEnd.prototype, UpdateModule);

extend(BackEnd.prototype, {

    init(level)
    {
        this.isRunning = true;
        this.selfModel.init(level);
        this.chunkModel.init(level);
        this.entityModel.init(level);
        this.xModel.init();
    },

    stop()
    {
        this.isRunning = false;
    },

    // Update graphics.
    refresh()
    {
        this.selfModel.refresh();
        this.chunkModel.refresh();
        this.entityModel.refresh();
        this.xModel.refresh();
    },

    getSelfModel()
    {
        return this.selfModel;
    },

    cleanupFullModel()
    {
        this.selfModel.cleanup();
        this.chunkModel.cleanup();
        this.entityModel.cleanup();
        this.xModel.cleanup();
    }

});

export { BackEnd };
