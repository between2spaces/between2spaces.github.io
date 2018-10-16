import * as world from './world.js'
import * as materials from './materials.js'
import { Vector3 } from './threejs/math/Vector3.js'
import { Object3D } from './threejs/core/Object3D.js'
import { Mesh } from './threejs/objects/Mesh.js'
import { SphereGeometry } from './threejs/geometries/SphereGeometry.js'
import { CylinderGeometry } from './threejs/geometries/CylinderGeometry.js'

function Person() {
	let person = {
		position: new Vector3(),
		object: new Object3D(),
		speed: 0.3,
		behaviours: [],
		dirty: true
	}
	person.task = Task( person )
	let head = new Mesh( new SphereGeometry( 0.15 ), materials.SKIN )
	head.position.y = 1.6
	person.object.add( head )
	let body = new Mesh( new CylinderGeometry( 0.24, 0.03, 1.35 ), materials.SKIN )
	body.position.y = 0.8
	person.object.add( body )
	return person
}

function Task( person ) {
	return function() {
		if ( ! person.dirty ) return
		let i = person.behaviours.length
		while ( i-- ) {
			let behaviour = person.behaviours[ i ]
			if ( behaviour.act( person ) ) break
		}
	}
}

function addBehaviour( person, behaviour ) {
	person.behaviours.push( behaviour )
}

export { Person, addBehaviour }
