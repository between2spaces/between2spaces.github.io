import { Block, createBlock } from "client/blocks/Block"
import * as world from "client/world"


class Liquid extends Block {

    constructor( params ) {

        super( Object.assign( params || {}, { matter: "liquid" } ) )

    }

    update() {

        super.update()

        let ylevel = this.ylevel

        if ( this.below && this.below.ylevel === ylevel ) {
            return world.move( this, 0, 1, 0 )
        }

        if ( this.below && this.below.ylevel < ylevel - 1 ) {
            return world.move( this, 0, -1, 0 )
        }

        if ( this.height <= 0.1 ) return

        let n = this.partition.north.blockAtYLevel( ylevel )
        let e = this.partition.east.blockAtYLevel( ylevel )
        let s = this.partition.south.blockAtYLevel( ylevel )
        let w = this.partition.west.blockAtYLevel( ylevel )

        let division = 1 + ( n ? 0 : 1 ) + ( e ? 0 : 1 ) + ( s ? 0 : 1 ) + ( w ? 0 : 1 )

        if ( division > 1 ) {
            this.updateMesh( this.char, 1, this.height / division, 1 )
            if ( !n ) createBlock( this.type, { x: this.partition.north.x, y: this.position.y, z: this.partition.north.z, height: 1.0 / division } )
        }

        this.partition.dirty = this.dirty = true

    }

}

export { Liquid }
