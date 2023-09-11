import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import * as url from 'node:url';



export class Server {

	constructor( args ) {

		this.allowedOrigins = args.allowedOrigins ? args.allowedOrigins : [ 'http://localhost:8000' ];
		this.heartbeat = 'heartbeat' in args ? args.heartbeat : 666;
		this.clientTimeout = 'clientTimeout' in args ? args.clientTimeout : 10000;

		this.entityById = {}; // { entity, children }
		this.entitiesByType = {};
		this.dirtyEntityById = {};

		this.clientById = {}; // { ws, secret, client, lastseen }
		this.clientBySecret = {};

		this.messages = [];

		this.listenersByType = {};

		this.listen( 'Entity', 'update', entity => {} );
		this.listen( 'Client', 'update', client => this.call( 'server', 'Entity', client, 'update' ) );
		this.listen( 'Client', 'message', ( client, message ) => {

			const string = JSON.stringify( message );
			console.log( `${this.id}@ws <- ${string}` );
			serverInstance.clientById[ client.id ].ws.send( string );

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

				client = this.createEntity( { type: 'Client' } );
				secret = Server.uuid();

			}

			this.clientById[ client.id ] = { ws, secret, client, lastseen: Date.now() };

			this.send( {
				from: 'server',
				to: client.id,
				_: 'connected',
				id: client.id,
				secret: secret,
				clientTimeout: this.clientTimeout,
				serverHeartbeat: this.heartbeat
			} );

			if ( secret in this.clientBySecret ) {

				console.log( `${client.id} reconnected` );

			} else {

				console.log( `${client.id} connected` );
				this.clientBySecret[ secret ] = client;

			}

			this.onConnected( client );

			// tell the connected Client about all Entities
			for ( let id in this.entityById ) {

				this.send( { from: 'server', to: client.id, _: 'entity', entity: this.entityById[ id ] } );

			}


			ws.on( 'message', data => {

				try {

					if ( ! ( client.id in this.clientById ) ) return ws.close();

					this.clientById[ client.id ].lastseen = Date.now();

					if ( `${data}` === 'undefined' ) {

						return console.log( "ws.on( 'message', undefined ) received" );

					}

					let msgs = JSON.parse( data );

					msgs = ( msgs.constructor !== Array ) ? [ msgs ] : msgs;

					for ( const msg of msgs ) {

						msg.from = client.id;

						console.log( `-> ${JSON.stringify( msg )}` );

						this.send( msg );

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

		// disconnect clients we haven't heard from in awhile
		const timeout = timestamp - this.clientTimeout;

		let client;

		for ( let id of this.clientById ) {

			client = this.clientById[ id ];

			if ( client.lastseen < timeout ) {

				delete this.clientBySecret[ client.secret ];
				delete this.clientById[ id ];
				console.log( `${client.id} disconnected.` );
				this.send( {
					from: 'server',
					to: id,
					_: 'disconnected'
				} );
				this.onDisconnected( client );

			}

		}

		// process messages
		const msgs = this.messages;

		this.messages = [];

		for ( const msg of msgs ) {

			const fn = `_${msg.fn}`;

			let to = 'server';

			if ( 'to' in msg && msg.to ) {

				to = msg.to;
				delete msg[ 'to' ];

			}

			let targets;

			if ( to === 'server' ) {

				targets = [ serverInstance ];

			} else if ( to.startsWith( 'type=' ) ) {

				const type = to.replace( 'type=', '' );

				if ( ! ( type in this.entitiesByType ) ) {

					this.send( {
						from: 'server',
						to: msg.from,
						_: 'log',
						level: 'error',
						value: `Message to '${to}' has no targets`
					} );
					continue;

				}

				targets = this.entitiesByType[ type ];

			} else {

				if ( ! ( to in this.entityById ) ) {

					this.send( {
						from: 'server',
						to: msg.from,
						_: 'log',
						level: 'error',
						value: `Message to '${to}' has no targets`
					} );
					continue;

				}

				targets = [ Entity.byId[ to ] ];

			}


			for ( let target of targets ) {

				target[ _ in target ? _ : '_undefined' ]( msg );

				this.call( 'server', target.type, target, 'update' );

			}

		}

		// broadcast entity deltas and call entity update
		const dirtyById = this.dirtyEntityById;

		this.dirtyEntityById = {};

		for ( const id in dirtyById ) {

			const delta = dirtyById[ id ];

			if ( Object.keys( delta ).length ) {

				delta.id = id;
				this.send( { from: 'server', to: 'type=Client', _: 'entity', entity: delta } );

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

		entity.type = 'type' in properties ? properties.type : 'Entity';
		entity.id = 'id' in properties ? properties.id : `${entity.type}-${Server.uuid()}`;

		this.entityById[ entity.id ] = { entity, children: [] };

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
		if ( property === 'parentId' && entity.parentId in this.entityById ) {

			const siblings = this.entityById[ entity.parentId ].children;
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
		if ( property === 'parentId' && entity.parentId in this.entityById ) {

			this.entityById[ entity.parentId ].children.push( entity );

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
	purge( entity ) {

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

		this.send( {
			from: 'server',
			to: 'type=Client',
			_: 'purge',
			id: this.id
		} );

		console.log( `${this.id} purged.` );

		this.call( 'server', entity, 'onPurged' );

	}

	/**
	 * Queues the specified message for delivery.
	 *
	 * @param message A message object
	 */
	send( message ) {

		if ( ! ( 'from' in message ) )
			return console.log( `Error: server.send past ${JSON.stringify( message )} with no 'from'` );

		if ( ! ( 'to' in message ) ) {

			message.value = `server.send past ${JSON.stringify( message )} with no 'to'`;
			message.to = message.from;
			message._ = 'log';
			message.level = 'error';

		}

		this.messages.push( message );

	}

	/**
	 * Registers a handler for the specifed Entity type and function name.
	 *
	 * @param entityType The Entity Type to associate the handler with
	 * @param functionName The function name
	 * @param fucntionHandler The handler to call
	 */
	listen( entityType, functionName, functionHandler ) {

		if ( ! ( entityType in this.listenersByType ) ) this.listenersByType[ entityType ] = {};

		this.listenersByType[ entityType ][ functionName ] = functionHandler;

	}

	/**
	 * Calls the specified function on the specified target if defined, otherwise report an error.
	 *
	 * @param from The identity of the sender
	 * @param targetObj The target object
	 * @param functionName The name of the function on the object to call
	 * @param arg The argument object to pass to the function
	 *
	 * @returns Return value of function
	 */
	call( from, targetObj, functionName, arg ) {

		if ( ! ( targetObj.type in this.listenersByType ) || ! ( functionName in this.listenersByType[ targetObj.type ] ) ) {

			this.send( {
				from: 'server',
				to: from,
				_: 'log',
				level: 'error',
				value: `Unhandled call <${targetObj.type}>.${functionName}(...)`
			} );

		} else {

			return this.listenersByType[ targetObj.type ][ functionName ]( arg );

		}

	}

	/**
	 * Called when a Client connects to the server.
	 *
	 * @param client The connected Client
	 */
	onConnected( client ) {

	}

	/**
	 * Called when a Client disconnects from the server.
	 *
	 * @param client The disconnected Client
	 */
	onDisconnected( client ) {

	}

	_log( msg ) {

		console.log( msg );

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

