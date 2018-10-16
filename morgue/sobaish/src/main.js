import * as display from './display.js'
import * as world from './world.js'
import { cursor } from './cursor.js'
import { Vector3 } from './threejs/math/Vector3.js'
import { Ground } from './ground.js'
import { GuardTower } from './guardtower.js'
import { House } from './house.js'

display.camera.position.set( cursor.position.x, cursor.position.y + 15, cursor.position.z + 2 )
display.camera.lookAt( cursor.position )
display.controls.target.copy( cursor.position )
display.updateFrustum()

world.add( Ground(), world.centre.x, 0, world.centre.z )
world.add( GuardTower( 1 ), world.centre.x, 0, world.centre.z )
world.add( House( 1 ), world.centre.x - 4, 0, world.centre.z + 3 )

document.addEventListener( 'keydown', function( event ) {
	let key = event.key
	switch ( key ) {
	case 'h':
		display.camera.position.x -= 1
        world.move( cursor, -1, 0, 0 )
		break
	case 'j':
		display.camera.position.z += 1
		world.move( cursor, 0, 0, 1 )
		break
	case 'k':
		display.camera.position.z -= 1
		world.move( cursor, 0, 0, -1 )
		break
	case 'l':
		display.camera.position.x += 1
		world.move( cursor, 1, 0, 0 )
		break
	case 'p':
		display.camera.position.y -= 1
		break
	case ';':
		display.camera.position.y += 1
		break
    }
    display.camera.lookAt( cursor.position )
    display.controls.target.copy( cursor.position )
} )
