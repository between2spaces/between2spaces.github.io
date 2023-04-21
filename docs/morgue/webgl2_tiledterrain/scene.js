import Object from "./object.js";
import Mesh from "./mesh.js";
import Light from "./light.js";


class Scene extends Object {

	constructor() {

		super();

		this.meshesByMaterial = {};
		this.lightsByType = {};

	}


	add( object ) {

		if ( object instanceof Mesh ) {

			const material = object.material;

			if ( ! this.meshesByMaterial.hasOwnProperty( material ) ) {

				this.meshesByMaterial[ material ] = [];

			}

			this.meshesByMaterial[ material ].push( object );

		} else if ( object instanceof Light ) {

			const type = object.constructor.name;

			if ( ! this.lightsByType.hasOwnProperty( type ) ) {

				this.lightsByType[ type ] = [];

			}

			this.lightsByType[ type ].push( object );

		}

	}


	render( gl, camera ) {

		for ( let mesh of this.meshesByMaterial ) {

			mesh.render( gl, camera, this.lightsByType );

		}

	}

}

