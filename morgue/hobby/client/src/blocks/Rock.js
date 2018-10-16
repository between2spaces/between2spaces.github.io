import { register } from "client/blocks/Block"
import { Solid } from "client/blocks/Solid"

class Rock extends Solid {

    constructor( params ) {

        super( Object.assign( params || {}, { type: "rock", char: "." } ) )

    }

    update() {

        super.update()

    }

}

register( ".", {
    edge: "rgba( 20, 20, 20, 1 )",
    fill: "rgba( 10, 10, 10, 1 )",
    glyph: "rgba( 20, 20, 20, 1 )"
} )

export { Rock }
