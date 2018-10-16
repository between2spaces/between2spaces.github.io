import { Block } from "client/blocks/Block"
import * as world from "client/world"

class Solid extends Block {

    constructor( params ) {

        super( Object.assign( params || {}, { matter: "solid" } ) )

    }

    update() {

        super.update()

        if ( this.below && this.below.material === "solid" && this.below.ylevel == this.ylevel ) {
            world.move( this, 0, 1, 0 )
        }

    }

}

export { Solid }
