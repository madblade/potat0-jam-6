/*
 * Root of engine worker.
 */

let root = {

    Ar: null,
    ArPos: null,

    constraintDebug: false,

    matrix: [],
    force: [],
    option: [],

    flow: {
        //matrix:{},
        //force:{},
        //option:{},
        ray: [],
        terrain: [],
        vehicle: [],

    },

    world: null,
    gravity: null,
    scale: 1,
    invscale: 1,
    angle: 0,
    //margin: 0.04,

    key: [0, 0, 0, 0, 0, 0, 0, 0],

    post: null,

    makeShape: null,

};

// ROW map

let map = new Map();

export { root, map };
