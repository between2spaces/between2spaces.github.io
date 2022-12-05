import Server from './server.js';


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

}


const server = new WurmServer( [ 'http://localhost:8000', 'https://between2spaces.github.io' ] );

