import * as world from './world.js';
import * as materials from './materials.js';
import * as display from './display.js';
import { Vector3 } from './threejs/math/Vector3.js.js';
import { Object3D } from './threejs/core/Object3D.js.js';
import { Mesh } from './threejs/objects/Mesh.js.js';
import { SphereGeometry } from './threejs/geometries/SphereGeometry.js.js';
import { CylinderGeometry } from './threejs/geometries/CylinderGeometry.js.js';


export function Object() {

	let object = {

		// {Object3D} object ThreeJS object
		object: new Object3D(),

		// {function} update function
		update: update,

		// {Number}  speed Movement speed (metres per millisecond)
		speed: 0,

		// {Object}  [action_movement]
		// {Vector3} [action_movement.to]   target destination
		// {Number}  [action_movement.time] time of previous movement update
		action_movement: null

	};

	return object;

}


const VEC3 = new Vector3();


/**
 * Object's update task.
 * @param {Object} object
 */
function update( object ) {

	if ( object.action_movement ) {

		let movement = object.action_movement;
		let position = object.object.position;
		VEC3.x = movement.to.x - position.x;
		VEC3.y = movement.to.y - position.y;
		VEC3.z = movement.to.z - position.z;
		let alpha = ( object.speed * ( world.time - movement.time ) ) / VEC3.length();
		if ( alpha >= 1 ) {

			object.action_movement = null;
			position.copy( movement.to );
			return;

		}

		position.add( VEC3.multiplyScalar( alpha ) );
		movement.time = world.time;

	}

}


/**
 * Return the Object's position.
 * @param {Object} object
 * @example
 *      position( object ).set( 0, 0, 0 )
 *      position( object ).copy( vec3 )
 *      position( object ).x
 */
export function position( object ) {

	return object.object.position;

}


/**
 * Move an Object over time using it's speed towards the target destination.
 * @param {Object} object
 * @param {Vector3} to
 */
export function move( object, to ) {

	if ( object.speed <= 0 || ! ( display.inView( position( object ) ) || display.inView( to ) ) ) {

		console.log( 'move without animation' );
		position( object ).set( to );
		return;

	}

	console.log( 'move with animation' );

	if ( object.action_movement ) {

		object.action_movement.to = to;

	} else {

		object.action_movement = { to: to, time: world.time };

	}

}


/**
 * Adds a Mesh to the Object.
 * @param {Object} object
 * @param {Mesh} mesh
 * @return {Mesh} the added Mesh
 */
export function addMesh( object, mesh ) {

	object.object.add( mesh );

	return mesh;

}
