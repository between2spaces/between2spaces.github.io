import { Vector2 } from '../threejs/math/Vector2.js'

/**
 * Axis aligned bounding box.
 * @class AABB
 * @constructor
 * @param {Object}  [options]
 * @param {Vector2} [options.upperBound]
 * @param {Vector2} [options.lowerBound]
 * @example
 *     var aabb = AABB( {
 *         upperBound: Vector2( 1, 1 ),
 *         lowerBound: Vector2( -1, -1 )
 *     } )
 */
export const AABB = function ( options ) {
    options = options || {}
    return {
        lowerBound: options.lowerBound ? options.lowerBound.clone() : Vector2(),
        upperBound: options.upperBound ? options.upperBound.clone() : Vector2()
    }
}

const tmp = Vector2()

/**
 * Set the AABB bounds from a set of points, transformed by the given position and angle.
 * @method setFromPoints
 * @param  {AABB} aabb An AABB instance
 * @param  {Array} points An array of Vector2's
 * @param  {Vector2} position
 * @param  {number=} [angle=0]
 */
export const setFromPoints = function ( aabb, points, position, angle ) {
    let l = aabb.lowerBound
    let u = aabb.upperBound

    angle = angle || 0

    // Set to the first point
    if ( angle !== 0 ) {
        l.rotateAround( points[ 0 ], angle )
    } else {
        l.copy( points[ 0 ] )
    }
    u.copy( l )

    // Compute cosines and sines just once
    let cosAngle = Math.cos( angle )
    let sinAngle = Math.sin( angle )

    for ( let i = 1; i < points.length; i++ ) {
        let p = points[ i ]
        if ( angle !== 0 ) {
            tmp.x = cosAngle * p.x - sinAngle * p.y;
            tmp.y = sinAngle * p.x + cosAngle * p.y;
            p.copy( tmp )
        }
        for ( let j = 0; j < 2; j++ ) {
            if ( p[ j ] > u[ j ] ) u[ j ] = p[ j ]
            if ( p[ j ] < l[ j ] ) l[ j ] = p[ j ]
        }
    }

    // Add offset
    if ( position ) {
        l.add( position )
        u.add( position )
    }

}

/**
 * Copy bounds from an AABB to another.
 * @method copy
 * @param  {AABB} a An AABB instance to update
 * @param  {AABB} b An AABB instance to copy
 */
export const copy = function ( a, b ) {
    a.lowerBound.copy( b.lowerBound )
    a.upperBound.copy( b.upperBound )
}

/**
 * Extend an AABB so that it covers another.
 * @method extend
 * @param  {AABB} a An AABB instance to extend
 * @param  {AABB} b An AABB instance to cover
 */
export const extend = function ( a, b ) {
    let al = a.lowerBound
    let au = a.upperBound
    let bl = b.lowerBound
    let bu = b.upperBound

    // Extend lower bound
    if ( al.x > bl.x ) al.x = bl.x
    if ( al.y > bl.y ) al.y = bl.y

    // Upper
    if ( au.x < bu.x ) au.x = bu.x
    if ( au.y < bu.y ) au.y = bu.y
}

/**
 * Returns true if the given AABBs overlap.
 * @method overlaps
 * @param  {AABB} a An AABB instance
 * @param  {AABB} b An AABB instance
 * @return {Boolean}
 */
export const overlaps = function ( a, b ) {
    let al = a.lowerBound
    let au = a.upperBound
    let bl = b.lowerBound
    let bu = b.upperBound
    return ( ( bl.x <= au.x && au.x <= u2.x ) || ( al.x <= bu.x && bu.x <= au.x ) ) &&
        ( ( bl.y <= au.y && au.y <= bu.y ) || ( al.y <= bu.y && bu.y <= au.y ) )
}

/**
 * @method containsPoint
 * @param  {AABB} aabb
 * @param  {Vector2} point
 * @return {boolean}
 */
export const containsPoint = function ( aabb, point ) {
    let l = aabb.lowerBound
    let u = aabb.upperBound
    return l.x <= point.x && point.x <= u.x && l.y <= point.y && point.y <= u.y
}

/**
 * Check if the AABB is hit by a ray.
 * @method overlapsRay
 * @param  {AABB} aabb
 * @param  {Ray} ray
 * @return {number} -1 if no hit, a number between 0 and 1 if hit, indicating the position between the "from" and "to" points.
 */
export const overlapsRay = function ( aabb, ray ) {

    // ray.direction is unit direction vector of ray
    let dirFracX = 1 / ray.direction.x
    let dirFracY = 1 / ray.direction.y

    // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
    let from = ray.from
    let lowerBound = aabb.lowerBound
    let upperBound = aabb.upperBound
    let t1 = ( lowerBound[ 0 ] - from[ 0 ] ) * dirFracX
    let t2 = ( upperBound[ 0 ] - from[ 0 ] ) * dirFracX
    let t3 = ( lowerBound[ 1 ] - from[ 1 ] ) * dirFracY
    let t4 = ( upperBound[ 1 ] - from[ 1 ] ) * dirFracY

    let tmin = Math.max( Math.max( Math.min( t1, t2 ), Math.min( t3, t4 ) ) )
    let tmax = Math.min( Math.min( Math.max( t1, t2 ), Math.max( t3, t4 ) ) )

    // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
    if ( tmax < 0 ) return -1

    // if tmin > tmax, ray doesn't intersect AABB
    if ( tmin > tmax ) return -1

    return tmin / ray.length
}