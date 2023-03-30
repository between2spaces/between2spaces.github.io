import Object from "./object.js";


class Scene extends Object {

	constructor() {

		super();

		this.meshesByMaterial = {};

	}


	addMesh( mesh ) {

		if ( ! this.meshesByMaterial.hasOwnProperty( mesh.material ) ) {

			this.meshesByMaterial[ mesh.material ] = [];

		}

		this.meshesByMaterial[ mesh.material ].push( mesh );

	}


	render( camera, lights ) {

		for ( let mesh of this.meshesByMaterial ) {

			mesh.render( camera, lights );

		}

	}

}


