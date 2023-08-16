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
		this.clientLastseen = {};
		this.clientBySecret = {};
		this.wsById = {};
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
				this.send( null, client, client.id );

			} else {

				client = new Client();
				secret = uuid();

			}

			this.clientLastseen[ client.id ] = Date.now();
			this.wsById[ client.id ] = ws;

			console.log( `${client.id} connected.` );

			ws.on( 'message', data => {

				try {

					this.clientLastseen[ client.id ] = Date.now();
					console.log( `${client.id} -> ${data}` );
					if ( `${data}` === 'undefined' ) return;
					const messages = JSON.parse( data );
					for ( const message of ( messages.constructor !== Array ) ? [ messages ] : messages )
						this.inMessages.push( { message: message, from: client.id } );

				} catch ( e ) {

					console.error( e );

				}

			} );

			this.send( 'Connect', { id: client.id, secret: secret, clientTimeout: this.clientTimeout, serverHeartbeat: this.heartbeat }, client.id );
			this.send( 'Connect', client );

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

		setInterval( () => {

			if ( ! ( 'Client' in Entity.byTypeId ) ) return;

			const clients = Entity.byTypeId[ 'Client' ];

			// disconnect clients we haven't heard from in awhile
			const timeout = Date.now() - serverInstance.clientTimeout;
			for ( const id in clients ) if ( serverInstance.clientLastseen[ id ] < timeout ) clients[ id ].disconnect();

			// process inbound messages
			const inMessages = serverInstance.inMessages;

			serverInstance.inMessages = [];

			for ( const message of inMessages ) {

				const onevent = `on${message.message.event}`;

				if ( onevent in this ) {

					this[ onevent ]( message.message, message.from );

				} else {

					console.log( `${onevent}( message, from ) not found` );

				}

			}

			// process outbound messages
			const outMessages = serverInstance.outMessages;

			serverInstance.outMessages = {};

			const global = outMessages.global || [];
			const sent = {};

			for ( const id in outMessages ) {

				const message = JSON.stringify( global.length ? outMessages[ id ].concat( global ) : outMessages[ id ] );

				if ( ! ( id in clients ) ) {

					id !== 'global' && console.log( `WARN: disconnected @${id} <- ${message}` );
					continue;

				}

				serverInstance.wsById[ id ].send( message );
				console.log( `@${id} <- ${message}` );
				sent[ id ] = null;

			}

			if ( ! global.length ) return;

			const message = JSON.stringify( global );
			console.log( `@global <- ${message}` );

			for ( const id in serverInstance.wsById ) {

				if ( id in sent ) continue;
				serverInstance.wsById[ id ].send( message );

			}

		}, this.heartbeat );

	}

	send( event, message, to = 'global' ) {

		if ( event ) message.event = event;
		( to in this.outMessages ? this.outMessages[ to ] : ( this.outMessages[ to ] = [] ) ).push( message );

	}

	onNewEntity( entity ) {

	}


	onConnect( client ) {

	}


	onDisconnect( client ) {

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
		for ( const property of Object.keys( args ) ) if ( property !== 'id' ) this.setProperty( property, args[ property ] );

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

	update() {
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

		delete serverInstance.clientLastseen[ this.id ];
		delete serverInstance.wsById[ this.id ];
		console.log( `${this.id} disconnected.` );
		serverInstance.send( 'Disconnect', { id: this.id } );
		this.purge();

	}

}


if ( url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' ) {

	// path of this module matches path of module passed to node process
	// Main ESM module

	new Server( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ], heartbeat: 3333 } );

	serverInstance.run();

}
