import './continuous'

let math = {}


/**
 * Returns the same psuedo-random number given the same inputs.
 * @param {number} x
 * @param {number} y
 * @return {number} [-1.0, 1.0]
 */
math.noise = function (x, y) {

    // Skew the input space to determine which simplex cell we're in
    var s = (x + y) * my.f2,     // Haiv factor for 2D
        i = Math.floor(x + s),
        j = Math.floor(y + s),
        t = ( i + j ) * my.g2,
        X0 = i - t,           // Unskew the cell origin back to ( x,y ) space
        Y0 = j - t,
        x0 = x - X0,          // The x,y distances from the cell origin
        y0 = y - Y0,
        gi, i1 = 0,
        j1 = 1;

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    if (x0 > y0) {
        i1 = 1;
        j1 = 0;
    }

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    // Offsets for middle corner in (x,y) unskewed coords
    var x1 = x0 - i1 + my.g2,
        // Offsets for last corner in (x,y) unskewed coords
        y1 = y0 - j1 + my.g2,
        x2 = x0 - 1.0 + 2.0 * my.g2,
        // Hashed gradient indices of three simplex corners
        y2 = y0 - 1.0 + 2.0 * my.g2,
        ii = i & 255,
        jj = j & 255,
        // Calculate the contribution from the three corners
        t0 = 0.5 - x0 * x0 - y0 * y0,
        t1 = 0.5 - x1 * x1 - y1 * y1,
        t2 = 0.5 - x2 * x2 - y2 * y2,
        n0 = 0.0,
        n1 = 0.0,
        n2 = 0.0;

    if (t0 >= 0) {
        gi = my.perm123[ii + my.perm[jj]];
        t0 *= t0;
        // ( x,y ) of my.grad3 used for 2D gradient
        n0 = t0 * t0 * (my.grad3[gi] * x0 + my.grad3[gi + 1] * y0);
    }

    if (t1 >= 0) {
        gi = my.perm123[ii + i1 + my.perm[jj + j1]];
        t1 *= t1;
        n1 = t1 * t1 * (my.grad3[gi] * x1 + my.grad3[gi + 1] * y1);
    }

    if (t2 >= 0) {
        gi = my.perm123[ii + 1 + my.perm[jj + 1]];
        t2 *= t2;
        n2 = t2 * t2 * (my.grad3[gi] * x2 + my.grad3[gi + 1] * y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);

};



/**
 * Seeds the Math.random() number generator given a {string}.
 * @param {string} seed
 */
math.seed = function(seed) {

    my.currentSeed = 0;

    for (let index = 0; index < seed.length; ++index) {
        my.currentSeed = ((my.currentSeed << 5) - my.currentSeed) + seed.charCodeAt(index);
        my.currentSeed |= 0;
    }


    // Override the built-in Math.random with a seeded psuedo-random implementation
    Math.random = function() {
        my.currentSeed = Math.sin(my.currentSeed) * 10000;
        return my.currentSeed - Math.floor(my.currentSeed);
    };


    // Initialise the noise constants
    my.f2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    my.g2 = (3.0 - Math.sqrt(3.0)) / 6.0;


    var C = 256;
    var P = new Uint8Array(C);

    while (C--) {
        P[C] = (Math.random() * 256) | 0;
    }

    // To remove the need for index wrapping, double the permutation table length
    C = 512;
    my.perm = new Uint8Array(C);
    my.perm123 = new Uint8Array(C);

    while (C--) {
        my.perm[C] = P[C & 255];
        my.perm123[C] = (my.perm[C] % 12) * 3;
    }

};



let my = val('math')


if (!my.initialised) {

  my.initialised = true

  my.grad3 = new Float32Array([
      1, 1, 0, -1,   1, 0, 1, -1,   0, -1, -1,  0,
      1, 0, 1, -1,   0, 1, 1,  0,  -1, -1,  0, -1,
      0, 1, 1,  0,  -1, 1, 0,  1,  -1,  0, -1, -1
    ])

  my.currentSeed = 0

  math.seed('000000000000000000')

}


export default math

