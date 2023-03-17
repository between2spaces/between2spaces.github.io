import { register } from "client/blocks/Block"
import { Solid } from "client/blocks/Solid"

class Dirt extends Solid {

    constructor( params ) {

        super( Object.assign( params || {}, { type: "dirt", char: "-" } ) )

    }

    update() {

        super.update()

    }

}

register( "-", {
    edge: "#996531",
    fill: "#704112",
    glyph: "#996531"
} )

export { Dirt }
