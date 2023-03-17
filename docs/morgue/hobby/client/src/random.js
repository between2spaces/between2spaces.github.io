/**
 * Returns the same psuedo-random number given the same inputs.
 * @param {number} x
 * @param {number} y
 * @return {number} [-1.0, 1.0]
 */
const noise = ( x, y ) => {

    // Skew the input space to determine which simplex cell we're in
    let s = ( x + y ) * f2     // Hairy factor for 2D
    let i = ( x + s ) >> 0
    let j = ( y + s ) >> 0
    let t = ( i + j ) * g2
    let X0 = i - t           // Unskew the cell origin back to ( x,y ) space
    let Y0 = j - t
    let x0 = x - X0          // The x,y distances from the cell origin
    let y0 = y - Y0
    let gi, i1 = 0
    let j1 = 1

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    if ( x0 > y0 ) {
        i1 = 1
        j1 = 0
    }

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    // Offsets for middle corner in (x,y) unskewed coords
    let x1 = x0 - i1 + g2
    // Offsets for last corner in (x,y) unskewed coords
    let y1 = y0 - j1 + g2
    let x2 = x0 - 1.0 + 2.0 * g2
    // Hashed gradient indices of three simplex corners
    let y2 = y0 - 1.0 + 2.0 * g2
    let ii = i & 255
    let jj = j & 255
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0
    let t1 = 0.5 - x1 * x1 - y1 * y1
    let t2 = 0.5 - x2 * x2 - y2 * y2
    let n0 = 0.0
    let n1 = 0.0
    let n2 = 0.0

    if ( t0 >= 0 ) {
        gi = perm123[ ii + perm[ jj ] ]
        t0 *= t0
        // ( x,y ) of grad3 used for 2D gradient
        n0 = t0 * t0 * ( grad3[ gi ] * x0 + grad3[ gi + 1 ] * y0 )
    }

    if ( t1 >= 0 ) {
        gi = perm123[ ii + i1 + perm[ jj + j1 ] ]
        t1 *= t1
        n1 = t1 * t1 * ( grad3[ gi ] * x1 + grad3[ gi + 1 ] * y1 )
    }

    if ( t2 >= 0 ) {
        gi = perm123[ ii + 1 + perm[ jj + 1 ] ]
        t2 *= t2
        n2 = t2 * t2 * ( grad3[ gi ] * x2 + grad3[ gi + 1 ] * y2 )
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * ( n0 + n1 + n2 )

}



/**
 * Seeds simplex.noise.
 * @param {string} seed
 */
const seed = seed => {

    currentSeed = 0

    for ( let index = 0; index < seed.length; ++index ) {
        currentSeed = ( ( currentSeed << 5 ) - currentSeed ) + seed.charCodeAt( index )
        currentSeed |= 0
    }

    // Initialise the noise constants

    let C = 256

    while ( C-- ) {
        P[ C ] = ( ( ( currentSeed = Math.sin( currentSeed ) * 10000 ) - Math.floor( currentSeed ) ) * 256 ) | 0
    }

    // To remove the need for index wrapping, double the permutation table length
    C = 512

    while ( C-- ) {
        perm[ C ] = P[ C & 255 ]
        perm123[ C ] = ( perm[ C ] % 12 ) * 3
    }

}


/**
 * Returns a random string of characters in the range [a-Z0-9] of length n.
 * @param {number} n
 */
const randomString = n => {

    return Array( n ).join().split( "," ).map( () => { return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt( Math.floor( Math.random() * 62 ) ) } ).join( "" )

}



let currentSeed

const P = new Uint8Array( 256 )
const f2 = 0.5 * ( Math.sqrt( 3.0 ) - 1.0 )
const g2 = ( 3.0 - Math.sqrt( 3.0 ) ) / 6.0
const perm = new Uint8Array( 512 )
const perm123 = new Uint8Array( 512 )
const grad3 = new Float32Array( [
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
    1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
    0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
] )


seed( randomString( 16 ) )

export { noise, seed, randomString }