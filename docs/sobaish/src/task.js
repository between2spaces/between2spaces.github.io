import * as display from './display.js'

let current = 0
let elapsed = 0

const tasks = []

function update( time ) {
    requestAnimationFrame( update )
    elapsed = time - current
    current = time
    let i = tasks.length
    while ( i-- ) tasks[ i ]()
    display.update()
}

update()

function start( task ) {
    tasks.push( task )
}

function stop( task ) {
    let i = tasks.indexOf( task )
    if ( i > -1 ) tasks.splice( i, 1 )
}

const EASING = {
    linear: {
        none: function ( k ) { return k }
    },
    quadratic: {
        in: function ( k ) { return k * k },
        out: function ( k ) { return k * ( 2 - k ) },
        inout: function ( k ) { return ( k *= 2 ) < 1 ? 0.5 * k * k : - 0.5 * ( --k * ( k - 2 ) - 1 ) }
    },
    cubic: {
        in: function ( k ) { return k * k * k },
        out: function ( k ) { return --k * k * k + 1 },
        inout: function ( k ) { return ( k *= 2 ) < 1 ? 0.5 * k * k * k : 0.5 * ( ( k -= 2 ) * k * k + 2 ) }
    },
    quartic: {
        in: function ( k ) { return k * k * k * k },
        out: function ( k ) { return 1 - ( --k * k * k * k ) },
        inout: function ( k ) { return ( k *= 2 ) < 1 ? 0.5 * k * k * k * k : - 0.5 * ( ( k -= 2 ) * k * k * k - 2 ) }
    },
    quintic: {
        in: function ( k ) { return k * k * k * k * k },
        out: function ( k ) { return --k * k * k * k * k + 1 },
        inout: function ( k ) { return ( k *= 2 ) < 1 ? 0.5 * k * k * k * k * k : 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 ) }
    },
    sinusoidal: {
        in: function ( k ) { return 1 - Math.cos( k * Math.PI / 2 ) },
        out: function ( k ) { return Math.sin( k * Math.PI / 2 ) },
        inout: function ( k ) { return 0.5 * ( 1 - Math.cos( Math.PI * k ) ) }
    },
    exponential: {
        in: function ( k ) { return k === 0 ? 0 : Math.pow( 1024, k - 1 ) },
        out: function ( k ) { return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k ) },
        inout: function ( k ) {
            if ( k === 0 ) return 0
            if ( k === 1 ) return 1
            return ( k *= 2 ) < 1 ? 0.5 * Math.pow( 1024, k - 1 ) : 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 )
        }
    }
}

function tween( point, to, duration, easing ) {
    ( function ( start_time, point, to, duration, easing ) {
        let from = { x: point.x, y: point.y, z: point.z }
        to = { x: to.x, y: to.y, z: to.z }
        function tween() {
            if ( current < start_time ) return true
            let distance = ( current - start_time ) / duration
            distance = distance > 1 ? 1 : distance
            if ( distance === 1 ) {
                point.x = to.x
                point.y = to.y
                point.z = to.z
                stop( tween )
                return
            }
            let value = easing( distance )
            point.x = from.x + ( to.x - from.x ) * value
            point.y = from.y + ( to.y - from.y ) * value
            point.z = from.z + ( to.z - from.z ) * value
        }
        start( tween )
    } )( current, point, to, duration, easing || EASING.cubic.inout )
}

export { current, elapsed, start, stop, easing, tween }