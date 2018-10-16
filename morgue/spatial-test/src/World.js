import { EventDispatcher } from 'threejs'
import { Vector3 } from 'threejs'
import { Mesh } from 'threejs'
import { BoxGeometry } from 'threejs'
import { Object3D } from 'threejs'
import { Vector2 } from 'threejs'
import * as global from 'src/global'
import { Partition } from 'src/Partition'
import * as events from 'src/events'


export class World extends EventDispatcher {

    constructor( display ) {

        super()

        this.display = display

        this.worldobjects = []
        this.time = 0


        this.partitions = {}

        this.last_lowest_z = null
        this.last_highest_z = null
        this.last_lowest_x = null
        this.last_highest_x = null

        let _this = this

        this.display.camera.addEventListener( 'change', function () { addVisiblePartitionsToScene( _this ) } )

    }

    addWorldObject( worldobject ) {

        this.worldobjects.push( worldobject )

        this.getPartitionAt( worldobject.position.x, worldobject.position.z ).addWorldObject( worldobject )

        worldobject.dispatchEvent( { type: events.ADDED, object: this } )
        this.dispatchEvent( { type: events.ADDED, object: worldobject } )

    }

    removeWorldObject( worldobject ) {

        let index = this.worldobjects.indexOf( worldobject )

        if ( index > -1 ) {

            this.worldobjects.splice( index, 1 )

        }

        if ( worldobject.partition ) {

            worldobject.partition.removeWorldObject( worldobject )

        }

        if ( worldobject.object3d ) {

            this.display.scene.remove( worldobject.object3d )

        }

        worldobject.dispatchEvent( { type: events.REMOVED } )

    }

    getPartitionAt( x, z ) {

        let int_x = Math.floor( x )
        let int_z = Math.floor( z )

        let partitionKey = int_x + ',' + int_z

        if ( !this.partitions.hasOwnProperty( partitionKey ) ) {

            this.partitions[ partitionKey ] = new Partition( this, int_x, int_z )
            let _this = this
            let dispatchEvent = function () {

                global.stopAnimation( dispatchEvent )
                _this.dispatchEvent( { type: events.CREATED, object: _this.partitions[ partitionKey ] } )

            }
            global.startAnimation( dispatchEvent )

        }

        return this.partitions[ partitionKey ]

    }

}



const VIEW_TOPLEFT = new Vector2( -1, 1 )
const VIEW_TOPRIGHT = new Vector2( 1, 1 )
const VIEW_BOTTOMLEFT = new Vector2( -1, -1 )
const VIEW_BOTTOMRIGHT = new Vector2( 1, -1 )


const intersect_topleft = new Vector3()
const intersect_topright = new Vector3()
const intersect_bottomleft = new Vector3()
const intersect_bottomright = new Vector3()

let visible_partitions = []

function addVisiblePartitionsToScene( world ) {

    // find view corner intersections with ground plane
    let camera = world.display.camera

    global.raycaster.setFromCamera( VIEW_TOPLEFT, camera )
    global.raycaster.ray.intersectPlane( global.plane_XZ, intersect_topleft )
    global.raycaster.setFromCamera( VIEW_TOPRIGHT, camera )
    global.raycaster.ray.intersectPlane( global.plane_XZ, intersect_topright )
    global.raycaster.setFromCamera( VIEW_BOTTOMLEFT, camera )
    global.raycaster.ray.intersectPlane( global.plane_XZ, intersect_bottomleft )
    global.raycaster.setFromCamera( VIEW_BOTTOMRIGHT, camera )
    global.raycaster.ray.intersectPlane( global.plane_XZ, intersect_bottomright )

    intersect_topleft.x = Math.round( intersect_topleft.x )
    intersect_topleft.z = Math.round( intersect_topleft.z )
    intersect_bottomleft.x = Math.round( intersect_bottomleft.x )
    intersect_bottomleft.z = Math.round( intersect_bottomleft.z )
    intersect_topright.x = Math.round( intersect_topright.x )
    intersect_topright.z = Math.round( intersect_topright.z )
    intersect_bottomright.x = Math.round( intersect_bottomright.x )
    intersect_bottomright.z = Math.round( intersect_bottomright.z )

    // calculate AABB of viewable area
    let lowest_x = ( intersect_topleft.x < intersect_bottomleft.x ) ? intersect_topleft.x : intersect_bottomleft.x
    if ( intersect_topright.x < lowest_x ) lowest_x = intersect_topright.x
    if ( intersect_bottomright.x < lowest_x ) lowest_x = intersect_bottomright.x

    let lowest_z = ( intersect_topleft.z < intersect_bottomleft.z ) ? intersect_topleft.z : intersect_bottomleft.z
    if ( intersect_topright.z < lowest_z ) lowest_z = intersect_topright.z
    if ( intersect_bottomright.z < lowest_z ) lowest_z = intersect_bottomright.z

    let highest_x = ( intersect_topleft.x > intersect_bottomleft.x ) ? intersect_topleft.x : intersect_bottomleft.x
    if ( intersect_topright.x > highest_x ) highest_x = intersect_topright.x
    if ( intersect_bottomright.x > highest_x ) highest_x = intersect_bottomright.x

    let highest_z = ( intersect_topleft.z > intersect_bottomleft.z ) ? intersect_topleft.z : intersect_bottomleft.z
    if ( intersect_topright.z > highest_z ) highest_z = intersect_topright.z
    if ( intersect_bottomright.z > highest_z ) highest_z = intersect_bottomright.z

    lowest_x--
    highest_x++
    lowest_z--
    highest_z++

    if ( lowest_z === world.last_lowest_z && lowest_x === world.last_lowest_x && highest_z === world.last_highest_z && highest_x === world.last_highest_x ) {

        return

    }

    world.last_lowest_z = lowest_z
    world.last_highest_z = highest_z
    world.last_lowest_x = lowest_x
    world.last_highest_x = highest_x

    let i = visible_partitions.length;

    while ( i-- ) {

        visible_partitions[ i ].wasVisible = true

    }

    let visibles = []

    for ( let z = lowest_z; z <= highest_z; z++ ) {

        for ( let x = lowest_x; x <= highest_x; x++ ) {

            let partition = world.getPartitionAt( x, z )

            if ( !partition.isVisible() ) {

                partition.wasVisible = false
                visibles.push( partition )

            }

        }

    }

    i = visible_partitions.length;

    while ( i-- ) {

        let partition = visible_partitions[ i ]

        if ( partition.wasVisible ) {

            partition.visible = false
            delete partition[ 'wasVisible' ]

            console.log( 'no longer visible' )

        }

    }

    visible_partitions = visibles

    if ( visibles.length > 0 ) {

        global.schedule( function () {

            let i = visibles.length

            while ( i-- ) {

                visibles[ i ].onVisible()

            }

        }, 0 )

    }

}
