import { Server, serverInstance, Entity, Client } from './server.js';
import * as url from 'node:url';


class GameEntity extends Entity {

}


class GameClient extends Client {

}


class GameServer extends Server {

	constructor( args ) {

		super( args );

	}

	run() {

		super.run();

	}

	update() {

		super.update();

	}

	createEntity( args ) {

		const entity = super.createEntity( args );
		Object.setPrototypeOf( entity, GameEntity );
		return entity;

	}

	createClient( args ) {

		const client = super.createClient( args );
		Object.setPrototypeOf( client, GameClient );
		return client;

	}

	onConnect( client ) {

		super.onConnect( client );

	}

	onDisconnect( client ) {

		super.onDisconnect( client );

	}

	_enableAdmin( msg ) {

		if ( msg.from in server.adminClientById )
			delete server.adminClientById[ msg.from ];

		const argstr = JSON.stringify( msg );

		if ( ! ( 'secret' in msg ) ) {

			const msg = `server._flagAdmin( ${argstr} ) does not provide 'secret'`;

			this.send( {
				from: 'server',
				to: msg.from,
				_: 'log',
				level: 'error',
				message: msg
			} );

			return console.log( `Error: ${msg}` );

		}

		if ( msg.secret !== process.env.ADMIN_SECRET ) {

			const msg = `server._flagAdmin( ${argstr} ) has invalid 'secret'`;

			this.send( {
				from: 'server',
				to: msg.from,
				_: 'log',
				level: 'error',
				message: msg
			} );

			return console.log( `Error: ${msg}` );

		}

		this.adminClientById[ msg.from ] = Entity.byId[ msg.from ];

		this.send( {
			from: 'server',
			to: msg.from,
			_: 'log',
			level: 'success',
			args: argstr
		} );

	}

}



if ( url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' ) {

	// Main ESM module - path of this module matches path of module passed to node process
	( new GameServer( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ] } ) ).run();

}

