import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import fs from 'fs';
import * as url from 'node:url';


let serverInstance;


export default class Server {

	constructor( args ) {

		args.allowedOrigins = args.allowedOrigins ? args.allowedOrigins : [ 'http://localhost:8000' ];
		args.heartbeat = 'heartbeat' in args ? args.heartbeat : 3333;

		serverInstance = this;

		this.clientBySecret = {};

		const wss = new WebSocketServer( {
			port: process.env.PORT,
			verifyClient: info => args.allowedOrigins.indexOf( info.req.headers.origin ) > - 1
		} );


		wss.on( 'connection', ( ws, req ) => {

			let secret = /[?&]{1}secret=([0-9a-fA-F]{8})/.exec( req.url );
			let client;

			if ( secret && secret[ 1 ] in this.clientBySecret ) {

				client = this.clientBySecret[ secret[ 1 ] ];
				this.send( null, client, client.id );

			} else {

				client = new Client();

			}

		} );

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

	onDestroy() {
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

	}

}


if ( process.argv[ 1 ] === url.fileURLToPath( import.meta.url ) ) {

	// Main ESM module
	new Server( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ], heartbeat: 3333 } );

}
