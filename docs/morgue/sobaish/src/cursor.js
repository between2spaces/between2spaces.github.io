import * as world from './world.js'
import * as materials from './materials.js'
import { Vector3 } from './threejs/math/Vector3.js.js'
import { Object3D } from './threejs/core/Object3D.js.js'
import { Mesh } from './threejs/objects/Mesh.js.js'
import { BoxGeometry } from './threejs/geometries/BoxGeometry.js.js'
import { GridHelper } from './threejs/helpers/GridHelper.js.js'

function Cursor() {
	let cursor = {
		position: new Vector3(),
		object: new Object3D(),
		speed: -1
	}
	let box = new Mesh( new BoxGeometry( 1, 1, 1 ), materials.CURSOR )
	box.position.y = 0.5
	let grid = new GridHelper( 100, 100 )
	grid.position.set( 0, 0.01, 0 )
	cursor.object.add( box )
	cursor.object.add( grid )
	return cursor
}

const cursor = Cursor()

world.add( cursor, world.centre.x, 0, world.centre.z )

export { cursor }