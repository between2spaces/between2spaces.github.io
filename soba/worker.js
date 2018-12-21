onmessage = function ( e ) {
    console.log( "Message received from main script" )
}

class Vec2 {
    constructor( x, y ) {
        this.x = x || 0
        this.y = y || 0
    }

    get width() {
        return this.x
    }

    set width( value ) {
        this.x = value
    }

    get height() {
        return this.y
    }

    set height( value ) {
        this.y = value
    }

    set( x, y ) {
        this.x = x
        this.y = y
        return this
    }

    clone() {
        return new this.constructor( this.x, this.y )
    }

    copy( v ) {
        this.x = v.x
        this.y = v.y
        return this
    }

    add( v, w ) {
        this.x += v.x
        this.y += v.y
        return this
    }

    addScalar( s ) {
        this.x += s
        this.y += s
        return this
    }

    addVectors( a, b ) {
        this.x = a.x + b.x
        this.y = a.y + b.y
        return this
    }

    addScaledVector( v, s ) {
        this.x += v.x * s
        this.y += v.y * s
        return this
    }

    sub( v, w ) {
        this.x -= v.x
        this.y -= v.y
        return this
    }

    subScalar( s ) {
        this.x -= s
        this.y -= s
        return this
    }

    subVectors( a, b ) {
        this.x = a.x - b.x
        this.y = a.y - b.y
        return this
    }

    multiply( v ) {
        this.x *= v.x
        this.y *= v.y
        return this
    }

    multiplyScalar( scalar ) {
        this.x *= scalar
        this.y *= scalar
        return this
    }

    divide( v ) {
        this.x /= v.x
        this.y /= v.y
        return this
    }

    divideScalar( scalar ) {
        return this.multiplyScalar( 1 / scalar )
    }

    min( v ) {
        this.x = Math.min( this.x, v.x )
        this.y = Math.min( this.y, v.y )
        return this
    }

    max( v ) {
        this.x = Math.max( this.x, v.x )
        this.y = Math.max( this.y, v.y )
        return this
    }

    clamp( min, max ) {
        this.x = Math.max( min.x, Math.min( max.x, this.x ) )
        this.y = Math.max( min.y, Math.min( max.y, this.y ) )
        return this
    }

    clampScalar( minVal, maxVal ) {
        this.x = Math.max( minVal, Math.min( maxVal, this.x ) )
        this.y = Math.max( minVal, Math.min( maxVal, this.y ) )
        return this
    }

    clampLength( min, max ) {
        var length = this.length()
        return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) )
    }

    floor() {
        this.x = Math.floor( this.x )
        this.y = Math.floor( this.y )
        return this
    }

    ceil() {
        this.x = Math.ceil( this.x )
        this.y = Math.ceil( this.y )
        return this
    }

    round() {
        this.x = Math.round( this.x )
        this.y = Math.round( this.y )
        return this
    }

    negate() {
        this.x = - this.x
        this.y = - this.y
        return this
    }

    dot( v ) {
        return this.x * v.x + this.y * v.y
    }

    cross( v ) {
        return this.x * v.y - this.y * v.x
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y
    }

    length() {
        return Math.sqrt( this.x * this.x + this.y * this.y )
    }

    manhattanLength() {
        return Math.abs( this.x ) + Math.abs( this.y )
    }

    normalise() {
        return this.divideScalar( this.length() || 1 )
    }

    angle() {
        // computes the angle in radians with respect to the positive x-axis
        var angle = Math.atan2( this.y, this.x )
        if ( angle < 0 ) angle += 2 * Math.PI
        return angle
    }

    distanceTo( v ) {
        return Math.sqrt( this.distanceToSquared( v ) )
    }

    distanceToSquared( v ) {
        var dx = this.x - v.x, dy = this.y - v.y
        return dx * dx + dy * dy
    }

    manhattanDistanceTo( v ) {
        return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y )
    }

    setLength( length ) {
        return this.normalise().multiplyScalar( length )
    }

    lerp( v, alpha ) {
        this.x += ( v.x - this.x ) * alpha
        this.y += ( v.y - this.y ) * alpha
        return this
    }

    lerpVectors( v1, v2, alpha ) {
        return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 )
    }

    equals( v ) {
        return ( ( v.x === this.x ) && ( v.y === this.y ) )
    }

    rotateAround( center, angle ) {
        var c = Math.cos( angle ), s = Math.sin( angle )
        var x = this.x - center.x
        var y = this.y - center.y
        this.x = x * c - y * s + center.x
        this.y = x * s + y * c + center.y
        return this
    }

}

const entities = []
let nextEntityId = 1

class Entity {
    constructor( type ) {
        this.id = nextEntityId++
        this.type = type
        this.pos = new Vec2()
        this.partition = null
        entities.push( this )
        postMessage( { op: "new", id: this.id, type: type } )
    }
}

class Player extends Entity {
    constructor() {
        super( "player" )
    }
}

function logic() {
    for ( let i = 0; i < entities.length; i++ ) {
        let entity = entities[ i ]
        entity.pos.addScalar( 0.01 )
        postMessage( { op: "pos", id: entity.id, x: entity.pos.x, y: entity.pos.y } )
    }
    requestAnimationFrame( logic )
}

logic()

let player = new Player()