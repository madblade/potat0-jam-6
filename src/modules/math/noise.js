
'use strict';

// THREEJS implementation,
// Ported from Stefan Gustavson's java implementation
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
// Read Stefan's excellent paper for details on how this code works.
//
// Sean McCullough banksean@gmail.com

let SimplexNoise = function(r)
{
    if (r === undefined) r = Math;

    this.grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];

    this.grad4 = [[0, 1, 1, 1], [0, 1, 1, -1], [0, 1, -1, 1], [0, 1, -1, -1],
        [0, -1, 1, 1], [0, -1, 1, -1], [0, -1, -1, 1], [0, -1, -1, -1],
        [1, 0, 1, 1], [1, 0, 1, -1], [1, 0, -1, 1], [1, 0, -1, -1],
        [-1, 0, 1, 1], [-1, 0, 1, -1], [-1, 0, -1, 1], [-1, 0, -1, -1],
        [1, 1, 0, 1], [1, 1, 0, -1], [1, -1, 0, 1], [1, -1, 0, -1],
        [-1, 1, 0, 1], [-1, 1, 0, -1], [-1, -1, 0, 1], [-1, -1, 0, -1],
        [1, 1, 1, 0], [1, 1, -1, 0], [1, -1, 1, 0], [1, -1, -1, 0],
        [-1, 1, 1, 0], [-1, 1, -1, 0], [-1, -1, 1, 0], [-1, -1, -1, 0]];

    this.p = [];

    for (let i = 0; i < 256; i++) {
        this.p[i] = Math.floor(r.random() * 256);
    }

    // To remove the need for index wrapping, double the permutation table length
    this.perm = [];

    for (let i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
    }

    // A lookup table to traverse the simplex around a given point in 4D.
    // Details can be found where this table is used, in the 4D noise method.
    this.simplex = [
        [0, 1, 2, 3], [0, 1, 3, 2], [0, 0, 0, 0], [0, 2, 3, 1],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [1, 2, 3, 0],
        [0, 2, 1, 3], [0, 0, 0, 0], [0, 3, 1, 2], [0, 3, 2, 1],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [1, 3, 2, 0],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [1, 2, 0, 3], [0, 0, 0, 0], [1, 3, 0, 2], [0, 0, 0, 0],
        [0, 0, 0, 0], [0, 0, 0, 0], [2, 3, 0, 1], [2, 3, 1, 0],
        [1, 0, 2, 3], [1, 0, 3, 2], [0, 0, 0, 0], [0, 0, 0, 0],
        [0, 0, 0, 0], [2, 0, 3, 1], [0, 0, 0, 0], [2, 1, 3, 0],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [2, 0, 1, 3], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [3, 0, 1, 2], [3, 0, 2, 1], [0, 0, 0, 0], [3, 1, 2, 0],
        [2, 1, 0, 3], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [3, 1, 0, 2], [0, 0, 0, 0], [3, 2, 0, 1], [3, 2, 1, 0]
    ];

    this.F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    this.G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
};

SimplexNoise.prototype.dot = function(g, x, y)
{
    return g[0] * x + g[1] * y;
};

SimplexNoise.prototype.dot3 = function(g, x, y, z)
{
    return g[0] * x + g[1] * y + g[2] * z;
};

SimplexNoise.prototype.dot4 = function(g, x, y, z, w)
{
    return g[0] * x + g[1] * y + g[2] * z + g[3] * w;
};

SimplexNoise.prototype.noise = function(xin, yin)
{
    let n0; let n1; let n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    const F2 = this.F2;
    const s = (xin + yin) * F2; // Hairy factor for 2D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const G2 = this.G2;
    const t = (i + j) * G2;
    const X0 = i - t; // Unskew the cell origin back to (x,y) space
    const Y0 = j - t;
    let x0 = xin - X0; // The x,y distances from the cell origin
    let y0 = yin - Y0;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1; let j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0)
    {
        // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        i1 = 1; j1 = 0;
    }
    else
    {
        // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        i1 = 0; j1 = 1;
    }

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3 - sqrt(3)) / 6
    const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    const y2 = y0 - 1.0 + 2.0 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    let ii = i & 255;
    let jj = j & 255;

    const p = this.perm;
    const g3 = this.grad3;

    // let gi0 = p[ii + p[jj]] % 12;
    // let gi1 = p[ii + i1 + p[jj + j1]] % 12;
    // let gi2 = p[ii + 1 + p[jj + 1]] % 12;
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else
    {
        t0 *= t0;
        n0 = t0 * t0 * this.dot(g3[p[ii + p[jj]] % 12], x0, y0);
        // (x,y) of grad3 used for 2D gradient
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else
    {
        t1 *= t1;
        n1 = t1 * t1 * this.dot(g3[p[ii + i1 + p[jj + j1]] % 12], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else
    {
        t2 *= t2;
        n2 = t2 * t2 * this.dot(g3[p[ii + 1 + p[jj + 1]] % 12], x2, y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
};

SimplexNoise.prototype.noise3d = function(xin, yin, zin)
{
    let n0; let n1; let n2; let n3; // Noise contributions from the four corners
    // Skew the input space to determine which simplex cell we're in
    let F3 = 1.0 / 3.0;
    let s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let k = Math.floor(zin + s);
    let G3 = 1.0 / 6.0; // Very nice and simple unskew factor, too
    let t = (i + j + k) * G3;
    let X0 = i - t; // Unskew the cell origin back to (x,y,z) space
    let Y0 = j - t;
    let Z0 = k - t;
    let x0 = xin - X0; // The x,y,z distances from the cell origin
    let y0 = yin - Y0;
    let z0 = zin - Z0;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1; let j1; let k1; // Offsets for second corner of simplex in (i,j,k) coords
    let i2; let j2; let k2; // Offsets for third corner of simplex in (i,j,k) coords
    if (x0 >= y0) {
        if (y0 >= z0) {
            // X Y Z order
            i1 = 1; j1 = 0; k1 = 0;
            i2 = 1; j2 = 1; k2 = 0;
        } else if (x0 >= z0) {
            // X Z Y order
            i1 = 1; j1 = 0; k1 = 0;
            i2 = 1; j2 = 0; k2 = 1;
        } else {
            // Z X Y order
            i1 = 0; j1 = 0; k1 = 1;
            i2 = 1; j2 = 0; k2 = 1;
        }
    } else // x0<y0
    if (y0 < z0) {
        // Z Y X order
        i1 = 0; j1 = 0; k1 = 1;
        i2 = 0; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
        // Y Z X order
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 0; j2 = 1; k2 = 1;
    } else {
        // Y X Z order
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 1; j2 = 1; k2 = 0;
    }

    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    let x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
    let y1 = y0 - j1 + G3;
    let z1 = z0 - k1 + G3;
    let x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
    let y2 = y0 - j2 + 2.0 * G3;
    let z2 = z0 - k2 + 2.0 * G3;
    let x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
    let y3 = y0 - 1.0 + 3.0 * G3;
    let z3 = z0 - 1.0 + 3.0 * G3;
    // Work out the hashed gradient indices of the four simplex corners
    let ii = i & 255;
    let jj = j & 255;
    let kk = k & 255;
    let gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
    let gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
    let gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
    let gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
        t0 *= t0;
        n0 = t0 * t0 * this.dot3(this.grad3[gi0], x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
        t1 *= t1;
        n1 = t1 * t1 * this.dot3(this.grad3[gi1], x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
        t2 *= t2;
        n2 = t2 * t2 * this.dot3(this.grad3[gi2], x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
        t3 *= t3;
        n3 = t3 * t3 * this.dot3(this.grad3[gi3], x3, y3, z3);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay just inside [-1,1]
    return 32.0 * (n0 + n1 + n2 + n3);
};

let TileablePerlinNoise = function(r)
{
    this.r = r;
    if (!this.r) this.r = Math;

    this.p = [];
    for (let i = 0; i < 256; i++)
        this.p[i] = Math.floor(this.r.random() * 256);
    this.perm = [];
    for (let i = 0; i < 512; i++)
        this.perm[i] = this.p[i & 255];

    this.dirs = [];
    const pi2256 = 2.0 * Math.PI / 256;
    for (let i = 0; i < 256; i++)
        this.dirs[i] = [Math.cos(i * pi2256), Math.sin(i * pi2256)];
};

TileablePerlinNoise.prototype.surflet = function(x, y, gridX, gridY, per)
{
    const distX = Math.abs(x - gridX);
    const distY = Math.abs(y - gridY);
    const polyX = 1 - distX * distX * distX * (distX * (distX * 6 - 15) + 10);
    const polyY = 1 - distY * distY * distY * (distY * (distY * 6 - 15) + 10);
    const p = this.perm;
    const d = this.dirs;
    const hashed = p[(p[gridX % per] + gridY) % per];
    // if (!d[hashed]) debugger;
    const grad = (x - gridX) * d[hashed][0] + (y - gridY) * d[hashed][1];
    return polyX * polyY * grad;
};

TileablePerlinNoise.prototype.noise = function(x, y, per)
{
    const intX = x >> 0;
    const intY = y >> 0;
    let v = 0;
    v += this.surflet(x, y, intX, intY, per);
    v += this.surflet(x, y, intX + 1, intY, per);
    v += this.surflet(x, y, intX, intY + 1, per);
    v += this.surflet(x, y, intX + 1, intY + 1, per);
    return v;
};

TileablePerlinNoise.prototype.sumOctaves = function(x, y, nbOctaves, per)
{
    let v = 0;
    let q = 32;
    for (let i = 0; i < nbOctaves; ++i)
    {
        v += 1 / q * this.noise(x * q, y * q, per * q);
        q *= 2;
    }

    return v;
};

export { SimplexNoise, TileablePerlinNoise };
