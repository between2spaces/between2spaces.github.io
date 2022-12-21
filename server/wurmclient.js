import Client from './client.js';
import { createNoise3D } from './simplexnoise.js';

const noise3D = createNoise3D();
const mapSize = 128;

class WurmClient extends Client {

	onConnect( message ) {

		super.onConnect( message );

	}

	onGet( message ) {

		const image = new Image();
		image.src = `data:image/jpeg;base64, ${message.base64}`;
		document.body.append( image );

	}

	onNewEntity( entity ) {

		if ( 'x' in entity && 'y' in entity ) entitySpace.update( entity );

		console.log( 'onNewEntity', entity );

	}

	onUpdate( delta ) {

		super.onUpdate( delta );

		const entity = this.entityId[ delta.id ];

		if ( 'x' in delta || 'y' in delta ) entitySpace.update( entity );

		console.log( 'onUpdate', entity );

	}

}


const entitySpace = {

	cells: Array.from( { length: mapSize * mapSize }, () => [] ),
	dirty: [],

	isDirty: ( entity ) => {

		if ( entitySpace.dirty.indexOf( entity ) === - 1 ) entitySpace.dirty.push( entity );

	},

	clearDirty: () => {

		const dirty = entitySpace.dirty;
		entitySpace.dirty = [];
		return dirty;

	},

	entitiesAt: ( x, y ) => {

		return entitySpace.cells[ y * mapSize + x ];

	},

	update: ( entity ) => {

		if ( ! ( 'x' in entity && 'y' in entity ) ) return;

		const entitySpaceIndex = entity.y * mapSize + entity.x;

		if ( entitySpaceIndex < 0 || entitySpaceIndex >= entitySpace.cells.length ) {

			console.log( 'error: entitySpaceIndex out of bounds' );
			return;

		}

		let dirty = false;

		if ( 'entitySpaceIndex' in entity && entitySpaceIndex !== entity.entitySpaceIndex ) {

			const index = entitySpace.cells[ entity.entitySpaceIndex ].indexOf( entity );
			if ( index > - 1 ) entitySpace.cells[ entity.entitySpaceIndex ].splice( index, 1 );
			dirty = true;

		}

		if ( ! ( 'entitySpaceIndex' in entity ) || entitySpaceIndex !== entity.entitySpaceIndex ) {

			entity.entitySpaceIndex = entitySpaceIndex;
			entitySpace.cells[ entitySpaceIndex ].push( entity );
			dirty = true;

		}

		if ( dirty ) entitySpace.isDirty( entity );

	}

};


const client = new WurmClient( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://daffodil-polite-seat.glitch.me/' );


let player;

function move( dx, dy ) {

	client.send( 'Move', { dx, dy } );

}

document.addEventListener( 'keydown', event => {

	if ( event.repeat ) return;

	const key = event.key;

	if ( key === 'j' ) move( 0, 1 );
	if ( key === 'k' ) move( 0, - 1 );
	if ( key === 'h' ) move( - 1, 0 );
	if ( key === 'l' ) move( 1, 0 );

} );




const view = {

	x: 0,
	y: 0,
	entitySpace: entitySpace,

	update: ( timestamp ) => {

		if ( ! view.entitySpace.dirty.length ) return window.requestAnimationFrame( view.update );

		const dirty = view.entitySpace.clearDirty();

		for ( let entity of dirty ) {

			if ( ! ( 'domElement' in entity ) ) {

				entity.domElement = document.createElement( 'div' );
				entity.domElement.className = 'entity';
				document.body.append( entity.domElement );

			}

			entity.domElement.style.left = ( entity.x * entity.domElement.offsetWidth ) + 'px';
			entity.domElement.style.top = ( entity.y * entity.domElement.offsetHeight ) + 'px';

		}

		window.requestAnimationFrame( view.update );

	}

};

window.requestAnimationFrame( view.update );

console.log( noise3D( - 100, 1, 256 ) );
