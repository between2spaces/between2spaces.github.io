import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import * as url from 'node:url';


export default class Server {

	constructor( args ) {

		this.type = 'server';

		this.allowedOrigins = args.allowedOrigins ? args.allowedOrigins : [ 'http://localhost:8000' ];
		this.heartbeat = 'heartbeat' in args ? args.heartbeat : 3333;
		this.clientTimeout = 'clientTimeout' in args ? args.clientTimeout : 15000;

		this.entityById = {};
		this.entityMetadataById = {};
		this.entitiesByParentId = {};
		this.entitiesByType = {};
		this.dirtyEntityById = {};

		this.clientMetadataById = {}; // { ws, secret, client, lastseen }
		this.clientBySecret = {};

		this.messages = [];
		this.entityUpdateSchedule = [];
		this.listeners = {};
		this.callbacks = {};

		this.listen( 'server', 'error', ( server, message ) => console.log( message.data ) );

		this.listen( 'server', 'create', ( server, message ) => {

			const properties = message.data;
			const type = 'type' in properties ? properties.type : 'entity';
			const id = 'id' in properties ? properties.id : `${type}-${Server.uuid()}`;

			if ( id in serverInstance.entityById ) return serverInstance.message( { type: 'error', data: { error: `Error creating new Entity; id '${id}' already exists.` } } );

			const entity = serverInstance.entityById[ id ] = { id };

			serverInstance.entityMetadataById[ id ] = { lastupdate: Date.now() };

			serverInstance.setProperty( entity, 'type', type );

			for ( const property of Object.keys( properties ) ) {

				property !== 'id' && property !== 'type' && serverInstance.setProperty( entity, property, properties[ property ] );

			}

			serverInstance.scheduleEntityUpdate( entity, 0 );

			serverInstance.response( message, entity );

		} );

		this.listen( 'server', 'response', ( server, message ) => {

			if ( ! ( message.data.callback in this.callbacks ) )
				return console.log( `Response ${JSON.stringify( message )} recieved, but no matching callback '${message.data.callback}'` );

			this.callbacks[ message.data.callback ]( message.data.returnvalue );

		} );

		this.listen( 'entity', 'update', ( entity, message ) => {} );
		this.listen( 'client', 'connected', ( client, message ) => {

			this.call( 'client', 'message', client, message );

		} );
		this.listen( 'client', 'disconnected', ( entity ) => {} );
		this.listen( 'client', 'message', ( client, message ) => {

			const string = JSON.stringify( message );
			console.log( `${client.id}@ws <- ${string}` );
			serverInstance.clientMetadataById[ client.id ].ws.send( string );

		} );
		this.listen( 'client', 'undefined', ( client, message ) => {

			this.call( 'client', 'message', client, message );

		} );

		serverInstance = this;

	}


	run() {

		const wss = new WebSocketServer( {
			port: process.env.PORT,
			verifyClient: info => this.allowedOrigins.indexOf( info.req.headers.origin ) > - 1
		} );

		wss.on( 'connection', async ( ws, req ) => {

			let secret = /[?&]{1}secret=([0-9a-fA-F]{8})/.exec( req.url );
			let client;

			if ( secret && secret[ 1 ] in this.clientBySecret ) {

				client = this.clientBySecret[ secret = secret[ 1 ] ];

			} else {

				client = this.createEntity( { type: 'client' } );
				//client = await this.message( { fn: 'create', params: { type: 'tree' } } );
				secret = Server.uuid();

			}

			this.clientMetadataById[ client.id ] = { ws, secret, client, lastseen: Date.now() };

			this.message( { to: client.id, type: 'connected', data: { id: client.id, secret, clientTimeout: this.clientTimeout, serverHeartbeat: this.heartbeat } } );

			if ( secret in this.clientBySecret ) {

				console.log( `${client.id} reconnected` );

			} else {

				console.log( `${client.id} connected` );
				this.clientBySecret[ secret ] = client;

			}

			// tell the connected Client about all Entities
			for ( let id in this.entityById ) {

				this.message( { to: client.id, type: 'entity', data: this.entityById[ id ] } );

			}


			ws.on( 'message', data => {

				try {

					if ( ! ( client.id in this.clientMetadataById ) ) return ws.close();

					this.clientMetadataById[ client.id ].lastseen = Date.now();

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

		this.message( { type: 'run' } );

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
	 */
	update() {

		//
		// disconnect clients we haven't heard from in awhile
		//
		const timestamp = Date.now();
		const timeout = timestamp - this.clientTimeout;

		for ( let id in this.clientMetadataById ) {

			const clientMetadata = this.clientMetadataById[ id ];

			if ( clientMetadata.lastseen < timeout ) {

				this.message( { type: 'disconnected', data: { id } } );
				this.destroy( clientMetadata.client );
				console.log( `${id} disconnected.` );

			}

		}

		//
		// process messages
		//
		const messages = this.messages;
		this.messages = [];
		for ( const message of messages ) this.message( message );


		//
		// broadcast entity deltas and call entity update
		//
		const dirtyById = this.dirtyEntityById;

		this.dirtyEntityById = {};

		for ( const id in dirtyById ) {

			const delta = dirtyById[ id ];

			if ( Object.keys( delta ).length ) {

				delta.id = id;
				this.message( { to: 'type=client', type: 'entity', data: delta } );

			}

		}

		if ( this.entityUpdateSchedule.length ) {

			const dirtyEntityIds = this.entityUpdateSchedule.shift();

			for ( const id in dirtyEntityIds ) {

				this.message( { to: id, type: 'update', data: { timestamp } } );

				this.entityMetadataById[ id ].lastupdate = timestamp;

			}

		}

		this.requestUpdate( timestamp );

	}


	scheduleEntityUpdate( entity, seconds = 0 ) {

		const interval = Math.ceil( ( seconds * 1000 ) / this.heartbeat );

		while ( interval >= this.entityUpdateSchedule.length ) this.entityUpdateSchedule.push( [] );

		this.entityUpdateSchedule[ interval ][ entity.id ] = {};

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

		delete this.entityById[ entity.id ];
		delete this.entityMetadataById[ entity.id ];

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

		if ( entity.type === 'client' ) {

			delete this.clientBySecret[ this.clientMetadataById[ entity.id ].secret ];
			delete this.clientMetadataById[ entity.id ];

		}

		console.log( `${entity.id} destroyed.` );

		this.message( { to: 'type=client', type: 'destroy', data: { id: entity.id } } );

	}

	/**
	 * Registers a handler for the specifed Entity type and function name.
	 *
	 * @param entityType The Entity Type to associate the handler with
	 * @param messageType The message type
	 * @param handler The handler to call
	 */
	listen( entityType, messageType, handler ) {

		if ( ! ( entityType in this.listeners ) ) this.listeners[ entityType ] = {};

		if ( ! ( messageType in this.listeners[ entityType ] ) ) this.listeners[ entityType ][ messageType ] = [];

		this.listeners[ entityType ][ messageType ].push( handler );

	}


	async call( entityType, messageType, entity, message ) {

		const results = [];

		for ( let handler of this.listeners[ entityType ][ messageType ] ) {

			results.push( await handler( entity, message ) );

		}
		
		return results;

	}


	/**
	 * Calls the matching listeners.
	 *
	 * @param message A message object
	 */
	message( message ) {

		return new Promise((resolve, reject) => {

		if ( ! ( 'to' in message ) ) message.to = 'server';

		let targets;

		if ( message.to === 'server' ) {

			targets = [ serverInstance ];

		} else if ( message.to.startsWith( 'type=' ) ) {

			const targetType = message.to.replace( 'type=', '' );

			if ( ! ( targetType in this.entitiesByType ) )
				return this.message( 'server', from, 'error', { error: `Message to '${to}' has no targets`, message } );

			targets = this.entitiesByType[ targetType ];

		} else {

			if ( ! ( to in this.entityById ) )
				return this.message( 'server', from, 'error', { error: `Message to '${to}' has no targets`, message } );

			targets = [ this.entityById[ to ] ];

		}


		for ( let target of targets ) {

			let targetType = target.type;

			if ( ! ( targetType in this.listeners ) && 'undefined' in this.listeners )
				targetType = 'undefined';

			if ( ! ( targetType in this.listeners ) )
				return this.message( 'server', from, 'error', { error: `Unhandled target type '${target.type}' in message`, message } );

			if ( ! ( type in this.listeners[ targetType ] ) ) {

				if ( 'undefined' in this.listeners[ targetType ] )
					return this.message( from, target.id, 'undefined', message, true );

				return this.message( 'server', from, 'error', { error: `Unhandled message type '${type}' in message`, message } );

			}

			this.call( targetType, type, target, message );

		}

	}

	response( message, returnvalue ) {

		if ( message.callback )
			this.message( message.to, message.from, 'response', { callback: message.callback, returnvalue } );

	}

}


Server.uuid = () => {

	let id;
	while ( ! id || id in Server.usedUUIDs ) id = crypto.randomUUID().split( '-' )[ 0 ];//crypto.randomBytes( bytes ).toString( 'hex' );
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
