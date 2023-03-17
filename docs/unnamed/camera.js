import Object from "./object.js";
import * as mat4 from "./mat4.js";
import * as vec3 from "./vec3.js";


const _v1 = vec3.identity();



export class Camera extends Object {

	constructor() {

		super();
		this.projection = mat4.identity();
		this.view = mat4.inverse( this.matrix );

	}

	zoom( delta ) {}

	updateWorldMatrix() {

		super.updateWorldMatrix();
		mat4.inverse( this.worldMatrix, this.view );

	}

}



export class OrthogonalCamera extends Camera {

	constructor( left = - 50, right = 50, top = 50, bottom = - 50, near = 0.01, far = 99999 ) {

		super();
		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;
		this.near = near;
		this.far = far;
		mat4.makeOrthogonal( left, right, top, bottom, near, far, this.projection );

	}

	zoom( delta ) {

		this.left *= delta;
		this.right *= delta;
		this.top *= delta;
		this.bottom *= delta;

		mat4.makeOrthogonal( this.left, this.right, this.top, this.bottom, this.near, this.far, this.projection );

	}

}



export class PerspectiveCamera extends Camera {

	constructor( fovy = 90, aspect = window.innerWidth / window.innerHeight, near = 0.01, far = 99999 ) {

		super();
		this.zoomSpeed = 10;
		mat4.makePerspective( fovy, aspect, near, far, this.projection );

	}

	zoom( delta ) {

		this.getDirection( _v1 );
		this.translateOnAxis( _v1, ( delta - 1 ) * this.zoomSpeed );
		this.updateMatrix();

	}

}



export class OrbitControl extends Object {

	constructor( camera, distance ) {

		super();

		this.camera = camera;

		this.add( this.camera );
		this.camera.setPosition( 0, distance, 0 );
		this.camera.lookAt( this, vec3._zAxis );

	}

	setDistance( distance ) {

		this.camera.setPosition( 0, distance, 0 );

	}

	rotateX( angle ) {

		return this.rotateOnWorldAxis( vec3._xAxis, angle );

	}

}
