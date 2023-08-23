import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import fs from 'fs';
import * as url from 'node:url';

let serverInstance;

export default class Server {

	constructor( args ) {

		this.allowedOrigins = args.allowedOrigins ? args.allowedOrigins : [ 'http://localhost:8000' ];
		this.heartbeat = 'heartbeat' in args ? args.heartbeat : 3333;
		this.clientTimeout = 'clientTimeout' in args ? args.clientTimeout : 10000;
		this.clientBySecret = {};
		this.adminClientById = {};
		this.infoById = {};
		this.inMessages = [];
		this.outMessages = [];

		serverInstance = this;

		const wss = new WebSocketServer( {
			port: process.env.PORT,
			verifyClient: info => this.allowedOrigins.indexOf( info.req.headers.origin ) > - 1
		} );


		wss.on( 'connection', ( ws, req ) => {

			let secret = /[?&]{1}secret=([0-9a-fA-F]{8})/.exec( req.url );
			let client;

			if ( secret && secret[ 1 ] in this.clientBySecret ) {

				client = this.clientBySecret[ secret = secret[ 1 ] ];

			} else {

				client = new Client();
				secret = uuid();

			}

			ws.on( 'message', data => {

				try {

					if ( ! ( client.id in this.infoById ) ) return ws.close();

					this.infoById[ client.id ].lastseen = Date.now();

					console.log( `${client.id} -> ${data}` );

					if ( `${data}` === 'undefined' ) return;

					let messages = JSON.parse( data );

					messages = ( messages.constructor !== Array ) ? [ messages ] : messages;

					for ( const message of messages ) {

						message.from = client.id;

						this.inMessages.push( message );

					}

				} catch ( e ) {

					console.error( e );

				}

			} );

			this.infoById[ client.id ] = { ws, secret, client, lastseen: Date.now() };

			this.send( 'Identity', { id: client.id, secret: secret, clientTimeout: this.clientTimeout, serverHeartbeat: this.heartbeat }, client.id );

			if ( secret in this.clientBySecret ) {

				console.log( `${client.id} reconnected` );
				this.send( null, client, client.id );

			} else {

				console.log( `${client.id} connected` );
				this.clientBySecret[ secret ] = client;
				this.send( 'Connect', client );

			}

			this.onConnect( client );

		} );

	}

	run() {

		console.log();
		console.log( `Server listening on port ${process.env.PORT}` );
		console.log();
		console.log( `allowedOrigins: ${serverInstance.allowedOrigins}` );
		console.log( `serverHeartbeat: ${serverInstance.heartbeat}` );
		console.log( `clientTimeout: ${serverInstance.clientTimeout}` );
		console.log();

		this.scheduleNextUpdate();

	}

	scheduleNextUpdate() {

		let timeout = Date.now() - this.lastUpdate;

		timeout = timeout > this.heartbeat ? 0 : this.heartbeat - timeout;

		console.log( `next update in ${timeout}ms...` );

		setTimeout( () => {

			this.lastUpdate = Date.now();
			serverInstance.onUpdate();

		}, timeout );

	}

	onUpdate() {

		if ( ! ( 'Client' in Entity.byType ) )
			return this.scheduleNextUpdate();

		// disconnect clients we haven't heard from in awhile
		const timeout = this.lastUpdate - this.clientTimeout;

		for ( let client of Entity.byType[ 'Client' ] ) {

			if ( this.infoById[ client.id ].lastseen < timeout ) {

				client.disconnect();

			}

		}

		// process inbound messages
		const inMessages = this.inMessages;

		this.inMessages = [];

		for ( const message of inMessages ) {

			console.log( JSON.stringify( message ) );

			const onevent = `on${message.event}`;

			let to = 'server';

			if ( 'to' in message ) {

				to = message.to;
				delete message[ 'to' ];

			}

			let targets;

			if ( to === 'server' ) {

				targets = [ serverInstance ];

			} else if ( to.startsWith( 'type=' ) ) {

				const type = to.replace( 'type=', '' );

				if ( ! ( type in Entity.byType ) ) {

					console.log( `Warn: Message to '${to}' has no targets` );
					continue;

				}

				targets = Entity.byType[ type ];

			} else {

				if ( ! ( to in Entity.byId ) ) {

					console.log( `Warn: Message to '${to}' has no targets` );
					continue;

				}

				targets = [ Entity.byId[ to ] ];

			}


			for ( let target of targets ) {

				if ( onevent in target ) {

					target[ onevent ]( message );

				} else {

					console.log( `<${to}>.${onevent}( ${ JSON.stringify( message ) } ) not found` );

				}

			}

		}

		// broadcast entity deltas and call entity update
		const dirtyById = Entity.dirtyById;

		Entity.dirtyById = {};

		for ( const id in dirtyById ) {

			const delta = dirtyById[ id ];

			if ( Object.keys( delta ).length ) {

				delta.id = id;
				this.send( null, delta );

			}

			Entity.byId[ id ].onUpdate();

			if ( ! ( id in Entity.dirtyById ) ) console.log( `${id} went to sleep` );

		}



		// process outbound messages
		const outMessages = this.outMessages;

		this.outMessages = {};

		const global = outMessages.global || [];
		const sent = {};

		for ( const id in outMessages ) {

			const message = JSON.stringify( global.length ? outMessages[ id ].concat( global ) : outMessages[ id ] );

			if ( ! ( id in this.infoById ) ) {

				id !== 'global' && console.log( `WARN: message to unknown Client @${id} <- ${message}` );
				continue;

			}

			this.infoById[ id ].ws.send( message );
			console.log( `@${id} <- ${message}` );
			sent[ id ] = null;

		}

		if ( ! global.length ) return this.scheduleNextUpdate();

		const message = JSON.stringify( global );
		console.log( `@global <- ${message}` );

		for ( const id in this.infoById ) {

			if ( id in sent ) continue;
			this.infoById[ id ].ws.send( message );

		}

		this.scheduleNextUpdate();

	}

	send( event, message, to = 'global' ) {

		if ( event ) {

			message = Object.assign( {}, message );
			message.event = event;

		}

		( to in this.outMessages ? this.outMessages[ to ] : ( this.outMessages[ to ] = [] ) ).push( message );

	}

	onNewEntity( entity ) {

	}


	onConnect( client ) {

		for ( let client of Entity.byType[ 'Client' ] ) {

			this.send( null, client, client.id );

		}

	}


	onDisconnect( client ) {

		delete this.clientBySecret[ this.infoById[ client.id ].secret ];
		delete this.infoById[ client.id ];
		console.log( `${client.id} disconnected.` );
		this.send( 'Disconnect', { id: client.id } );

	}

	onFlagAdmin( message ) {

		if ( message.from in serverInstance.adminClientById )
			delete serverInstance.adminClientById[ message.from ];

		if ( ! ( 'secret' in message ) ) {

			const msg = `WARN: FlagAdmin message ${JSON.stringify( message )} does not provide 'secret'`;

			this.send( 'Message', { FlagAdminError: msg }, message.from );

			return console.log( msg );

		}

		if ( message.secret !== process.env.ADMIN_SECRET ) {

			const msg = `WARN: FlagAdmin message ${JSON.stringify( message )} has invalid 'secret'`;

			this.send( 'Message', { FlagAdminError: msg }, message.from );

			return console.log( msg );

		}

		serverInstance.adminClientById[ message.from ] = Entity.byId[ message.from ];

		this.send( 'Message', { FlagAdminSuccess: true }, message.from );

	}

}

function uuid( bytes = 4, id ) {

	while ( ! id || id in uuid.usedUUIDs ) id = crypto.randomBytes( bytes ).toString( 'hex' );
	return uuid.usedUUIDs[ id ] = id;

}

uuid.usedUUIDs = {};


class Entity {

	constructor( args = {} ) {

		args.type = 'type' in args ? args.type : this.constructor.name;

		this.id = 'id' in args ? args.id : `${args.type}-${uuid()}`;

		Entity.byId[ this.id ] = this;

		// set properties of the new Entity
		for ( const property of Object.keys( args ) ) {

			property !== 'id' && this.setProperty( property, args[ property ] );

		}

		// tell the server instance about this new Entity
		serverInstance.onNewEntity( this );

	}

	setProperty( property, value ) {

		// if no change to property value, do nothing
		if ( this[ property ] === value ) return;

		// if parentId is changing, remove entity from existing parentId list
		if ( property === 'parentId' && this.parentId in Entity.byParentId ) {

			const index = Entity.byParentId[ this.parentId ].indexOf( this );
			if ( index > - 1 ) Entity.byParentId[ this.parentId ].splice( index, 1 );

		}

		// if type is changing, remove entity from existing type:id map
		if ( property === 'type' && this.type in Entity.byType ) {

			const entitiesOfType = Entity.byType[ this.type ];
			const index = entitiesOfType.indexOf( this );

			if ( index > - 1 ) entitiesOfType.splice( index, 1 );

		}

		// create a dirty map if not already marked dirty
		if ( ! ( this.id in Entity.dirtyById ) ) Entity.dirtyById[ this.id ] = {};

		// assign new property value and delta
		this[ property ] = Entity.dirtyById[ this.id ][ property ] = value;

		// if parentId has changed, add entity to parentId list
		if ( property === 'parentId' && this.parentId ) {

			if ( ! ( this.parentId in Entity.byParentId ) ) Entity.byParentId[ this.parentId ] = [];
			Entity.byParentId[ this.parentId ].push( this );

		}

		// if type has changed, add entity to type:id map
		if ( property === 'type' ) {

			if ( ! ( this.type in Entity.byType ) ) Entity.byType[ this.type ] = [];
			const byType = Entity.byType[ this.type ];
			const index = byType.indexOf( this.type );
			if ( index === - 1 ) byType.push( this );

		}

	}

	purge() {

		delete Entity.byId[ this.id ];

		if ( this.id in Entity.byParentId ) {

			for ( let entity in Entity.byParentId[ this.id ] ) {

				entity.setProperty( 'parentId', this.parentId );

			}

			delete Entity.byParentId[ this.id ];

		}

		const entitiesOfType = Entity.byType[ this.type ];
		const index = entitiesOfType.indexOf( this );
		if ( index > - 1 ) entitiesOfType.splice( index, 1 );

		delete Entity.dirtyById[ this.id ];

		serverInstance.send( 'Purge', { id: this.id } );

		console.log( `${this.id} purged.` );

	}

	onUpdate() {

	}

}

Entity.byId = {};
Entity.byParentId = {};
Entity.byType = {};
Entity.dirtyById = {};


class Client extends Entity {

	constructor() {

		super();

	}

	disconnect() {

		serverInstance.onDisconnect( this );
		this.purge();

	}

	onMessage( message ) {

		serverInstance.send( 'Message', message, this.id );

	}

	onSetProperty( message ) {

		if ( ! ( 'id' in message ) ) return console.log( `SetProperty message missing 'id'` );
		if ( ! ( 'property' in message ) ) return console.log( `SetProperty message missing 'property'` );
		if ( ! ( message.id in Entity.byId ) ) return console.log( `SetProperty message unknown Entity '${message.id}'` );

		Entity.byId[ message.id ].setProperty( message.property, 'value' in message ? message.value : null );

	}

	onDebug() {

		this.disconnect();

	}

}


if ( url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' ) {

	// path of this module matches path of module passed to node process
	// Main ESM module
	console.log( process.env.ADMIN_SECRET );

	new Server( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ], heartbeat: 3333 } );

	serverInstance.run();

}
