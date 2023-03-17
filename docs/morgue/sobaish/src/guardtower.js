import * as world from './world.js'
import * as materials from './materials.js'
import * as behaviours from './behaviours.js'
import { Person, addBehaviour } from './person.js'
import { Vector3 } from './threejs/math/Vector3.js.js'
import { Object3D } from './threejs/core/Object3D.js.js'
import { Mesh } from './threejs/objects/Mesh.js.js'
import { CylinderGeometry } from './threejs/geometries/CylinderGeometry.js.js'

const UNIT = { radius: 2, height: 5 }

function GuardTower( size ) {
	let guardtower = {
		size: size,
		position: new Vector3(),
		object: new Object3D(),
		guards: [],
		dirty: true
	}
	guardtower.task = Task( guardtower )
	let tower = new Mesh( new CylinderGeometry( UNIT.radius, UNIT.radius, UNIT.height, 16 ), materials.WOOD )
	tower.position.y = UNIT.height * 0.5
	guardtower.object.add( tower )
	return guardtower
}

function Task( guardtower ) {
	return function() {
		if ( ! guardtower.dirty ) return
		guardtower.object.scale.set( guardtower.size, guardtower.size, guardtower.size )
		guardtower.object.position.y += ( ( UNIT.height * guardtower.size ) * 0.5 ) - guardtower.object.children[ 0 ].position.y
        console.log( world.cellsWithin( guardtower.object.position.x, guardtower.object.position.z, UNIT.radius * guardtower.size ) )
        while ( guardtower.guards.length > guardtower.size ) {
			world.remove( guardtower.guards.pop() )
		}
		while ( guardtower.guards.length < guardtower.size ) {
			let guard = Person()
			addBehaviour( guard, behaviours.GUARD )
			guardtower.guards.push( guard )
			let pos = guardtower.object.position
			world.add( guard, pos.x, pos.y, pos.z )
			let dx = UNIT.radius * ( Math.random() > 0.5 ? 1 : - 1 )
			let dz = UNIT.radius * ( Math.random() > 0.5 ? 1 : - 1 )
			world.move( guard, dx, 0, dz )
		}
		guardtower.dirty = false
	}
}

export { GuardTower }
