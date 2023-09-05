import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import * as url from 'node:url';

export let server;

export class Entity {

	constructor( args = {} ) {

		args.type = 'type' in args ? args.type : this.constructor.name;

		this.id = 'id' in args ? args.id : `${args.type}-${Server.uuid()}`;

		Entity.byId[ this.id ] = this;

		// set properties of the new Entity
		for ( const property of Object.keys( args ) ) {

			property !== 'id' && this.setProperty( property, args[ property ] );

		}

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

		// assign property value and delta
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

		server.send( {
			from: 'server',
			to: 'type=Client',
			_: 'purge',
			id: this.id
		} );

		console.log( `${this.id} purged.` );

	}

	update() {

	}

}

Entity.byId = {};
Entity.byParentId = {};
Entity.byType = {};
Entity.dirtyById = {};





export class Client extends Entity {

	constructor( args ) {

		super( args );

	}

	disconnect() {

		//this._send( { from: 'server', to: this.id, _: 'disconnected', id: this.id } );

		server.onDisconnect( this );

		this.purge();

	}

	update() {

		super.update();

	}

	_send( msg ) {

		const string = JSON.stringify( msg );
		console.log( `${this.id}@ws <- ${string}` );
		server.infoById[ this.id ].ws.send( string );

	}

	_undefined( msg ) {

		this._send( msg );

	}

	_setProperty( msg ) {

		let err;

		if ( ! ( 'property' in msg ) ) err = `${msg.to}._setProperty( ${msg} ) missing 'property'`;

		if ( err ) return server.send( {
			from: this.id,
			to: msg.from,
			_: 'error',
			message: err
		} );

		this.setProperty( msg.property, 'value' in msg ? msg.value : null );

	}

	_debug() {

		this.disconnect();

	}

}





export class Server {

	constructor( args ) {

		this.allowedOrigins = args.allowedOrigins ? args.allowedOrigins : [ 'http://localhost:8000' ];
		this.heartbeat = 'heartbeat' in args ? args.heartbeat : 3333;
		this.clientTimeout = 'clientTimeout' in args ? args.clientTimeout : 10000;
		this.clientBySecret = {};
		this.adminClientById = {};
		this.infoById = {};
		this.messages = [];

		server = this;

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
				secret = Server.uuid();

			}

			ws.on( 'message', data => {

				try {

					if ( ! ( client.id in this.infoById ) ) return ws.close();

					this.infoById[ client.id ].lastseen = Date.now();

					if ( `${data}` === 'undefined' ) return;

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

			this.infoById[ client.id ] = { ws, secret, client, lastseen: Date.now() };

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

			this.onConnect( client );

		} );

	}

	run() {

		console.log();
		console.log( `Server listening on port ${process.env.PORT}` );
		console.log();
		console.log( `allowedOrigins: ${server.allowedOrigins}` );
		console.log( `serverHeartbeat: ${server.heartbeat}` );
		console.log( `clientTimeout: ${server.clientTimeout}` );
		console.log();

		this.scheduleNextUpdate();

	}

	scheduleNextUpdate() {

		let timeout = Date.now() - this.lastUpdate;

		timeout = timeout > this.heartbeat ? 0 : this.heartbeat - timeout;

		console.log( `next update in ${timeout}ms...` );

		setTimeout( () => {

			this.lastUpdate = Date.now();
			server.update();

		}, timeout );

	}

	update() {

		if ( ! ( 'Client' in Entity.byType ) )
			return this.scheduleNextUpdate();

		// disconnect clients we haven't heard from in awhile
		const timeout = this.lastUpdate - this.clientTimeout;

		for ( let client of Entity.byType[ 'Client' ] ) {

			this.infoById[ client.id ].lastseen < timeout && client.disconnect();

		}

		// process messages
		const msgs = this.messages;

		this.messages = [];

		for ( const msg of msgs ) {

			const _ = `_${msg._}`;

			let to = 'server';

			if ( 'to' in msg && msg.to ) {

				to = msg.to;
				delete msg[ 'to' ];

			}

			let targets;

			if ( to === 'server' ) {

				targets = [ server ];

			} else if ( to.startsWith( 'type=' ) ) {

				const type = to.replace( 'type=', '' );

				if ( ! ( type in Entity.byType ) ) {

					this.send( {
						from: 'server',
						to: msg.from,
						_: 'warn',
						value: `Message to '${to}' has no targets`
					} );
					continue;

				}

				targets = Entity.byType[ type ];

			} else {

				if ( ! ( to in Entity.byId ) ) {

					this.send( {
						from: 'server',
						to: msg.from,
						_: 'warn',
						value: `Message to '${to}' has no targets`
					} );
					continue;

				}

				targets = [ Entity.byId[ to ] ];

			}


			for ( let target of targets ) {

				target[ _ in target ? _ : '_undefined' ]( msg );

			}

		}


		// broadcast entity deltas and call entity update
		const dirtyById = Entity.dirtyById;

		Entity.dirtyById = {};

		for ( const id in dirtyById ) {

			const delta = dirtyById[ id ];

			if ( Object.keys( delta ).length ) {

				delta.id = id;
				this.send( { from: 'server', to: 'type=Client', _: 'entity', entity: delta } );

			}

			Entity.byId[ id ].update();

			if ( ! ( id in Entity.dirtyById ) ) console.log( `${id} went to sleep` );

		}

		this.scheduleNextUpdate();

	}

	onConnect( client ) {

		// broadcast all Entities to message.from
		for ( let id in Entity.byId ) {

			this.send( { from: 'server', to: client.id, _: 'entity', entity: Entity.byId[ id ] } );

		}

	}

	onDisconnect( client ) {

		delete this.clientBySecret[ this.infoById[ client.id ].secret ];
		delete this.infoById[ client.id ];
		console.log( `${client.id} disconnected.` );
		this.send( {
			from: 'server',
			to: client.id,
			_: 'disconnected'
		} );

	}

	send( msg ) {

		if ( ! ( 'from' in msg ) ) return console.log( `Error: server.send past ${JSON.stringify( msg )} with no 'from'` );

		if ( ! ( 'to' in msg ) ) {

			msg.value = `server.send past ${JSON.stringify( msg )} with no 'to'`;
			msg.to = msg.from;
			msg._ = 'err';

		}

		this.messages.push( msg );

	}

	_undefined( msg ) {

		try {

			server.send( {
				from: 'server',
				to: msg.from,
				_: 'warn',
				value: `Unhandled message '${JSON.stringify( msg )}'`
			} );

		} catch ( e ) {

			console.log( e.message );

			console.log( msg );

		}

	}

}


Server.uuid = ( bytes = 4, id ) => {

	while ( ! id || id in Server.usedUUIDs ) id = crypto.randomBytes( bytes ).toString( 'hex' );
	return Server.usedUUIDs[ id ] = id;

};


Server.usedUUIDs = {};





if ( url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' ) {

	// Main ESM module - path of this module matches path of module passed to node process

	( new Server( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ], heartbeat: 3333 } ) ).run();

}
