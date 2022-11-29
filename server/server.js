import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import fs from 'fs';

const wss = new WebSocketServer( {
	port: process.env.PORT,
	verifyClient: info => [ 'http://localhost:8000', 'https://between2spaces.github.io' ].indexOf( info.req.headers.origin ) > - 1
} );


wss.on( 'connection', ( ws, req ) => {

	console.log( `-> ${req.url}` );

	const secret = /[?&]{1}secret=([0-9a-fA-F]{8})/.exec( req.url );
	const isNewConnection = secret && secret in clientBySecret;

	let client;

	if ( secret ) client = secret in clientBySecret ? client = clientBySecret[ secret ] : readClientBySecret( secret );
	if ( ! client ) {

		client = new Entity( { type: 'Client', secret: uuid() } );
		client.setProperty( 'value', `Client-${client.id}` );

	}

	wsByClientId[ client.id ] = ws;
	console.log( client );

	ws.on( 'message', ( data ) => {

		try {

			client.timestamp = Date.now();
			console.log( `-> ${data}` );
			const messages = JSON.parse( data );
			for ( const message of ( messages.constructor !== Array ) ? [ messages ] : messages ) inMessages.push( { message: message, from: client.id } );

		} catch ( e ) {

			console.error( e );

		}

	} );

	client.timestamp = Date.now();

	send( 'verified', { id: client.id, secret: client.secret, heartbeat: heartbeat, world: world }, client.id );

	if ( isNewConnection ) onClientConnected();

} );


function uuid( bytes = 4, id ) {

	while ( ! id || id in uuid.used ) id = crypto.randomBytes( bytes ).toString( 'hex' );
	return uuid.used[ id ] = id;

}

uuid.used = {};


class Entity {

	constructor( args = {} ) {

		Object.assign( this, args );

		this.id || ( this.id = uuid() );
		this.type = 'Entity';
		this.delta = { type: this.type };

		if ( ! ( this.type in Entity.byTypebyId ) ) Entity.byTypebyId[ this.type ] = {};

		Entity.byId[ this.id ] = Entity.byTypebyId[ this.type ][ this.id ] = Entity.dirty[ this.id ] = this;

		for ( const property of Object.keys( args ) ) {

			if ( property !== 'id' ) this.setProperty( property, args[ property ] );

		}

	}

	setProperty( property, value ) {

		if ( this[ property ] === value ) return;

		if ( property === 'parentId' && this.parentId in Entity.byParentId ) {

			const index = Entity.byParentId[ this.parentId ].indexOf( this );
			if ( index > - 1 ) Entity.byParentId[ this.parentId ].splice( index, 1 );

		}

		if ( property === 'type' && this.type in Entity.byTypebyId && this.id in Entity.byTypebyId[ this.type ] )
			delete Entity.byTypebyId[ this.type ][ this.id ];

		this[ property ] = this.delta[ property ] = value;

		if ( property === 'parentId' && this.parentId ) {

			if ( ! ( this.parentId in Entity.byParentId ) ) Entity.byParentId[ this.parentId ] = [];
			Entity.byParentId.push( this );

		}

		if ( property === 'type' ) {

			if ( ! ( this.type in Entity.byTypebyId ) ) Entity.byTypebyId[ this.type ] = {};
			Entity.byTypebyId[ this.type ][ this.id ] = this;

		}

		Entity.dirty[ this.id ] = this;

	}

	destroy() {

		const siblings = this.parentId in Entity.byParentId ? Entity.byParentId[ this.parentId ] : null;
		const contents = this.id in Entity.byParentId ? Entity.byParentId[ this.id ] : [];

		if ( siblings ) {

			const index = siblings.indexOf( this );
			if ( index > - 1 ) siblings.splice( index, 1 );
			for ( const entity of contents ) siblings.push( entity );
			delete Entity.byParentId[ this.parentId ];

		}

		if ( this.id in Entity.byId ) delete Entity.byId[ this.id ];
		if ( this.type in Entity.byTypebyId && this.id in Entity.byTypebyId[ this.type ] )
			delete Entity.byTypebyId[ this.type ][ this.id ];
		if ( this.id in Entity.dirty ) delete Entity.dirty[ this.id ];
		send( 'destroy', { id: this.id } );
		this.destroyed = true;

	}

	update() {

		this.delta.id = this.id;
		send( null, this.delta );
		this.delta = {};

	}

}

Entity.byId = {};
Entity.byTypebyId = {};
Entity.byParentId = {};
Entity.dirty = {};


const clientById = Entity.byTypebyId[ 'Client' ] = {};


function readClientBySecret( secret, dir = '.data/Client' ) {

	if ( ! fs.existsSync( dir ) ) return;

	for ( const file of fs.readdirSync( dir ) ) {

		//if ( file.startsWith( `${secret}-` ) ) return read( `${dir}/${file}` );

	}

}

function onClientConnected( client ) {

	send( 'connected', { id: client.id } );

	if ( ! client.parentId ) client.setProperty( 'parentId', world.id );

}

function onClientDisconnect( client ) {

	client.destroy();
	delete clientBySecret[ client.secret ];
	wsByClientId[ client.id ].terminate();
	delete wsByClientId[ client.id ];
	send( 'disconnected', { id: client.id } );

}


const clientBySecret = {};
const wsByClientId = {};


const world = new Entity();


let inMessages = [];
let outMessages = [];

function send( event, message, to = 'global' ) {

	if ( event ) message.event = event;
	( to in outMessages ? outMessages[ to ] : ( outMessages[ to ] = [] ) ).push( message );

}



const heartbeat = 3333;

function update() {

	try {

		const _inMessages = inMessages;
		inMessages = [];

		for ( const _in of _inMessages ) this[ `on${_in.message.event}` ]( _in.message, _in.from );

		const disconnectedHorizon = Date.now() - heartbeat * 2;

		for ( const id in clientById ) {

			const client = clientById[ id ];
			if ( client.timestamp < disconnectedHorizon ) onClientDisconnect( client );

		}

		const _dirtyEntities = Entity.dirty;
		Entity.dirty = {};

		for ( const id in _dirtyEntities ) {

			const entity = _dirtyEntities[ id ];
			if ( entity.destroyed ) continue;
			if ( entity.update() ) Entity.dirty[ id ] = entity;

		}

		const _outMessages = outMessages;
		outMessages = {};

		const _global = _outMessages.global || [];
		const sent = {};

		for ( const id in _outMessages ) {

			const message = JSON.stringify( _global.length ? _outMessages[ id ].concat( _global ) : _outMessages[ id ] );

			if ( ! ( id in clientById ) ) {

				id !== 'global' && console.log( `WARN: disconnected @${id} <- ${message}` );
				continue;

			}

			wsByClientId[ id ].send( message );
			console.log( `@${id} <- ${message}` );
			sent[ id ] = null;

		}

		if ( ! _global.length ) return;

		const message = JSON.stringify( _global );
		console.log( `@global <- ${message}` );

		for ( const id in wsByClientId ) {

			if ( id in sent ) continue;
			wsByClientId[ id ].send( message );

		}

	} catch ( e ) {

		console.error( e );

	}

}


setInterval( update, heartbeat );

