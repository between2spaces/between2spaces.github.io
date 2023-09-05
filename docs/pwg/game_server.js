import { Server, Entity, Client } from './server.js';
import * as url from 'node:url';

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

	onConnect( client ) {

		super.onConnect( client );

	}

	onDisconnect( client ) {

		super.onDisconnect( client );

	}

	_flagAdmin( msg ) {

		if ( msg.from in server.adminClientById )
			delete server.adminClientById[ msg.from ];

		const argstr = JSON.stringify( msg );

		if ( ! ( 'secret' in msg ) ) {

			const msg = `server._flagAdmin( ${argstr} ) does not provide 'secret'`;

			this.send( {
				from: 'server',
				to: msg.from,
				_: 'error',
				message: msg
			} );

			return console.log( `Error: ${msg}` );

		}

		if ( msg.secret !== process.env.ADMIN_SECRET ) {

			const msg = `server._flagAdmin( ${argstr} ) has invalid 'secret'`;

			this.send( {
				from: 'server',
				to: msg.from,
				_: 'error',
				message: msg
			} );

			return console.log( `Error: ${msg}` );

		}

		server.adminClientById[ msg.from ] = Entity.byId[ msg.from ];

		this.send( {
			from: 'server',
			to: msg.from,
			_: 'success',
			args: argstr
		} );

	}

}



if ( url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' ) {

	// Main ESM module - path of this module matches path of module passed to node process
	( new GameServer( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ] } ) ).run();

}

