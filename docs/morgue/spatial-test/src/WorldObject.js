import { Vector3 } from 'threejs'
import { Object3D } from 'threejs'
import { EventDispatcher } from 'threejs'
import { Matrix4 } from 'threejs'
import { Box3 } from 'threejs'
import * as global from './global'
import { Glyph } from './Glyph'
import * as events from './events'


export class WorldObject extends EventDispatcher {

    constructor( options ) {

        super()

        options = options || {}

        this.position = ( !options[ 'position' ] ? OriginVec3 : options[ 'position' ] ).clone()
        this.halfwidth = ( !options[ 'width' ] ? 1 : options[ 'width' ] ) * 0.5
        this.halfheight = ( !options[ 'height' ] ? 0.01 : options[ 'height' ] ) * 0.5
        this.halfdepth = ( !options[ 'depth' ] ? 1 : options[ 'depth' ] ) * 0.5
        this.canstepup = !options[ 'canstepup' ] ? this.halfheight * 0.6 : options[ 'canstepup' ]
        this.chars = !options[ 'chars' ] ? '' : options[ 'chars' ]
        this.speed = !options[ 'speed' ] ? 2 : options[ 'speed' ]

        this.boundingBox = new Box3()
        this.updateBoundingBox()
        this.actions = []

        let _this = this

        this.addEventListener( 'mouseover', function ( event ) {

            // console.log( _this.name() + ' (' + _this.position.x + ', ' + _this.position.y + ', ' + _this.position.z + ') [' + _this.boundingBox.min.y + ',' + _this.boundingBox.max.y + ']' )
            console.log( _this.name() + ' (' + _this.boundingBox.max.y + ',' + _this.object3d.renderOrder + ')' )

        } )

        global.world.addWorldObject( this )

    }

    name() {

        return Glyph.name( this.chars )

    }

    tick( time ) {

        let array = this.actions
        let index = array.length

        while ( index-- ) {

            let action = array[ index ]
            action.callback( this, action )

        }

        this.dispatchEvent( { type: events.UPDATED } )

    }

    animate( time ) {

        this.glyph.animate( time )

    }

    addAction( action ) {

        this.actions.push( action )

    }

    removeAction( action ) {

        let index = this.actions.indexOf( action )
        if ( index > -1 ) this.actions.splice( index, 1 )

    }

    move( dx, dz ) {

        this.dispatchEvent( { type: events.MOVING } )

        // let boundingBox = this.boundingBox.clone()
        let position = this.position

        // boundingBox.min.set( position.x - this.halfwidth, position.y - this.halfheight, position.z - this.halfdepth )
        // boundingBox.max.set( position.x + this.halfwidth, position.y + this.halfheight, position.z + this.halfdepth )

        position.x += dx
        position.z += dz

        this.updateBoundingBox()

        // if ( this.chars === '@' ) {

        //     let partition = global.world.getPartitionAt( position.x, position.z )
        //     let collision = partition.getWorldObjectCollision( this )

        //     if ( collision ) {

        //         console.log( collision.boundingBox.max.y, boundingBox.min.y, this.canstepup )

        //     }

        // }

        let intersect = this.partition.intersects( this )

        if ( intersect ) {

            console.log( 'here' )

            //     this.dispatchEvent( AfterMoveEvent )
            //     worldobject.dispatchEvent( { type: 'hit', worldobject1: this, worldobject2: intersect } )
            //     return

        }

        global.world.repartitionWorldObject( this )

        // if ( this.chars === '@' ) {

        //     console.log( this.partition.worldobjects )

        // }

        this.dispatchEvent( { type: events.MOVED } )

        return this

    }

    rotate( axis, radians ) {

        this.dispatchEvent( { type: events.ROTATING } )

        TmpMatrix4.makeRotationAxis( axis, radians )
        TmpMatrix4.multiply( this.object3d.matrix )
        this.object3d.matrix.copy( TmpMatrix4 )
        this.object3d.rotation.setFromRotationMatrix( TmpMatrix4 )

        this.updateBoundingBox()

        this.dispatchEvent( { type: events.ROTATED } )

    }

    updateBoundingBox() {

        let position = this.position
        let boundingBox = this.boundingBox
        boundingBox.min.set( position.x - this.halfwidth, position.y - this.halfheight, position.z - this.halfdepth )
        boundingBox.max.set( position.x + this.halfwidth, position.y + this.halfheight, position.z + this.halfdepth )

    }

    height() {

        if ( this.boundingBox.max.y === -Infinity ) return 0
        return this.boundingBox.max.y - this.boundingBox.min.y

    }

    width() {

        if ( this.boundingBox.max.x === -Infinity ) return 0
        return this.boundingBox.max.x - this.boundingBox.min.x

    }

    depth() {

        if ( this.boundingBox.max.z === -Infinity ) return 0
        return this.boundingBox.max.z - this.boundingBox.min.z

    }

    setPartition( partition ) {

        this.partition = partition

    }

    createObject3D( options ) {

        options = options || {}

        if ( this.object3d || !this.partition || ( !options[ 'force' ] && !this.partition.isVisible ) ) return false

        this.glyph = new Glyph( this.chars, { scale: { x: this.halfwidth * 2, y: this.halfheight * 2, z: this.halfdepth * 2 } } )

        this.object3d = new Object3D()
        this.object3d.position.copy( this.position )

        let meshes = this.glyph.meshes
        let index = meshes.length

        while ( index-- ) {

            meshes[ index ].worldobject = this
            this.object3d.add( meshes[ index ] )

        }

        this.updateBoundingBox()

        this.dispatchEvent( { type: events.OBJECT3D_CREATED, object3d: this.object3d } )

        return true

    }

    isVisible() {

        if ( this.partition && this.partition.isVisible ) return true

        return false

    }

    intersects( worldobject ) {

        return this.boundingBox.intersectsBox( worldobject.boundingBox )

    }

}


const OriginVec3 = new Vector3()
const TmpMatrix4 = new Matrix4()
