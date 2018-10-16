import * as display from './display.js'
import * as task from './task.js'

export const size = { x: 100, z: 100 }
export const centre = { x: Math.floor( size.x * 0.5 ), z: Math.floor( size.z * 0.5 ) }
const cells = []

for ( let z = 0; z < size.z; z++ ) {
    for ( let x = 0; x < size.x; x++ ) {
        cells[ z * size.x + x ] = { objects: [], x: x, z: z, blocked: false }
    }
}

export const cell = function ( x, z ) {
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


export const add = function ( object, x, y, z ) {
    display.scene.add( object.object )
    let pos = object.position
    cell( pos.x, pos.z ).objects.push( object )
    if ( object.task ) task.start( object.task )
    if ( typeof x !== 'undefined' ) {
        move( object, x, y, z, true )
    }
}

export const remove = function ( object ) {
    display.scene.remove( object )
    let pos = object.position
    let objects = cell( pos.x, pos.z ).objects
    let i = objects.indexOf( object )
    if ( i > -1 ) objects.splice( i, 1 )
    if ( object.task ) task.stop( object.task )
}

export const move = function ( object, x, y, z, instant ) {
    let position = object.position
    let old_cell = cell( position.x, position.z )
    position.x += x
    position.y += y
    position.z += z
    let new_cell = cell( position.x, position.z )
    if ( old_cell === new_cell ) return
    let objects = old_cell.objects
    let i = objects.indexOf( object )
    if ( i > -1 ) objects.splice( i, 1 )
    new_cell.objects.push( object )
    if ( instant || object.speed <= 0 || !display.inView( object.position ) ) {
        object.object.position.copy( object.position )
        return
    }
    let distance = object.object.position.clone().sub( object.position ).lengthSq()
    let duration = 1000 * ( 1 - object.speed ) * distance
    object.easing_movement = task.tween( object.object.position, object.position, duration )
}


export const raytrace = function ( from, to ) {
    let dx = Math.abs( to.x - from.x )
    let dz = Math.abs( to.z - from.z )
    let n = 1 + dx + dz
    let east = ( to.x > from.x ) ? true : false
    let south = ( to.z > from.z ) ? true : false
    let error = dx - dz
    let at = from
    let ray = []
    dx *= 2
    dz *= 2
    for ( ; n > 0; n-- ) {
        ray.push( at )
        if ( error > 0 ) {
            at = cell( at.x + ( east ? 1 : - 1 ), at.z )
            error -= dy
        } else {
            at = cell( at.x, at.z + ( south ? 1 : - 1 ) )
            error += dx
        }
        if ( !at ) break
    }
    return ray
}


function cleanDirtyPathInfo( clls ) {
    let i = dirtyCells.length
    while ( i-- ) {
        let dirtyCell = clls.dirtyCells[ i ]
        dirtyCell.score = dirtyCell.g = dirtyCell.h = 0
        dirtyCell.visited = dirtyCell.closed = dirtyCell.path = null
    }
}


function path( from, to ) {
    if ( to.closed ) {
        // destination is closed; adjust to nearest open cell on straight line
        let line = cells.raytrace( destination, ent.cell )
        for ( let cll in line ) {
            destination = line[ cll ]
            // continue path finding with destination set at current cell if no collision found
            if ( !cells.collides( ent, cells.collisionArea( ent, destination ) ) ) break
        }
    }


    if ( ent.collide && cells.collides( ent, cells.collisionArea( ent ) ) ) {
        console.log( 'error: ent is already colliding; need an unstick step here' )
        return []
    }

    // clean dirty nodes
    cells.cleanDirtyPathInfo( clls )

    let startCell = ent.cell
    let endCell = destination

    clls.dirtyCells = [ startCell ]

    startCell.g = 0
    startCell.score = 0

    let heap = binaryheap()
    binaryheap.push( heap, startCell )

    while ( binaryheap.size( heap ) ) {

        // pop the lowest scored cell off the heap
        let currentCell = binaryheap.pop( heap )

        // end condition -- result has been found, return the traced path
        if ( currentCell === endCell || binaryheap.size( heap ) > 100 ) {
            return tracePath( currentCell )
        }

        // move currentCell from open to closed, process each of its neighbours
        currentCell.closed = true

        let neighbours = [ currentCell.north, currentCell.east, currentCell.south, currentCell.west ]

        for ( let neighbour in neighbours ) {

            neighbour = neighbours[ neighbour ]

            if ( !neighbour || neighbour.closed ) continue

            // close and continue if a collision would occur
            if ( ent.collide && cells.collides( ent, cells.collisionArea( ent, neighbour ) ) ) {
                neighbour.closed = true
                clls.dirtyCells.push( neighbour )
                continue
            }

            let beenVisited = neighbour.visited
            let neighbourParent = currentCell

            // make neighbours parent the parent of currentCell if traveled in a straight line does not collide
            if ( currentCell.parent && cells.canStraightLineTravel( currentCell.parent, neighbour, ent ) ) {
                neighbourParent = currentCell.parent
            }

            gScore = neighbourParent.g + 1

            // check if neighbour has not been visited yet, or can be reached with a smaller cost from current
            if ( !neighbour.visited || gScore < neighbour.g ) {

                neighbour.parent = neighbourParent
                neighbour.h = neighbour.h || heuristic( neighbour, endCell )
                neighbour.g = gScore
                neighbour.score = neighbour.g + neighbour.h

                clls.dirtyCells.push( neighbour )

                if ( !beenVisited ) {
                    // pushing to heap will put it in proper place based on the 'f' value.
                    binaryheap.push( heap, neighbour )
                    neighbour.visited = true
                } else {
                    // already seen the node, but since it has been rescored we need to reorder it in the heap
                    binaryheap.rescore( heap, neighbour )
                }

            }

        }

    }

    return []

}


/**
 * Manhattan distance
 */
let heuristic = ( start, end ) => {

    let dx = Math.abs( start.position.x - end.position.x )
    let dy = Math.abs( start.position.y - end.position.y )

    return dx + dy

}


let tracePath = ( cll ) => {

    let curr = cll
    var path = []

    while ( curr.parent ) {
        curr.path = true
        path.push( curr )
        curr = curr.parent
    }

    return path.reverse()

}
