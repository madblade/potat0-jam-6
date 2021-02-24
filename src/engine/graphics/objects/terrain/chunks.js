/**
 * Heightmap chunks.
 */

'use strict';

// import { VertexNormalsHelper }  from 'three/examples/jsm/helpers/VertexNormalsHelper';
import {
    ArrowHelper,
    AxesHelper, DoubleSide,
    Mesh,
    MeshBasicMaterial,
    PlaneBufferGeometry,
    SphereBufferGeometry,
    Vector3
} from 'three';

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
        newMesh.userData.hasPrimaryImage = true;

        // debug
        newMesh.material = new MeshBasicMaterial({
            color: 0xff000000, wireframe: true
        });
        newMesh.userData.points = points;
        this.attachDebugHelpers(newMesh);

        // newMesh.rotation.set(0, 0, -Math.PI / 2);
        newMesh.position.set(px, py, 0.0); // Water == 0! (watercamera.js -> scope)
        return newMesh;
    },

    attachDebugHelpers(newMesh)
    {
        // newMesh.add(new AxesHelper(5));
        // let normH = new VertexNormalsHelper(newMesh, 0.5);
        // newMesh.add(normH);
        const dh = {
            v: new Vector3(1, 0, 0),
            o: new Vector3(.1, 0.1, 0.1),
            h: null};
        dh.s = new Mesh(new SphereBufferGeometry(0.1),
            new MeshBasicMaterial({color:0xffff00}));
        dh.sg1 = new Mesh(new SphereBufferGeometry(0.1),
            new MeshBasicMaterial({color:0x0000ff}));
        dh.sg2 = new Mesh(new SphereBufferGeometry(0.1),
            new MeshBasicMaterial({
                color:0x00ff00, side: DoubleSide,
                wireframe: true
            }));
        dh.sg3 = new Mesh(new SphereBufferGeometry(0.1),
            new MeshBasicMaterial({color:0xff0000}));
        dh.h = new ArrowHelper(dh.v, dh.o, 1, 0x00ffff);
        dh.h2 = new ArrowHelper(dh.v, dh.o, 1, 0xffff00);
        dh.ah = new AxesHelper(5);
        window.dh = dh;
        // newMesh.add(dh.ah);
        newMesh.add(dh.h);
        newMesh.add(dh.h2);
        dh.h.traverse(o => {if (o.isMesh) o.userData.hasPrimaryImage = true; });
        dh.h2.traverse(o => {if (o.isMesh) o.userData.hasPrimaryImage = true; });
        // newMesh.add(dh.s);
        // newMesh.add(dh.sg1);
        // dh.sg1.userData.hasPrimaryImage = true;
        // newMesh.add(dh.sg2);
        // dh.sg2.userData.hasPrimaryImage = true;
        // newMesh.add(dh.sg3);
        // dh.sg3.userData.hasPrimaryImage = true;
    },

};

export { ChunksModule };
