import Server from './server.js';
import * as base64arraybuffer from './base64arraybuffer.js';


class WurmServer extends Server {

	onNewEntity( entity ) {

	}

	onConnect( client ) {

		if ( ! ( 'x' in client ) ) {

			this.setProperty( client, 'x', 0 );
			this.setProperty( client, 'y', 0 );

		}

	}


	onDisconnect( client ) {

	}

	onMove( data, id ) {

		if ( ! ( id in this.entityId ) ) return;

		const entity = this.entityId[ id ];

		this.setProperty( entity, 'x', entity.x + data.dx );
		this.setProperty( entity, 'y', entity.y + data.dy );

	}

	onGet( data, id ) {

		fetch( data.url )
			.then( res => res.arrayBuffer() )
			.then( arrayBuffer => {

				const base64 = base64arraybuffer.encode( arrayBuffer );
				this.send( 'Get', { url: data.url, base64: base64 }, id );

			} );

	}

}


const server = new WurmServer( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ], serverHeartbeat: 666 } );

