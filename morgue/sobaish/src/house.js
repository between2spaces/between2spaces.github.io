import * as world from './world.js'
import * as materials from './materials.js'
import * as behaviours from './behaviours.js'
import { Person, addBehaviour } from './person.js'
import { Vector3 } from './threejs/math/Vector3.js'
import { Object3D } from './threejs/core/Object3D.js'
import { Mesh } from './threejs/objects/Mesh.js'
import { BoxGeometry } from './threejs/geometries/BoxGeometry.js'

const UNIT = { x: 2, y: 2, z: 2 }

function House( size ) {
	let house = {
		size: size,
		position: new Vector3(),
		object: new Object3D(),
		occupants: [],
		dirty: true
	}
	house.task = Task( house )
	let mesh = new Mesh( new BoxGeometry( UNIT.x, UNIT.y, UNIT.z ), materials.WOOD )
	mesh.position.y = UNIT.y * 0.5
	house.object.add( mesh )
	return house
}

function Task( house ) {
	return function() {
		if ( ! house.dirty ) return
		house.object.scale.set( house.size, house.size, house.size )
		house.object.position.y += ( ( UNIT.y * house.size ) * 0.5 ) - house.object.children[ 0 ].position.y
		while ( house.occupants.length > house.size ) {
			world.remove( house.occupants.pop() )
		}
		while ( house.occupants.length < house.size ) {
			let villager = Person()
			addBehaviour( villager, behaviours.VILLAGER )
			house.occupants.push( villager )
			let pos = house.object.position
			world.add( villager, pos.x, pos.y, pos.z )
			let dx = UNIT.x * ( Math.random() > 0.5 ? 1 : - 1 )
			let dz = UNIT.z * ( Math.random() > 0.5 ? 1 : - 1 )
			world.move( villager, dx, 0, dz )
		}
		house.dirty = false
	}
}

export { House }
