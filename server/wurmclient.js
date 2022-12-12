import Client from './client.js';

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

	entitiesAt: ( x, y ) => {

		return entitySpace.cells[ y * mapSize + x ];

	},

	update: ( entity ) => {

		if ( ! ( 'x' in entity && 'y' in entity ) ) return;

		const entitySpaceIndex = entity.y * mapSize + entity.x;

		if ( 'entitySpaceIndex' in entity && entitySpaceIndex !== entity.entitySpaceIndex ) {

			const index = entitySpace.cells[ entity.entitySpaceIndex ].indexOf( entity );
			if ( index > - 1 ) entitySpace.cells[ entity.entitySpaceIndex ].splice( index, 1 );

		}

		if ( ! ( 'entitySpaceIndex' in entity ) || entitySpaceIndex !== entity.entitySpaceIndex ) {

			entity.entitySpaceIndex = entitySpaceIndex;
			entitySpace.cells[ entitySpaceIndex ].push( entity );

		}

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

	update: ( timestamp ) => {

		for ( let y = 0; y < mapSize; y ++ ) {

			for ( let x = 0; x < mapSize; x ++ ) {

				const entities = entitySpace.cells[ y * mapSize + x ];

				for ( let i = 0; i < entities.length; i ++ ) {

					const entity = entities[ i ];

					if ( ! ( 'domElement' in entity ) ) {

						entity.domElement = document.createElement( 'div' );
						entity.domElement.className = 'entity';
						document.body.append( entity.domElement );

					}

					entity.domElement.style.left = ( x * entity.domElement.offsetWidth ) + 'px';
					entity.domElement.style.top = ( y * entity.domElement.offsetHeight ) + 'px';

				}

			}

		}

		window.requestAnimationFrame( view.update );

	}

};

window.requestAnimationFrame( view.update );

