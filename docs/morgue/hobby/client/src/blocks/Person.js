import { register } from "client/blocks/Block"
import { Solid } from "client/blocks/Solid"

class Person extends Solid {

    constructor( params ) {

        super( Object.assign( params || {}, { type: "person", char: "▢" } ) )

    }

    update() {

        super.update()

    }

}

register( "@", {
    edge: "rgba( 0, 0, 0, 0 )",
    fill: "rgba( 0, 0, 0, 0 )",
    glyph: "rgba( 255, 255, 255, 1 )"
} )

export { Person }
