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

	const isNewConnection = secret && secret in Client.bySecret;
	const client = secret ? secret in Client.bySecret ? Client.bySecret[ secret ] : Client.readBySecret( secret ) : new Client();
	Client.wsById[ client.id ] = ws;
	console.log( client );
	Client.count ++;

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

	if ( isNewConnection ) client.connected();

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
		this.type = this.type || this.constructor.name;
		this.value = this.value ?? null;
		this.parentId = null;
		this.delta = { type: this.type, value: this.value };


		if ( ! ( this.id in Entity.byId ) ) Entity.byId[ this.id ] = {};
		Entity.byId[ this.id ] = Entity.dirty[ this.id ] = this;

	}

	setProperty( property, value ) {

		if ( this[ property ] === value ) return;
		this[ property ] !== value && ( this[ property ] = this.delta[ property ] = value, Entity.dirty[ this.id ] = this );

	}

	add( entity ) {

		console.log( `add; ${entity.value}(${entity.id}) -> ${this.value}(${this.id})` );

		let parentId = entity.parentId;

		if ( parentId === this.id ) return;

		if ( parentId in Entity.byParentId ) {

			const siblings = Entity.byParentId[ parentId ];
			const index = siblings.indexOf( entity );
			if ( index > - 1 ) siblings.splice( index, 1 );

		}

		parentId = this.id;
		entity.setProperty( 'parentId', parentId );

		const siblings = Entity.byParentId[ parentId ];
		const index = siblings.indexOf( entity );
		if ( index === - 1 ) siblings.push( entity );

		return entity;

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
Entity.byParentId = {};
Entity.dirty = {};



class Client extends Entity {

	constructor( args = {} ) {

		super( Object.assign( { value: `Client-${args.id}` }, args ) );
		this.secret = uuid();
		Client.byId[ this.id ] = this;
		Client.bySecret[ this.secret ] = this;
		Client.count++;

	}

	static readBySecret( secret, dir = '.data/Client' ) {

		for ( const file of fs.readdirSync( dir ) ) {

			if ( file.startsWith( `${secret}-` ) ) return read( `${dir}/${file}` );

		}

	}

	connected() {

		send( 'connected', { id: this.id } );

		if ( ! this.parentId ) world.add( this );

	}

	disconnect() {

		delete Client.byId[ this.id ];
		delete Client.bySecret[ this.secret ];
		Client.count --;
		Client.wsById[ this.id ].terminate();
		send( 'disconnected', { id: this.id } );

	}

}

Client.byId = {};
Client.bySecret = {};
Client.wsById = {};
Client.count = 0;


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

		for ( const id in Client.byId ) {

			const client = Client.byId[ id ];
			if ( client.timestamp < disconnectedHorizon ) client.disconnect();

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

			if ( ! ( id in Client.byId ) ) {

				id !== 'global' && console.log( `WARN: disconnected @${id} <- ${message}` );
				continue;

			}

			Client.wsById[ id ].send( message );
			console.log( `@${id} <- ${message}` );
			sent[ id ] = null;

		}

		if ( ! _global.length ) return;

		const message = JSON.stringify( _global );
		console.log( `@global <- ${message}` );

		for ( const id in Client.byId ) {

			if ( id in sent ) continue;
			Client.wsById[ id ].send( message );

		}

	} catch ( e ) {

		console.error( e );

	}

}


setInterval( update, heartbeat );

