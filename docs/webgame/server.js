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

					if ( ! ( client.id in this.infoById ) )
						return ws.send( '{ event: "Reconnect" }' );

					this.infoById[ client.id ].lastseen = Date.now();

					console.log( `${client.id} -> ${data}` );

					if ( `${data}` === 'undefined' ) return;

					let messages = JSON.parse( data );

					messages = ( messages.constructor !== Array ) ? [ messages ] : messages;

					for ( const message of messages ) {

						this.inMessages.push( { message: message, from: client.id } );

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

		if ( ! ( 'Client' in Entity.byTypeId ) )
			return this.scheduleNextUpdate();

		const clients = Entity.byTypeId[ 'Client' ];

		// disconnect clients we haven't heard from in awhile
		const timeout = this.lastUpdate - this.clientTimeout;

		for ( const id in clients ) {

			if ( this.infoById[ id ].lastseen < timeout ) {

				clients[ id ].disconnect();

			}

		}

		// process inbound messages
		const inMessages = this.inMessages;

		this.inMessages = [];

		for ( const message of inMessages ) {

			const onevent = `on${message.message.event}`;
			const client = Entity.byId[ message.from ];

			if ( onevent in client ) {

				client[ onevent ]( message.message );

			} else {

				console.log( `<client>.${onevent}( message ) not found` );

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

			if ( ! ( id in clients ) ) {

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

		const clients = Entity.byTypeId[ 'Client' ];

		for ( let id in clients ) {

			this.send( null, clients[ id ], client.id );

		}

	}


	onDisconnect( client ) {

		delete this.clientBySecret[ this.infoById[ client.id ].secret ];
		delete this.infoById[ client.id ];
		console.log( `${client.id} disconnected.` );
		this.send( 'Disconnect', { id: client.id } );

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
		if ( property === 'type' && this.type in Entity.byTypeId && this.id in Entity.byTypeId[ this.type ] )
			delete Entity.byTypeId[ this.type ][ this.id ];

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

			if ( ! ( this.type in Entity.byTypeId ) ) Entity.byTypeId[ this.type ] = {};
			Entity.byTypeId[ this.type ][ this.id ] = this;

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

		delete Entity.byTypeId[ this.type ][ this.id ];
		delete Entity.dirtyById[ this.id ];

		serverInstance.send( 'Purge', { id: this.id } );

		console.log( `${this.id} purged.` );

	}

	onUpdate() {

	}

}

Entity.byId = {};
Entity.byParentId = {};
Entity.byTypeId = {};
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

		let to = 'global';

		if ( 'to' in message ) {

			to = message.to;
			delete message[ 'to' ];

		}

		serverInstance.send( 'Message', message, to );

	}

	onSetProperty( message ) {

		if ( ! ( 'id' in message ) ) return console.log( `SetProperty message missing 'id'` );
		if ( ! ( 'property' in message ) ) return console.log( `SetProperty message missing 'property'` );
		if ( ! ( message.id in Entity.byId ) ) return console.log( `SetProperty message unknown Entity '${message.id}'` );

		Entity.byId[ message.id ].setProperty( message.property, 'value' in message ? message.value : null );

	}

}


if ( url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' ) {

	// path of this module matches path of module passed to node process
	// Main ESM module

	new Server( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ], heartbeat: 3333 } );

	serverInstance.run();

}
