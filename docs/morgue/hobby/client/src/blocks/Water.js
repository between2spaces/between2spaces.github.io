import { register, registerBlockType } from "client/blocks/Block"
import { Liquid } from "client/blocks/Liquid"

class Water extends Liquid {

    constructor( params ) {

        super( Object.assign( params || {}, { type: "Water", char: "∼" } ) )

    }

    update() {

        super.update()
        this.updateMesh( this.char === "∼" ? "~" : "∼", this.width, this.height, this.depth )

    }

}

registerBlockType( "Water", Water )


register( "~", {
    edge: "rgba( 100, 100, 255, 0.3 )",
    fill: "rgba( 100, 100, 255, 0.3 )",
    glyph: "rgba( 0, 0, 100, 0.5 )"
} )

register( "∼", {
    edge: "rgba( 100, 100, 255, 0.3 )",
    fill: "rgba( 100, 100, 255, 0.3 )",
    glyph: "rgba( 0, 0, 100, 0.5 )"
} )

export { Water }
