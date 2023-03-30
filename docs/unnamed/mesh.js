class Mesh extends Object {

	constructor( geometry, material ) {

		super();

		this.geometry = geometry;
		this.material = material;

	}


	render( camera, lights ) {

		for ( let mesh of this.meshByMaterial ) {

			mesh.render( camera, lights );

		}

	}


}

