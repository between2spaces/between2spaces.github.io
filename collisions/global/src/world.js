import * as display from './display.js'
import * as materials from './materials.js'
import * as object from './object.js'
import { Cell } from './objects/cell.js'
import { Vector3 } from './threejs/math/Vector3.js'
import { Object3D } from './threejs/core/Object3D.js'
import { Mesh } from './threejs/objects/Mesh.js'
import { BoxGeometry } from './threejs/geometries/BoxGeometry.js'
import { GridHelper } from './threejs/helpers/GridHelper.js'

const tasks = []


export function start( task ) {
    tasks.push( task )
}


export function stop( task ) {
    let i = tasks.indexOf( task )
    if ( i > -1 ) tasks.splice( i, 1 )
}


export let time = 0


function update( update_time ) {
    requestAnimationFrame( update )
    time = update_time
    let i = tasks.length
    while ( i-- ) {
        let task = tasks[ i ]
        task.update( task )
    }
    display.update()
}

update( time )


export const size = { x: 100, z: 100 }
export const centre = { x: Math.floor( size.x * 0.5 ), z: Math.floor( size.z * 0.5 ) }

const cells = []

for ( let z = 0; z < size.z; z++ ) {
    for ( let x = 0; x < size.x; x++ ) {
        let cell = Cell()
        object.position( cell ).set( x - centre.x, 0, z - centre.z )
        cells[ z * size.x + x ] = cell
    }
}

export function cell( x, z ) {
    x += centre.x
    z += centre.z
    if ( x < 0 || x >= size.x || z < 0 || z >= size.z ) return null
    return cells[ Math.floor( z ) * size.x + Math.floor( x ) ]
}


export const cellsWithin = function ( x, z, radius ) {
    if ( radius < 0.7 ) {
        let c = cell( x, z )
        return c ? [ c ] : []
    }
    let rr = radius * radius
    let result = []
    for ( let t = z - radius; t <= z; t++ ) {
        for ( let i = x - radius; i <= x; i++ ) {
            let ii = i - x
            let tt = t - z
            if ( ii * ii + tt * tt <= rr ) {
                // (i, t), (i, tSym), (iSym, t), (iSym, tSym) are in the circle
                let c = cell( i, t ); c && result.push( c )
                if ( i === x && t === z ) continue
                let iSym = x - ( i - x )
                let tSym = z - ( t - z )
                if ( i !== x ) { c = cell( iSym, t ); c && result.push( c ) }
                if ( t !== z ) { c = cell( i, tSym ); c && result.push( c ) }
                if ( i !== x && t !== z ) { c = cell( iSym, tSym ); c && result.push( c ) }
            }
        }
    }
    return result
}


export const add = function ( object ) {

    display.scene.add( object.object )

    // let pos = object.object.position
    // cell( pos.x, pos.z ).objects.push( object )

    if ( object.update ) start( object )

}

export const remove = function ( object ) {

    display.scene.remove( object )

    // let pos = object.object.position
    // let objects = cell( pos.x, pos.z ).objects
    // let i = objects.indexOf( object )
    // if ( i > -1 ) objects.splice( i, 1 )

    stop( object )

}

export const cursor = object.Object()

cursor.speed = 0.01
object.addMesh( cursor, new Mesh( new BoxGeometry( 1, 1, 1 ), materials.CURSOR ) )
object.addMesh( cursor, new GridHelper( 100, 100 ) ).position.set( 0, -0.49, 0 )
object.position( cursor ).y = 0.5
add( cursor )

display.moveCamera( object.position( cursor ).clone().add( new Vector3( 0, 15, 2 ) ), object.position( cursor ) )

const dCamera = new Vector3()

const onKeyDown = function ( event ) {

    dCamera.set( 0, 0, 0 )

    let key = event.key
    if ( key === 'h' ) object.move( cursor, ( dCamera.x = -1 ), 0, 0 )
    else if ( key === 'j' ) object.move( cursor, 0, 0, ( dCamera.z = 1 ) )
    else if ( key === 'k' ) object.move( cursor, 0, 0, ( dCamera.z = -1 ) )
    else if ( key === 'l' ) object.move( cursor, ( dCamera.x = 1 ), 0, 0 )
    else if ( key === 'p' ) dCamera.y = -1
    else if ( key === ';' ) dCamera.y = 1

    if ( dCamera.x !== 0 || dCamera.y !== 0 || dCamera.z !== 0 ) {
        display.camera.position.add( dCamera )
        display.moveCamera( display.camera.position, object.position( cursor ) )
    }

}

document.addEventListener( 'keydown', onKeyDown, false )

