import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import fs from 'fs';


export default class Server {

	constructor( allowedOrigins = [ 'http://localhost:8000' ] ) {

		this.entityId = {};
		this.entityTypeId = {};
		this.entityParentId = {};
		this.entityDirty = {};

		this.clients = this.entityTypeId[ 'Client' ] = {};
		this.clientWS = {};
		this.clientTimestamp = {};
		this.secret2Client = {};
		this.clientSecret = {};
		this.inMessages = [];
		this.outMessages = [];
		this.serverHeartbeat = 3333;
		this.clientTimeout = 10000;
		this.usedUUIDs = {};

		this.world = this.createEntity();

		const wss = new WebSocketServer( {
			port: process.env.PORT,
			verifyClient: info => allowedOrigins.indexOf( info.req.headers.origin ) > - 1
		} );


		wss.on( 'connection', ( ws, req ) => {

			let secret = /[?&]{1}secret=([0-9a-fA-F]{8})/.exec( req.url );
			let client;

			if ( secret ) {

				secret = secret[ 1 ];
				client = secret in this.secret2Client ? this.secret2Client[ secret ] : readClientBySecret( this, secret );

			}

			if ( ! client ) {

				secret = this.uuid();
				client = this.createEntity( { type: 'Client' } );
				this.setProperty( client, 'value', `Client-${client.id}` );
				this.setProperty( client, 'parentId', this.world.id );

			} else {

				this.send( null, client, client.id );

			}

			this.clientWS[ client.id ] = ws;
			this.secret2Client[ secret ] = client;
			this.clientSecret[ client.id ] = secret;

			console.log( `@${client.id} -> ${req.url}` );

			ws.on( 'message', ( data ) => {

				try {

					this.clientTimestamp[ client.id ] = Date.now();
					console.log( `@${client.id} -> ${data}` );
					if ( `${data}` === 'undefined' ) return;
					const messages = JSON.parse( data );
					for ( const message of ( messages.constructor !== Array ) ? [ messages ] : messages )
						this.inMessages.push( { message: message, from: client.id } );

				} catch ( e ) {

					console.error( e );

				}

			} );

			this.clientTimestamp[ client.id ] = Date.now();

			this.send( 'Connect', { id: client.id, secret: secret, clientTimeout: this.clientTimeout, serverHeartbeat: this.serverHeartbeat }, client.id );

			for ( const id in this.entityId ) {

				if ( id === client.id ) continue;

				const entity = this.entityId[ id ];
				if ( entity.destroyed ) continue;
				this.send( null, entity, client.id );

			}

			this.onConnect( client );

		} );

		const self = this;
		setInterval( () => self.update(), this.serverHeartbeat );

	}


	uuid( bytes = 4, id ) {

		while ( ! id || id in this.usedUUIDs ) id = crypto.randomBytes( bytes ).toString( 'hex' );
		return this.usedUUIDs[ id ] = id;

	}


	createEntity( args = {} ) {

		const entity = new Entity();

		entity.id || ( entity.id = this.uuid() );

		for ( const property of Object.keys( args ) )
			property !== 'id' && this.setProperty( entity, property, args[ property ] );

		if ( ! ( entity.type in this.entityTypeId ) ) this.entityTypeId[ entity.type ] = {};

		this.entityId[ entity.id ] = this.entityTypeId[ entity.type ][ entity.id ] = this.entityDirty[ entity.id ] = entity;

		this.onNewEntity( entity );

		return entity;

	}


	send( event, message, to = 'global' ) {

		if ( event ) message.event = event;
		( to in this.outMessages ? this.outMessages[ to ] : ( this.outMessages[ to ] = [] ) ).push( message );

	}

	setProperty( entity, property, value ) {

		// if no change to property value, do nothing
		if ( entity[ property ] === value ) return;

		// if parentId is changing, remove entity from existing parentId list
		if ( property === 'parentId' && entity.parentId in this.entityParentId ) {

			const index = this.entityParentId[ entity.parentId ].indexOf( entity );
			if ( index > - 1 ) this.entityParentId[ entity.parentId ].splice( index, 1 );

		}

		// if type is changing, remove entity from existing typeid map
		if ( property === 'type' && entity.type in this.entityTypeId && entity.id in this.entityTypeId[ entity.type ] )
			delete this.entityTypeId[ entity.type ][ entity.id ];

		// create a delta property if first time
		if ( ! ( entity.id in this.entityDirty ) ) this.entityDirty[ entity.id ] = {};

		// assign new property value and delta
		entity[ property ] = this.entityDirty[ entity.id ][ property ] = value;

		// if parentId has changed, add entity to parentId list
		if ( property === 'parentId' && entity.parentId ) {

			if ( ! ( entity.parentId in this.entityParentId ) ) this.entityParentId[ entity.parentId ] = [];
			this.entityParentId[ entity.parentId ].push( entity );

		}

		// if type has changed, add entity to typeid map
		if ( property === 'type' ) {

			if ( ! ( entity.type in this.entityTypeId ) ) this.entityTypeId[ entity.type ] = {};
			this.entityTypeId[ entity.type ][ entity.id ] = entity;

		}

	}

	destroy( entity ) {

		const siblings = entity.parentId in this.entityParentId ? this.entityParentId[ entity.parentId ] : null;
		const contents = entity.id in this.entityParentId ? this.entityParentId[ entity.id ] : [];

		if ( siblings ) {

			const index = siblings.indexOf( entity );
			if ( index > - 1 ) siblings.splice( index, 1 );
			for ( const content of contents ) siblings.push( content );
			delete this.entityParentId[ entity.parentId ];

		}

		if ( entity.id in this.entityId ) delete this.entityId[ entity.id ];

		if ( entity.type in this.entityTypeId && entity.id in this.entityTypeId[ entity.type ] )
			delete this.entityTypeId[ entity.type ][ entity.id ];

		if ( entity.id in this.entityDirty ) delete this.entityDirty[ entity.id ];

		this.send( 'Destroy', { id: entity.id } );
		entity.destroyed = true;
		entity.onDestroy();

	}


	update() {

		try {

			const inMessages = this.inMessages;

			this.inMessages = [];

			for ( const message of inMessages ) {

				const onevent = `on${message.message.event}`;

				if ( onevent in this ) {

					this[ onevent ]( message.message, message.from );

				} else {

					console.log( `${onevent}( message, from ) not found` );

				}

			}

			const timeout = Date.now() - this.clientTimeout;

			for ( const id in this.clients ) {

				const client = this.clients[ id ];
				if ( this.clientTimestamp[ id ] < timeout ) {

					this.destroy( client );
					this.clientWS[ client.id ].terminate();
					delete this.clients[ client.id ];
					delete this.clientWS[ client.id ];
					delete this.clientTimestamp[ client.id ];
					delete this.secret2Client[ this.clientSecret[ client.id ] ];
					delete this.clientSecret[ client.id ];
					send( 'Disconnect', { id: client.id } );
					this.onDisconnect( client );

				}

			}

			const dirtyEntities = this.entityDirty;
			this.entityDirty = {};

			for ( const id in dirtyEntities ) {

				const entity = this.entityId[ id ];
				if ( entity.destroyed ) continue;
				const delta = dirtyEntities[ id ];
				delta.id = id;
				this.send( null, delta );

				if ( entity.onUpdate() ) this.entityDirty[ id ] = entity;

			}

			const outMessages = this.outMessages;

			this.outMessages = {};

			const global = outMessages.global || [];
			const sent = {};

			for ( const id in outMessages ) {

				const message = JSON.stringify( global.length ? outMessages[ id ].concat( global ) : outMessages[ id ] );

				if ( ! ( id in this.clients ) ) {

					id !== 'global' && console.log( `WARN: disconnected @${id} <- ${message}` );
					continue;

				}

				this.clientWS[ id ].send( message );
				console.log( `@${id} <- ${message}` );
				sent[ id ] = null;

			}

			if ( ! global.length ) return;

			const message = JSON.stringify( global );
			console.log( `@global <- ${message}` );

			for ( const id in this.clientWS ) {

				if ( id in sent ) continue;
				this.clientWS[ id ].send( message );

			}

		} catch ( e ) {

			console.error( e );

		}

	}


	onNewEntity( entity ) {

	}


	onConnect( client ) {

	}


	onDisconnect( client ) {

	}

}



class Entity {

	onDestroy() {
	}

	onUpdate() {
	}

}


function readClientBySecret( server, secret, dir = '.data/Client' ) {

	if ( ! fs.existsSync( dir ) ) return;

	for ( const file of fs.readdirSync( dir ) ) {

		//if ( file.startsWith( `${secret}-` ) ) return read( `${dir}/${file}` );

	}

}

