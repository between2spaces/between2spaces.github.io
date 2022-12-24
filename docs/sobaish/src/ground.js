import * as world from './world.js'
import * as materials from './materials.js'
import { Vector3 } from './threejs/math/Vector3.js'
import { Object3D } from './threejs/core/Object3D.js'
import { BoxGeometry } from './threejs/geometries/BoxGeometry.js'
import { Mesh } from './threejs/objects/Mesh.js'

function Ground() {
	let ground = {
		position: new Vector3(),
		object: new Object3D()
	}
	let geometry = new BoxGeometry( world.size.x, world.size.z, 0.01 )
	ground.object.add( new Mesh( geometry, materials.GRASS ) )
	ground.object.rotation.x = Math.PI / 2
	return ground
}

export { Ground }
