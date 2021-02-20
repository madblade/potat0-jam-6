/**
 * Front-end graphics.
 */

'use strict';

import extend                   from '../../extend';

// Base dependencies.
import { CoreModule }           from './core';
import { LightModule }          from './light';
import { MaterialsModule }      from './materials';
import { MeshesModule }         from './meshes';
import { TexturesModule }       from './textures';
import { EntitiesModule }       from './objects/entities/entities';
import { ItemsGraphicsModule }  from './objects/entities/items';
import { PortalsModule }        from './objects/portals/portals';
import {
    CameraManager,
    CamerasModule
}                               from './render/cameras';
import {
    RendererManager,
    RenderersModule
}                               from './render/renderer';
import {
    SceneManager,
    ScenesModule
}                            from './render/scene';
import { AnimationManager }  from './animations/animations';
import { FacesModule }       from './objects/terrain/chunks.voxels.faces';
import { ChunksModule }      from './objects/terrain/chunks';
import { ChunksMeshModule }  from './objects/terrain/chunks.mesh';
import { ShadersModule }     from './shaders/shaders';
import { SkyModule }         from './objects/sky/skies';
import { TextModule }        from './text/text';
import { ChunksVoxelModule } from './objects/terrain/chunks.voxels';

let Graphics = function(app)
{
    // App and access to models.
    this.app = app;

    // User customizable settings.
    this.settings = {}; // TODO [HIGH] bind graphics settings
    this.debug = false;

    // Properties.
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.defaultGeometrySize = 64; // This could be customized
    this._defaultEmptyChunkSize = 16;

    // Rendering.
    this.requestId          = null;
    this.sceneManager       = new SceneManager(this);
    this.rendererManager    = new RendererManager(this);
    this.cameraManager      = new CameraManager(this);
    this.animationManager   = new AnimationManager(this);

    // Interaction.
    this.controls =     null;

    // Loading.
    this.loadingManager = null;

    // Textures
    this.textureAtlas = null;
    this.textureWaterNormals = null;
    this.textureCoordinates = null;
    this._nbTexturesLoaded = 0;
    this._nbTexturesToLoad = 0;

    // Water
    this.oneWater = false;

    // Meshes
    this.referenceMeshes = null;
    this._nbMeshesToLoad = 0;
    this._nbMeshesLoadedOrError = 0;
    this._debugChunkBoundingBoxes = false;

    // Materials
    this.instancedMaterials = new Map(); // Chunks
    this.waterMaterials = new Map(); // Waters
    this.waterRTTResolution = 512;

    // Animations
    this.mixers = null;

    // Optimizations
    this.portalUpdates = [];
    this.lastRenderPaths = new Set();
    this.lastRenderGates = new Set();
    this.previousFrameWorld = null;
    this.currentFrameWorld = null;
};

extend(Graphics.prototype, CoreModule);
extend(Graphics.prototype, LightModule);
extend(Graphics.prototype, MaterialsModule);
extend(Graphics.prototype, MeshesModule);
extend(Graphics.prototype, TexturesModule);
extend(Graphics.prototype, EntitiesModule);
extend(Graphics.prototype, ItemsGraphicsModule);
extend(Graphics.prototype, PortalsModule);
extend(Graphics.prototype, CamerasModule);
extend(Graphics.prototype, RenderersModule);
extend(Graphics.prototype, ScenesModule);
extend(Graphics.prototype, FacesModule);
extend(Graphics.prototype, ChunksModule);
extend(Graphics.prototype, ChunksMeshModule);
extend(Graphics.prototype, ChunksVoxelModule);
extend(Graphics.prototype, ShadersModule);
extend(Graphics.prototype, SkyModule);
extend(Graphics.prototype, TextModule);

export { Graphics };
