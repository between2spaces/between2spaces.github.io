import { Block } from "client/blocks/Block"

class Gas extends Block {

    constructor( params ) {

        super( Object.assign( params || {}, { matter: "gas" } ) )

    }

    update() {

        super.update()

    }

}

export { Gas }
