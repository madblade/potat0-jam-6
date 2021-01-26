/*
 * Root of main-thread engine.
 */

import { Euler, Matrix4, Quaternion } from 'three';

let REVISION = 'Shotgun005+Mad';

// Global (to refactor someday).
let root = {

    Ar: null,
    ArLng: [],
    ArPos: [],
    ArMax: 0,
    key: [0, 0, 0, 0, 0, 0, 0, 0],

    constraintDebug: false,

    flow: {
        //matrix:{},
        //force:{},
        //option:{},
        ray: [],
        terrain: [],
        vehicle: [],
        key: [],
    },

    post: null, // send to worker
    extraGeo: [], // array of extra geometry to delete

    container: null, // THREE scene or group
    tmpMat: [], // tmp materials
    mat: {}, // materials object
    geo: {}, // geometrys object
    controler: null,

    torad: Math.PI / 180,

    isRefView: false,

    correctSize(s)
    {
        if (s.length === 1) s[1] = s[0];
        if (s.length === 2) s[2] = s[0];
        return s;
    },

    // rotation

    tmpQ: new Quaternion(),
    tmpE: new Euler(),
    tmpM: new Matrix4(),

    toQuatArray(rotation)
    {
        // rotation array in degree
        return root.tmpQ.setFromEuler(root.tmpE.fromArray(rotation)).toArray();
    },
};

// ROW map

let map = new Map();

export { REVISION, root, map };
