import { EventDispatcher } from 'threejs'
import { Vector3 } from 'threejs'


export class Partition extends EventDispatcher {

    constructor( world, x, z ) {

        super()

        this.world = world
        this.position = new Vector3( x, 0, z )
        this.worldobjects = []
        this.visible = false

    }

    isVisible() {

        return this.visible

    }

    addWorldObject( worldobject ) {

        // Remove the WorldObject from it's current Partition if it's not already this
        if ( worldobject.partition !== this ) {

            if ( worldobject.partition ) {

                worldobject.partition.removeWorldObject( worldobject )

            }

            worldobject.setPartition( this )

        }

        let worldobjects = this.worldobjects

        worldobjects.push( worldobject )

        if ( worldobjects.length > 1 ) {

            let floorheight = worldobjects[ worldobjects.length - 2 ].boundingBox.max.y
            let footheight = worldobject.boundingBox.min.y

            if ( floorheight !== footheight ) {

                worldobject.position.y += floorheight - footheight
                worldobject.updateBoundingBox()

                worldobject.dispatchEvent( { type: 'elevationchange' } )

            }

            // if ( this.isVisible() && worldobject.createObject3D() ) {

            //     this.world.display.scene.add( worldobject.object3d )

            // }

        }

    }

    removeWorldObject( worldobject ) {

        let worldobjects = this.worldobjects
        let index = worldobjects.indexOf( worldobject )

        if ( index > -1 ) {

            worldobjects.splice( index, 1 )

        }

        worldobject.setPartition( null )

    }

    onVisible() {

        if ( this.isVisible() ) return

        this.visible = true

        let worldobjects = this.worldobjects
        let index = worldobjects.length

        while ( index-- ) {

            let worldobject = worldobjects[ index ]

            if ( worldobject.createObject3D( { debug: true } ) ) {

                this.world.display.scene.add( worldobject.object3d )

            }

        }

    }

    intersects( worldobject ) {

        let worldobjects = this.worldobjects
        let length = worldobjects.length
        let boundingBox = worldobject.boundingBox
        let maxy = boundingBox.max.y
        let miny = boundingBox.min.y

        // Find the lowest WorldObject that collides

        for ( let index = 0; index < length; index++ ) {

            let current = worldobjects[ index ]

            if ( current === worldobject ) continue

            let bb = current.boundingBox

            if ( bb.max.y >= miny && bb.min.y < maxy ) return current

        }

    }

}
