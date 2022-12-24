import { Vector3 } from 'threejs'
import { Vector2 } from 'threejs'
import { _Math } from 'threejs'
import { Raycaster } from 'threejs'
import { rbush } from 'rbush'
import { WorldObject } from 'src/WorldObject'
import * as global from 'src/global'
import * as random from 'src/random'
import * as events from 'src/events'
import 'src/animations/all'
import 'src/rules/all'

random.seed( 'development' )


global.display.addAmbientLight( 0x333333 )
global.display.addDirectionalLight( 0xffffff, 1, 1, -0.5, 0.5 )


let player = null


global.world.addEventListener( events.CREATED, function ( event ) {

    let position = event.object.position

    new WorldObject( { chars: '.', position: position } )

    if ( position.x === 0 && position.z === 0 ) {

        player = new WorldObject( { chars: '@', position: position } )
        global.display.follow( player )

    } else if ( position.x === 1 && position.z === -1 ) {

        new WorldObject( { chars: '.', position: position } )

    }

} )


document.addEventListener( 'keyup', function ( event ) {

    if ( player ) {

        if ( event.key === 'h' ) player.move( -1, 0 )
        else if ( event.key === 'l' ) player.move( 1, 0 )
        else if ( event.key === 'j' ) player.move( 0, 1 )
        else if ( event.key === 'k' ) player.move( 0, -1 )

    }

    else if ( event.key === 'z' ) global.display.dolly( 1 )
    else if ( event.key === 'Z' ) global.display.dolly( -1 )

} )

global.run()

global.display.orbitcontrols.rotateLeft( _Math.degToRad( 30 ) )
global.display.orbitcontrols.rotateUp( - _Math.degToRad( 45 ) )
global.display.orbitcontrols.dolly( 6 )

let tree = rbush()
let item = {
    minX: 20,
    minY: 40,
    maxX: 30,
    maxY: 50,
    worldobject: '1'
}
tree.insert( item )
let result = tree.search( {
    minX: 28,
    minY: 20,
    maxX: 80,
    maxY: 45
} )
console.log( result )