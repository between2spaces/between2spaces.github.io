import Object from "./object.js";


export default class Mesh extends Object {

	constructor( geometry, material ) {

		super();

		this.geometry = geometry;
		this.material = material;

	}


	render( gl, camera, lights ) {


	}


}

