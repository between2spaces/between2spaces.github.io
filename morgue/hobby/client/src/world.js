import { Heap } from "client/Heap.js"
import * as display from "client/display"

let halfsize = 0
let size = 0

const setPlayerObject = object => {

    player = object

}

const add = object => {

    objects.push( object )
    move( object, 0, 0, 0 )

}

const remove = object => {

    if ( object.partition ) object.partition.remove( object )
    let index = objects.indexOf( object )
    if ( index > -1 ) objects.splice( index, 1 )
    display.scene.remove( object.mesh )

}

const move = ( object, dx, dy, dz ) => {

    let destinationPartition = partitionOfXZ( object.position.x + dx, object.position.x + dz )

    if ( !destinationPartition ) return // delta is outside world; don't move

    if ( object.partition ) object.partition.remove( object )
    destinationPartition.insert( object )

    object.position.x += dx
    object.position.y += dy
    object.position.z += dz
    object.mesh.position.copy( object.position )

}

const objects = []
const partitions = []

class Partition {

    constructor( x, z ) {

        this.objects = null
        this.x = x
        this.z = z
        partitions[ z * size + x ] = this
        scheduleNextUpdate( this )

    }

    insert( object ) {

        let current = this.objects
        let previous = null
        let ylevel = object.ylevel
        while ( current && current.ylevel <= ylevel ) {
            previous = current
            current = current.above
        }

        object.above = current
        object.below = previous

        if ( current ) current.below = object
        if ( previous ) previous.above = object
        if ( current === this.objects ) this.objects = object

        object.partition = this

        this.dirty = object.dirty = true

    }

    remove( object ) {

        this.dirty = true

        if ( object.above ) {
            object.above.dirty = true
        }

        if ( this.objects === object ) this.objects = object.above
        if ( object.above ) object.above.below = object.below
        if ( object.below ) object.below.above = object.above

        object.above = null
        object.below = null
        object.partition = null

    }

    blockAtYLevel( ylevel ) {
        let current = this.objects
        while ( current && current.ylevel <= ylevel ) {
            if ( current.ylevel === ylevel ) return current
            current = current.above
        }
        return null
    }

    distanceToPartitionSquared( partition ) {

        let dx = this.x - partition.x
        let dz = this.z - partition.z
        return dx * dx + dz * dz

    }

    update() {

        if ( this.dirty ) {

            this.dirty = false

            let object = this.objects
            while ( object ) {
                if ( object.dirty ) {
                    object.dirty = false
                    object.update()
                }
                object = object.above
            }

        }

        scheduleNextUpdate( this )

    }

}

const scheduleNextUpdate = ( partition ) => {
    let distanceSquared = player ? partition.distanceToPartitionSquared( player.partition ) : ( partition.x * partition.x + partition.z * partition.z ) + 1
    schedule( () => {
        partition.update()
    }, performance.now() + MINSCHEDULEINTERVAL + distanceSquared * SCHEDULEINTERVALBYDISTANCE )
}

const partitionOfXZ = ( x, z ) => {
    if ( x <= -halfsize || z <= -halfsize || x > halfsize || z > halfsize ) return null
    return partitions[ z * size + x ]
}

const partitionOfObject = object => {
    return partitionOfXZ( object.position.x, object.position.z )
}

const update = () => {

    interval = performance.now() - time
    time += interval

    let index = animationlist.length

    while ( index-- ) {

        animationlist[ index ]()

    }

    // catch any unexpectedly large frame rate spikes
    if ( interval > 1000 ) interval = MINSCHEDULEINTERVAL

    let head = logicheap.peek()
    while ( head && head.heapscore <= time ) {
        logicheap.pop()()
        head = logicheap.peek()
    }

}

let time = performance.now()
let interval = 0
let player = null
const MINSCHEDULEINTERVAL = 1000
const SCHEDULEINTERVALBYDISTANCE = 33
const logicheap = new Heap()
const animationlist = []

const schedule = ( callback, when ) => {

    logicheap.push( callback, ( when === undefined ) ? time + 1 : when )

}

const startAnimation = callback => {

    animationlist.push( callback )

}

const stopAnimation = callback => {

    let index = animationlist.indexOf( callback )

    if ( index > -1 ) {

        animationlist.splice( index, 1 )

    }

}

const setSize = ( r ) => {

    halfsize = r
    size = halfsize * 2
    partitions.length = 0

    for ( let z = -halfsize + 1; z < halfsize; z++ ) {
        for ( let x = -halfsize + 1; x < halfsize; x++ ) {
            new Partition( x, z )
        }
    }

    for ( let z = -halfsize + 1; z < halfsize; z++ ) {
        for ( let x = -halfsize + 1; x < halfsize; x++ ) {
            let partition = partitionOfXZ( x, z )
            partition.north = z > -halfsize + 1 ? partitionOfXZ( x, z + 1 ) : null
            partition.south = z < halfsize - 1 ? partitionOfXZ( x, z - 1 ) : null
            partition.west = x > -halfsize + 1 ? partitionOfXZ( x - 1, z ) : null
            partition.east = x < halfsize - 1 ? partitionOfXZ( x + 1, z ) : null
        }
    }

}

setSize( 1 )

export {
    setPlayerObject,
    setSize,
    objects,
    add,
    remove,
    move,
    halfsize,
    partitionOfXZ,
    partitionOfObject,
    update,
    time,
    MINSCHEDULEINTERVAL,
    SCHEDULEINTERVALBYDISTANCE,
    schedule,
    startAnimation,
    stopAnimation
}
