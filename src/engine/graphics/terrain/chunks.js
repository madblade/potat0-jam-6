/**
 * Heightmap chunks.
 */

'use strict';

import { VertexNormalsHelper }  from 'three/examples/jsm/helpers/VertexNormalsHelper';
import {
    ArrowHelper,
    Mesh,
    MeshBasicMaterial,
    PlaneBufferGeometry,
    SphereBufferGeometry,
    Vector3
}                               from 'three';

let ChunksModule = {

    createChunkFromLevel(chunk, worldId)
    {
        const nbSegmentsX = chunk.nbSegmentsX;
        const nbSegmentsY = chunk.nbSegmentsY;
        const widthX = chunk.widthX;
        const widthY = chunk.widthY;
        const px = chunk.x;
        const py = chunk.y;
        const points = chunk.points;
        let geometry = new PlaneBufferGeometry(widthX, widthY, nbSegmentsX, nbSegmentsY);
        let positions = geometry.attributes.position.array;

        let j = 0;
        const nbVerticesX = nbSegmentsX + 1;
        const nbVerticesY = nbSegmentsY + 1;
        for (let y = 0; y < nbVerticesY; ++y)
        {
            const offset = (nbVerticesY - y - 1) * nbVerticesX;
            for (let x = 0; x < nbVerticesX; ++x)
            {
                const i = offset + x;
                // (flipped y)
                positions[3 * i + 2] = points[j];
                j++;
            }
        }
        geometry.computeBoundingSphere();
        geometry.computeVertexNormals();

        const isWater = chunk.isWater;
        let newMesh = this.createChunkMesh(geometry, isWater, true, worldId);
        if (!isWater) newMesh.receiveShadow = true;
        newMesh.material = new MeshBasicMaterial({color: 0xff000000, wireframe: true}); // dbg
        // newMesh.add(new AxesHelper(5));
        let normH = new VertexNormalsHelper(newMesh, 0.5);
        newMesh.add(normH);
        const dh = {
            v: new Vector3(1, 0, 0),
            o: new Vector3(.1, 0.1, 0.1),
            h: null};
        dh.s = new Mesh(new SphereBufferGeometry(0.1), new MeshBasicMaterial({color:0xffff00}));
        dh.sg1 = new Mesh(new SphereBufferGeometry(0.1), new MeshBasicMaterial({color:0x0000ff}));
        dh.sg2 = new Mesh(new SphereBufferGeometry(0.1), new MeshBasicMaterial({color:0x0000ff}));
        dh.sg3 = new Mesh(new SphereBufferGeometry(0.1), new MeshBasicMaterial({color:0x0000ff}));
        dh.h = new ArrowHelper(dh.v, dh.o, 1, 0x00ffff);
        window.dh = dh;
        newMesh.add(dh.h);
        newMesh.add(dh.s);
        newMesh.add(dh.sg1);
        newMesh.add(dh.sg2);
        newMesh.add(dh.sg3);
        newMesh.userData.points = points;

        // newMesh.rotation.set(0, 0, -Math.PI / 2);
        newMesh.position.set(px, py, 0.0); // Water == 0! (watercamera.js -> scope)
        return newMesh;
    },

};

export { ChunksModule };
