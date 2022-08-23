/**
 * An implementation of Alea algorithm; (C) 2010 Johannes Baagøe.
 */

const FRAC = 2.3283064365386963e-10 /* 2^-32 */

var s0
var s1
var s2
var c

/**
 * @param seed {number}
 */
function rngSeed( seed ) {
    seed = ( seed < 1 ? 1 / seed : seed )
    s0 = ( seed >>> 0 ) * FRAC
    seed = ( seed * 69069 + 1 ) >>> 0
    s1 = seed * FRAC
    seed = ( seed * 69069 + 1 ) >>> 0
    s2 = seed * FRAC
    c = 1
}

rngSeed( Date.now() )

/**
 * @returns {float} Pseudorandom value [0,1), uniformly distributed
 */
function rngUniform() {
    var t = 2091639 * s0 + c * FRAC
    s0 = s1
    s1 = s2
    c = t | 0
    s2 = t - c
    return s2
}

/**
 * @param {int} lowerBound The lower end of the range to return a value from, inclusive
 * @param {int} upperBound The upper end of the range to return a value from, inclusive
 * @returns {int} Pseudorandom value [lowerBound, upperBound], using getUniform() to distribute the value
 */
function rngUniformInt( lowerBound, upperBound ) {
    var max = Math.max( lowerBound, upperBound )
    var min = Math.min( lowerBound, upperBound )
    return Math.floor( rngUniform() * ( max - min + 1 ) ) + min
}

export { rngSeed, rngUniform, rngUniformInt }

