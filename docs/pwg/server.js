import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import * as url from 'node:url';


export default class Server {

	constructor( args ) {

		this.type = 'server';

		this.allowedOrigins = args.allowedOrigins ? args.allowedOrigins : [ 'http://localhost:8000' ];
		this.heartbeat = 'heartbeat' in args ? args.heartbeat : 3333;
		this.clientTimeout = 'clientTimeout' in args ? args.clientTimeout : 10000;

		this.entityById = {};
		this.entitiesByParentId = {};
		this.entitiesByType = {};
		this.dirtyEntityById = {};

		this.clientById = {}; // { ws, secret, client, lastseen }
		this.clientBySecret = {};

		this.messages = [];

		this.listenersByEntityType = {};

		this.listen( 'server', 'error', ( server, message ) => console.log( message.data ) );
		this.listen( 'entity', 'connected', ( entity ) => {} );
		this.listen( 'entity', 'update', ( entity ) => {} );
		this.listen( 'client', 'update', ( client ) => this.call( 'server', 'entity', client, 'update' ) );
		this.listen( 'client', 'message', ( client, message ) => {

			const string = JSON.stringify( message );
			console.log( `${client.id}@ws <- ${string}` );
			serverInstance.clientById[ client.id ].ws.send( string );

		} );
		this.listen( 'client', 'undefined', ( client, message ) => {

			this.listenersByEntityType[ 'client' ][ 'message' ]( client, message );

		} );

		serverInstance = this;

	}

	run() {

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

				client = this.createEntity( { type: 'client' } );
				secret = Server.uuid();

			}

			this.clientById[ client.id ] = { ws, secret, client, lastseen: Date.now() };

			this.message( 'connected', 'server', client.id, { id: client.id, secret, clientTimeout: this.clientTimeout, serverHeartbeat: this.heartbeat } );

			if ( secret in this.clientBySecret ) {

				console.log( `${client.id} reconnected` );

			} else {

				console.log( `${client.id} connected` );
				this.clientBySecret[ secret ] = client;

			}

			// tell the connected Client about all Entities
			for ( let id in this.entityById ) {

				this.message( 'entity', 'server', client.id, this.entityById[ id ] );

			}


			ws.on( 'message', data => {

				try {

					if ( ! ( client.id in this.clientById ) ) return ws.close();

					this.clientById[ client.id ].lastseen = Date.now();

					if ( `${data}` === 'undefined' ) return console.log( "ws.on( 'message', undefined ) received" );

					let messages = JSON.parse( data );

					messages = ( messages.constructor !== Array ) ? [ messages ] : messages;

					for ( let message of messages ) {

						message.from = client.id;

						console.log( `-> ${JSON.stringify( message )}` );

						this.messages.push( message );

					}

				} catch ( e ) {

					console.error( e );

				}

			} );

		} );

		this.requestUpdate();

	}

	/**
	 * Tells the server to schedule another update.
	 *
	 * @params timestampe <milliseconds elapsed since the epoch>
	 */
	requestUpdate( timestamp = Date.now() ) {

		let timeout = Date.now() - timestamp;

		timeout = timeout > this.heartbeat ? 0 : this.heartbeat - timeout;

		console.log( `next update in ${timeout}ms...` );

		setTimeout( () => serverInstance.update( Date.now() ), timeout );

	}

	/**
	 * Updates the state of server.
	 *
	 * Stale Clients will be disconnected, queued messages will be delivered,
	 * Entity delta's will be broadcast, dirty Entities will be updated.
	 *
	 * @param timestamp <milliseconds elapsed since the epoch>
	 */
	update( timestamp ) {

		//
		// disconnect clients we haven't heard from in awhile
		//
		const timeout = timestamp - this.clientTimeout;

		for ( let id in this.clientById ) {

			let client = this.clientById[ id ];

			if ( client.lastseen < timeout ) {

				delete this.clientBySecret[ client.secret ];
				delete this.clientById[ id ];
				console.log( `${client.id} disconnected.` );
				this.message( 'disconnected', 'server', id );

			}

		}

		//
		// process messages
		//
		const messages = this.messages;
		this.messages = [];
		for ( const message of messages ) this.perform( message );


		//
		// broadcast entity deltas and call entity update
		//
		const dirtyById = this.dirtyEntityById;

		this.dirtyEntityById = {};

		for ( const id in dirtyById ) {

			const delta = dirtyById[ id ];

			if ( Object.keys( delta ).length ) {

				delta.id = id;
				this.message( 'entity', 'server', 'type=client', delta );

			}

			this.entityById[ id ].entity.update();

			if ( ! ( id in this.dirtyEntityById ) ) console.log( `${id} went to sleep` );

		}

		this.requestUpdate( timestamp );

	}

	/**
	 * Creates a new Entity with the provided properties.
	 *
	 * @params properties object containing the properties you want to apply
	 *
	 * @returns The new Entity
	 */
	createEntity( properties = {} ) {

		const entity = {};

		entity.type = 'type' in properties ? properties.type : 'entity';
		entity.id = 'id' in properties ? properties.id : `${entity.type}-${Server.uuid()}`;

		this.entityById[ entity.id ] = entity;

		for ( const property of Object.keys( properties ) ) {

			property !== 'id' && this.setProperty( entity, property, properties[ property ] );

		}

		return entity;

	}

	/**
	 * Assigns a property and value to an Entity.
	 *
	 * @param entity The Entity to assign the property to
	 * @param property The property to assign
	 * @param value The value of the property
	 *
	 * @returns the new property value
	 */
	setProperty( entity, property, value ) {

		// if no change to property value, do nothing
		if ( entity[ property ] === value ) return entity[ property ];

		//
		// previous value cleanup steps....
		//

		// if parentId is changing, remove entity from existing parents list of children
		if ( property === 'parentId' && entity.parentId in this.entitiesByParentId ) {

			const siblings = this.entitiesByParentId[ entity.parentId ];
			const index = siblings.indexOf( entity );
			if ( index > - 1 ) siblings.splice( index, 1 );

		}

		// if type is changing, remove entity from types map
		if ( property === 'type' && entity.type in this.entitiesByType ) {

			const entitiesOfType = this.entitiesByType[ entity.type ];
			const index = entitiesOfType.indexOf( entity );
			if ( index > - 1 ) entitiesOfType.splice( index, 1 );

		}

		//
		// new value asignment and flag dirty delta
		//

		// create a dirty map if not already marked dirty
		if ( ! ( entity.id in this.dirtyEntityById ) ) this.dirtyEntityById[ entity.id ] = {};

		// assign property value and add to delta
		entity[ property ] = this.dirtyEntityById[ entity.id ][ property ] = value;

		//
		// new value implications...
		//

		// if parentId has changed, add entity to parents list of children
		if ( property === 'parentId' ) {

			if ( ! ( entity.parentId in this.entitiesByParentId ) )
				this.entitiesByParentId[ entity.parentId ] = [];

			this.entitiesByParentId[ entity.parentId ].push( entity );

		}

		// if type has changed, add entity to types map
		if ( property === 'type' ) {

			if ( ! ( entity.type in this.entitiesByType ) ) this.entitiesByType[ entity.type ] = [];
			this.entitiesByType[ entity.type ].push( entity );

		}

		return entity[ property ];

	}

	/**
	 * Deletes the specified Entity and broadcasts its removal to Clients.
	 *
	 * @param entity The Entity to delete
	 */
	destroy( entity ) {

		delete this.entitybyId[ entity.id ];

		if ( entity.id in this.entitiesByParentId ) {

			for ( let child in this.entitiesByParentId[ entity.id ] ) {

				this.setProperty( child, 'parentId', entity.parentId );

			}

			delete this.entitiesByParentId[ entity.id ];

		}

		const entitiesOfType = this.entitiesByType[ entity.type ];
		const index = entitiesOfType.indexOf( entity );

		if ( index > - 1 ) entitiesOfType.splice( index, 1 );

		delete this.dirtyEntityById[ entity.id ];

		console.log( `${this.id} destroyed.` );

		this.message( 'destroy', 'server', 'type=client', { id: this.id } );
		this.message( 'destroy', 'server', entity.id );

	}

	/**
	 * Queues the specified message for delivery.
	 */
	message( type, from, to, data ) {

		const message = { type, from, to };

		if ( data ) message.data = data;

		this.messages.push( message );

	}

	/**
	 * Registers a handler for the specifed Entity type and function name.
	 *
	 * @param entityType The Entity Type to associate the handler with
	 * @param messageType The message type
	 * @param handler The handler to call
	 */
	listen( entityType, messageType, handler ) {

		if ( ! ( entityType in this.listenersByEntityType ) ) this.listenersByEntityType[ entityType ] = {};

		this.listenersByEntityType[ entityType ][ messageType ] = handler;

	}

	/**
	 * Calls the matching listeners.
	 *
	 * @param message A message object
	 */
	perform( message ) {

		const to = ( 'to' in message && message ) ? message.to : 'server';

		let targets;

		if ( to === 'server' ) {

			targets = [ serverInstance ];

		} else if ( to.startsWith( 'type=' ) ) {

			const type = to.replace( 'type=', '' );

			if ( ! ( type in this.entitiesByType ) )
				return this.perform( { type: 'error', from: 'server', to: message.from, data: { error: `Message to '${to}' has no targets`, message } } );

			targets = this.entitiesByType[ type ];

		} else {

			if ( ! ( to in this.entityById ) )
				return this.perform( { type: 'error', from: 'server', to: message.from, data: { error: `Message to '${to}' has no targets`, message } } );

			targets = [ this.entityById[ to ] ];

		}


		for ( let target of targets ) {

			let targetType = target.type;

			if ( ! ( targetType in this.listenersByEntityType ) && 'undefined' in this.listenersByEntityType )
				targetType = 'entity';

			if ( ! ( targetType in this.listenersByEntityType ) )
				return this.perform( { type: 'error', from: 'server', to: message.from, data: { error: `Unhandled target type '${target.type}' in message`, message } } );

			if ( ! ( message.type in this.listenersByEntityType[ targetType ] ) ) {

				if ( 'undefined' in this.listenersByEntityType[ targetType ] )
					return this.listenersByEntityType[ targetType ][ 'undefined' ]( target, message );

				return this.perform( { type: 'error', from: 'server', to: message.from, data: { error: `Unhandled message type '${message.type}' in message`, message } } );

			}

			this.listenersByEntityType[ targetType ][ message.type ]( target, message );

		}

	}

}


Server.uuid = ( bytes = 4, id ) => {

	while ( ! id || id in Server.usedUUIDs ) id = crypto.randomBytes( bytes ).toString( 'hex' );
	return Server.usedUUIDs[ id ] = id;

};


Server.usedUUIDs = {};



export let serverInstance;



if ( url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' ) {

	// Main ESM module - path of this module matches path of module passed to node process

	( new Server( {
		allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ],
		heartbeat: 3333
	} ) ).run();

}
