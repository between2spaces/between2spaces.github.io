import * as mat4 from "./mat4.js";
import * as vec3 from "./vec3.js";
import * as quaternion from "./quaternion.js";


const _v3 = vec3.identity();
const _m4 = mat4.identity();


export default class Object {

	constructor() {

		this.parent = null;
		this.children = [];

	    this.up = vec3.copy( vec3._zAxis );
	    this.position = vec3.identity();
	    this.rotation = quaternion.identity();
	    this.scale = vec3.set( 1, 1, 1 );

	    this.matrix = mat4.identity();
		this.worldMatrix = mat4.identity();

	}

	add( object ) {


		if ( object.parent !== null ) {

			object.parent.remove( object );

		}

		object.parent = this;
		this.children.push( object );

	}

	attach( object ) {

		mat4.inverse( this.worldMatrix, _m4 );

		if ( object.parent ) {

			object.parent.updateWorldMatrix();
			mat4.multiply( _m4, object.parent.worldMatrix, _m4 );

		}

		object.applyMatrix( _m4 );

		this.add( object );

		object.updateWorldMatrix();

	}

	remove( object ) {

		const index = this.children.indexOf( object );

		if ( index === - 1 ) return;

		object.parent = null;
		this.children.splice( index, 1 );

	}

	updateMatrix() {

		mat4.compose( this.position, this.rotation, this.scale, this.matrix );
		this.updateWorldMatrix();

	}

	updateWorldMatrix() {

		if ( ! this.parent ) {

			mat4.copy( this.matrix, this.worldMatrix );

		} else {

			mat4.multiply( this.parent.worldMatrix, this.matrix, this.worldMatrix );

		}

		for ( let i = 0, l = this.children.length; i < l; i ++ ) {

			const child = this.children[ i ];
			child.updateWorldMatrix();

		}

	}

	applyMatrix( matrix ) {

		this.updateMatrix();

		mat4.multiply( this.matrix, matrix, this.matrix );

		mat4.decompose( this.matrix, this.position, this.quaternion, this.scale );

	}

	setPosition( x, y, z ) {

		vec3.set( x, y, z, this.position );
		this.updateMatrix();

	}

	rotateOnAxis( axis, angle ) {

		const _r = quaternion.setFromAxisAngle( axis, angle );
		quaternion.multiply( _r, this.rotation, this.rotation );
		this.updateMatrix();

	}

	rotateOnWorldAxis( axis, angle ) {

		const _r = quaternion.setFromAxisAngle( axis, angle );
		quaternion.multiply( this.rotation, _r, this.rotation );
		this.updateMatrix();

	}

	rotateX( angle ) {

		return this.rotateOnAxis( vec3._xAxis, angle );

	}

	rotateY( angle ) {

		return this.rotateOnAxis( vec3._yAxis, angle );

	}

	rotateZ( angle ) {

		return this.rotateOnAxis( vec3._zAxis, angle );

	}

	lookAt( target, up = vec3._yAxis ) {

		if ( target instanceof Object ) target = target.position;

		mat4.makeLookAt( this.position, target, up, _m4 );

		quaternion.setFromRotationMatrix( _m4, this.rotation );

		this.updateMatrix();

	}

	getDirection( dst ) {

		this.updateWorldMatrix();

		const m = this.matrix;

		dst = vec3.normalise( vec3.set( m[ 8 ], m[ 9 ], m[ 10 ], dst ) );

		return dst;

	}

	getWorldDirection( dst ) {

		this.updateWorldMatrix();

		const m = this.worldMatrix;

		dst = vec3.normalise( vec3.set( m[ 8 ], m[ 9 ], m[ 10 ], dst ) );

		return dst;

	}

	translateOnAxis( axis, distance ) {

		vec3.add( this.position, vec3.multiplyScalar( axis, distance, _v3 ), this.position );
		this.updateMatrix();

	}

}

