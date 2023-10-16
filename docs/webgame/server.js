import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer( {
	port: process.env.PORT,
	verifyClient: ( info ) => [ undefined, 'http://localhost:8000' ].indexOf( info.req.headers.origin ) > - 1,
} );

wss.on( 'connection', ( ws, req ) => {

	console.log( req.headers[ 'sec-websocket-protocol' ] );
	const swp = req.headers[ 'sec-websocket-protocol' ].split( ',' );

	ws.name = swp.shift();

	if ( ! ws.name || '$UUID' === ws.name ) ws.name = uuid();

	if ( ws.name in clients ) console.error( `ERROR: Connection passed ID '${ws.name}' already in-use` );

	clients[ ws.name ] = { ws };

	ws.on( 'message', ( message ) => {

		console.log( `Received: '${message}'` );

		message.toString().split( ';' ).forEach( m => {

			const [ name, callbackId, fn, ...args ] = m.split( '_' );

			if ( 'Entity' === name ) {

				if ( fn in Entity ) {

					const returnValue = Entity[ fn ]( args );
					callbackId && ws.send( ws.name + '__' + callbackId + ( returnValue ? returnValue.constructor === Array ? '_' + returnValue.join( '_' ) : `_${returnValue}` : '' ) );

				} else {

					console.error( `${fn} is not a Entity function` );

				}

			} else if ( name in clients ) {

				clients[ name ].ws.send( ws.name + '_' + callbackId + '_' + fn + '_' + ( args ? args.constructor === Array ? '_' + args.join( '_' ) : `_${args}` : '' ) );

			}

		} );

	} );

	ws.on( 'close', () => console.log( 'WebSocket connection closed.' ) );



	const _awaiting = [];

	propertiesByType[ ws.name ] = [ 'id', 'type' ];
	defaultsByType[ ws.name ] = [];

	swp.forEach( setting => {

		setting = setting.split( '_' );

		switch ( setting.shift().trim() ) {

		case 'dep':
			setting.forEach( dependency => ! ( dependency in clients ) && _awaiting.push( dependency ) );
			break;
		case 'prop':
			propertiesByType[ ws.name ].push( ...setting );
			break;
		case 'def':
			defaultsByType[ ws.name ].push( ...setting );
			break;
		case 'ent':
			listeners.push( ws.name );
			break;

		}

	} );

	if ( ! _awaiting.length ) return ws.send( `${ws.name}__config_${ws.name}` );

	for ( let name in awaiting ) {

		const dependencies = awaiting[ name ];
		const index = dependencies.indexOf( ws.name );
		if ( index > - 1 ) dependencies.splice( index, 1 );
		if ( ! dependencies.length ) {

			delete awaiting[ name ];
			clients[ name ].ws.send( `${name}__config_${name}` );

		}

	}

	awaiting[ ws.name ] = _awaiting;

} );


function uuid() {

	let val;
	while ( ! val || val in clients || val in valuesById ) val = crypto.randomUUID().split( '-' )[ 0 ];
	return val;

}

const clients = {};
const awaiting = {};
const callbacks = {};

const propertiesByType = {};
const defaultsByType = {};
const valuesById = {};
const listeners = [];

let dirtyIds = {};


function messageString( callerId, fn, args = undefined, callback = undefined ) {

	let callbackId = '';

	if ( callback ) {

		while ( ! callbackId || callbackId in callbacks ) callbackId = crypto.randomUUID().split( '-' )[ 0 ];
		callbacks[ callbackId ] = callback;

	}

	return callerId + '_' + callbackId + '_' + fn + ( args ? args.constructor === Array ? '_' + args.join( '_' ) : `_${args}` : '' );

}


const Entity = {

	create: ( args ) => {

		const type = args.shift();
		const id = uuid();
  		const typeDefaults = defaultsByType[ type ];
  		const values = new Array( typeDefaults.length + 2 );

  		values[ 0 ] = id;
  		values[ 1 ] = type;

  		for ( let i = 0; i < typeDefaults.length; i ++ ) {

    		values[ i + 2 ] = i < args.length ? args[ i ] : typeDefaults[ i ];

		}

  		valuesById[ id ] = values;
		dirtyIds[ id ] = values.join( '_' );
		return values;

	},

};


fs.readdir( './servernodes/', ( err, files = [] ) => {

	if ( err ) return console.log( err.message );
	for ( const file of files ) file.endsWith( '.js' ) && import( `./servernodes/${file}` );

} );


setInterval( () => {

	const _dirtyIds = dirtyIds;
	dirtyIds = {};
	let messages = '';
	for ( let id in _dirtyIds ) messages += ( messages ? ';' : '' ) + messageString( 'Entity', 'entity', _dirtyIds[ id ] );
	if ( ! messages ) return;
	for ( let name of listeners ) clients[ name ].ws.send( messages );

}, 300 );
