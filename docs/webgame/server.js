import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';

const clients = {};
const awaiting = {};
const callbacks = {};

const propertiesByType = {};
const defaultsByType = {};
const valuesById = {};
const listeners = [];

let next_client_id = 0;
let next_entity_id = 0;
let dirtyIds = {};

const ERROR = {
	CLIENTID_INUSE: ( id ) =>
		`${id}__connection_1_Failed to connect. Client id '${id}' already in-use.`,
};

const wss = new WebSocketServer( {
	port: process.env.PORT,
	verifyClient: ( info ) =>
		[ undefined, 'http://localhost:8000' ].indexOf( info.req.headers.origin ) > - 1,
} );

wss.on( 'connection', connection );

/**
 * Handle a new WebSocket connection.
 *
 * @param {WebSocket} ws - The WebSocket connection object.
 * @param {http.IncomingMessage} req - The incoming HTTP request associated with the WebSocket connection.
 */
function connection( ws, req ) {

	log( req.headers[ 'sec-websocket-protocol' ] );

	const swp = req.headers[ 'sec-websocket-protocol' ]?.split( ',' ) || [];

	log( `connection...`, swp );

	ws.id = swp.shift() || 'c' + next_client_id ++;

	if ( ws.id in clients ) {

		return ws.send( MSG.ERROR.CLIENTID_INUSE( ws.id ) );

	}

	ws.addEventListener( 'message', ( msg ) => message( ws.id, msg ) );
	ws.addEventListener( 'close', () => close( ws.id ) );

	const _awaiting = [];

	propertiesByType[ ws.id ] = [ 'id', 'type' ];
	defaultsByType[ ws.id ] = [];

	swp.forEach( ( setting ) => {

		setting = setting.split( '_' );

		switch ( setting.shift().trim() ) {

		case 'dep':
			setting.forEach(
				( dependency ) => ! ( dependency in clients ) && _awaiting.push( dependency )
			);
			break;
		case 'prop':
			propertiesByType[ ws.id ].push( ...setting );
			break;
		case 'def':
			defaultsByType[ ws.id ].push( ...setting );
			break;
		case 'ent':
			listeners.push( ws.id );
			break;

		}

	} );

	if ( ! _awaiting.length ) {

		clients[ ws.id ] = { ws };
		return ws.send( `${ws.id}__connection__${ws.id}` );

	}

	for ( let id in awaiting ) {

		const dependencies = awaiting[ id ];
		const index = dependencies.indexOf( ws.id );

		if ( index > - 1 ) {

			dependencies.splice( index, 1 );

		}

		if ( ! dependencies.length ) {

			delete awaiting[ id ];
			clients[ id ].ws.send( `${id}__connection__${id}` );

		}

	}

	awaiting[ ws.id ] = _awaiting;

}

/**
 * Handle the WebSocket connection close event of a specific client.
 *
 * @param {string} id - The unique identifier of the client.
 */
function close( id ) {

	log( `Client '${id}' connection closed.` );

}

/**
 * Handle incoming WebSocket messages for a specific client.
 *
 * @param {string} id - The unique identifier of the client.
 * @param {string} message - The incoming WebSocket message.
 */
function message( client_id, message ) {

	log( `Received: '${message}'` );

	message
		.toString()
		.split( ';' )
		.forEach( ( m ) => {

			const [ id, callbackId, fn, ...args ] = m.split( '_' );

			if ( 'Entity' === id ) {

				if ( fn in Entity ) {

					const returnValue = Entity[ fn ]( args );
					callbackId &&
						ws.send(
							ws.id +
								'__' +
								callbackId +
								( returnValue
									? returnValue.constructor === Array
										? '_' + returnValue.join( '_' )
										: `_${returnValue}`
									: '' )
						);

				} else {

					console.error( `${fn} is not a Entity function` );

				}

			} else if ( id in clients ) {

				clients[ id ].ws.send(
					ws.id +
						'_' +
						callbackId +
						'_' +
						fn +
						'_' +
						( args
							? args.constructor === Array
								? '_' + args.join( '_' )
								: `_${args}`
							: '' )
				);

			}

		} );

}

/**
 * Log messages to the console with a custom prefix and color.
 *
 * @param {...any} args - The messages or data to be logged.
 */
function log( ...args ) {

	console.log( '\x1b[33mserver:', ...args, '\x1b[0m' );

}

/**
 *
 */
function messageString( callerId, fn, args = undefined, callback = undefined ) {

	let callbackId = '';

	if ( callback ) {

		while ( ! callbackId || callbackId in callbacks ) {

			callbackId = crypto.randomUUID().split( '-' )[ 0 ];

		}

		callbacks[ callbackId ] = callback;

	}

	return (
		callerId +
		'_' +
		callbackId +
		'_' +
		fn +
		( args
			? args.constructor === Array
				? '_' + args.join( '_' )
				: `_${args}`
			: '' )
	);

}

const Entity = {
	create: ( args ) => {

		const type = args.shift();
		const id = 'e' + next_entity_id ++;
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

	properties: ( args ) => {

		return propertiesByType[ args[ 0 ] ];

	},
};

fs.readdir( './server_clients/', ( err, files = [] ) => {

	if ( err ) {

		return log( err.message );

	}

	for ( const file of files ) {

		file.endsWith( '.js' ) && import( `./server_clients/${file}` );

	}

} );

setInterval( () => {

	const _dirtyIds = dirtyIds;
	dirtyIds = {};
	let messages = '';

	for ( let id in _dirtyIds ) {

		messages +=
			( messages ? ';' : '' ) + messageString( 'Entity', 'entity', _dirtyIds[ id ] );

	}

	if ( ! messages ) {

		return;

	}

	for ( let id of listeners ) {

		clients[ id ].ws.send( messages );

	}

}, 1000 );
