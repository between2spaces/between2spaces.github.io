import * as display from "client/display"
import * as world from "client/world"
import { noise } from "client/random.js"
import { Rock } from "client/blocks/Rock"
import { Dirt } from "client/blocks/Dirt"
import { Water } from "client/blocks/Water"
import { Person } from "client/blocks/Person"

function update() {

    requestAnimationFrame( update )
    display.update()
    world.update()

}

world.setSize( 20 )
display.setCamera( 0, 5, 0 )

// generate random world
let hills = 5
let max = 2 * world.halfsize

for ( let z = -world.halfsize + 1; z < world.halfsize; z++ ) {
    for ( let x = -world.halfsize + 1; x < world.halfsize; x++ ) {
        let height = 1 // Math.floor( 1 + 1 * noise( ( ( x + world.halfsize ) / max ) * hills, ( ( z + world.halfsize ) / max ) * hills ) )
        while ( height-- ) {
            new Rock( { x: x, z: z } )
        }
    }
}


new Water( { x: 2, z: -2 } )

const player = new Person( { x: 0, z: 0 } )

world.setPlayerObject( player )
display.focus( player )

document.addEventListener( "keydown", function ( event ) {

    if ( player ) {

        if ( event.key === "h" ) world.move( player, -1, 0 )
        else if ( event.key === "l" ) world.move( player, 1, 0 )
        else if ( event.key === "j" ) world.move( player, 0, 1 )
        else if ( event.key === "k" ) world.move( player, 0, -1 )

    }

} )

console.log( "# objects: " + world.objects.length )

update()
