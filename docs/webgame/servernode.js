import { WebSocket } from 'ws';
import crypto from 'crypto';

export function connect( client ) {

	client.name = client.name || '';

	const swp = [ client.name ];

	if ( client.dependencies && client.dependencies.length ) swp.push( 'dep_' + client.dependencies.join( '_' ).replace( ' ', '' ) );
	if ( client.properties && client.properties.length ) swp.push( 'prop_' + client.properties.join( '_' ).replace( ' ', '' ) );
	if ( client.default_values && client.default_values.length ) swp.push( 'def_' + client.default_values.join( '_' ).replace( ' ', '' ) );
	if ( client.entity ) swp.push( 'ent' );

	ws = new WebSocket( `http://localhost:${process.env.PORT}`, swp );

	ws.on( 'open', () => {

		if ( cachedMessages ) {

			const messages = cachedMessages;
			cachedMessages = '';
			ws.send( messages );

		}

		if ( client.update ) setInterval( client.update, client.updateInterval || 10000 );

	} );

	ws.on( 'message', ( message ) => {

		const [ callerId, callbackId, fn, ...args ] = message.toString().split( '_' );

		if ( fn in callbacks ) {

			const returnValue = callbacks[ fn ]( args );
			delete callbacks[ fn ];
			return callbackId && call( callerId, callbackId, returnValue );

		} else if ( fn in client ) {

			const returnValue = client[ fn ]( args );
			return callbackId && call( callerId, callbackId, returnValue );

		} else if ( client.debug ) {

			console.error( `Warn: ${client.name}.${fn} is not a function in servernode.js:ws.on( 'message', ... )` );

		}

	} );

	ws.on( 'close', () => {} );

}

export function call( targetId, fn, args = undefined, callback = undefined ) {

	let callbackId = '';

	if ( callback ) {

		while ( ! callbackId || callbackId in callbacks ) callbackId = crypto.randomUUID().split( '-' )[ 0 ];
		callbacks[ callbackId ] = callback;

	}

	const message = ( targetId ?? '' ) + '_' + callbackId + '_' + fn + ( args ? args.constructor === Array ? '_' + args.join( '_' ) : `_${args}` : '' );

	if ( ! ws.readyState ) return cachedMessages += ( ! cachedMessages ) ? message : ';' + message;

	ws.send( message );

}


export function map( name ) {

	if ( name in map.cached ) return map.cached.name;

	const nameMap = map.cached[ name ] = {};

	Object.defineProperty( nameMap, "age", {
		get: function ( values ) {

			return values[ 2 ];

		}
	} );

	return nameMap;

}


let ws;

const callbacks = {};
let cachedMessages = '';

