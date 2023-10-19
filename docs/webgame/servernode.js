import { WebSocket } from 'ws';
import crypto from 'crypto';

export function connect( client ) {

	client.name = client.name || '';
	const swp = [ client.name ];

	if ( client.dependencies && client.dependencies.length ) {

		swp.push( 'dep_' + client.dependencies.join( '_' ).replace( ' ', '' ) );

	}

	if ( client.properties && client.properties.length ) {

		swp.push( 'prop_' + client.properties.join( '_' ).replace( ' ', '' ) );

	}

	if ( client.default_values && client.default_values.length ) {

		swp.push( 'def_' + client.default_values.join( '_' ).replace( ' ', '' ) );

	}

	if ( client.entity ) {

		swp.push( 'ent' );

	}

	ws = new WebSocket( `http://localhost:${process.env.PORT}`, swp );
<<<<<<< HEAD

	ws.on( 'open', function () {
=======
	ws.on( 'open', () => {
>>>>>>> ea2ee83 (lazy commit)

		if ( cachedMessages ) {

			const messages = cachedMessages;
			cachedMessages = '';
			ws.send( messages );

		}

<<<<<<< HEAD
		if ( client.update ) setInterval( function () {

			client.update( client );

		}, client.updateInterval || 10000 );

	} );

	ws.on( 'message', function ( message ) {
=======
		if ( client.update ) {

			setInterval( client.update, client.updateInterval || 10000 );

		}

	} );
	ws.on( 'message', ( message ) => {
>>>>>>> ea2ee83 (lazy commit)

		const [ callerId, callbackId, fn, ...args ] = message.toString().split( '_' );

		if ( fn in callbacks ) {

			console.log( `callbacks[ '${fn}' ].resolve` );
			callbacks[ fn ].resolve( args );
			delete callbacks[ fn ];

		} else if ( fn in client ) {

<<<<<<< HEAD
			const returnValue = client[ fn ]( client, args );
			return callbackId && call( callerId, callbackId, returnValue );
=======
			return client[ fn ]( args );
>>>>>>> ea2ee83 (lazy commit)

		} else if ( client.debug ) {

			console.error(
				`Warn: ${client.name}.${fn} isnot a function in servernode.js:ws.on( 'message', ... )`
			);

		}

	} );
	ws.on( 'close', () => {} );

}

export async function call( targetId, fn, args = undefined, responsePromise = false ) {

	let callbackId = '';

	if ( responsePromise ) {

<<<<<<< HEAD
		while ( ! callbackId || callbackId in callbacks ) callbackId = crypto.randomUUID().split( '-' )[ 0 ];
		callbacks[ callbackId ] = {};

		console.log( `callbacks[ '${callbackId}' ] = {}` );
=======
		while ( ! callbackId || callbackId in callbacks ) {

			callbackId = crypto.randomUUID().split( '-' )[ 0 ];

		}

		callbacks[ callbackId ] = callback;
>>>>>>> ea2ee83 (lazy commit)

	}

	const message =
		( targetId ?? '' ) +
		'_' +
		callbackId +
		'_' +
		fn +
		( args
			? args.constructor === Array
				? '_' + args.join( '_' )
				: `_${args}`
			: '' );

<<<<<<< HEAD
=======
	if ( ! ws.readyState ) {

		return ( cachedMessages += ! cachedMessages ? message : ';' + message );

	}
>>>>>>> ea2ee83 (lazy commit)

	if ( responsePromise ) {

		console.log( `callbacks[ '${callbackId}' ].resolve = () => {}` );

<<<<<<< HEAD
		return new Promise( function ( resolve, reject ) {

			callbacks[ callbackId ].resolve = resolve;
			callbacks[ callbackId ].reject = reject;

			ws.readyState ? ws.send( message ) : cachedMessages += ( ! cachedMessages ) ? message : ';' + message;

		} );

	} else {

		ws.readyState ? ws.send( message ) : cachedMessages += ( ! cachedMessages ) ? message : ';' + message;

=======
export function map( name ) {

	if ( name in map.cached ) {

		return map.cached.name;

	}

	const properties = [ 'id', 'type', 'age', 'weight' ];
	const propertyMap = ( map.cached[ name ] = {} );

	for ( let index in properties ) {

		propertyMap[ properties[ index ] ] = function ( values, val ) {

			if ( typeof val === 'undefined' ) {

				return values[ index ];

			}

			return ( values[ index ] = val );

		};

>>>>>>> ea2ee83 (lazy commit)
	}

}



export async function propertiesOf( name ) {

	return new Promise( async function ( resolve, reject ) {

		if ( name in propertiesOf.cached ) resolve( propertiesOf.cached.name );

		const properties = await call( 'Entity', 'properties', 'Tree', true );

		const propertyMap = propertiesOf.cached[ name ] = {};

		for ( let index in properties ) propertyMap[ properties[ index ] ] = parseInt( index );

		resolve( propertyMap );

	} );

}

<<<<<<< HEAD
propertiesOf.cached = {};



=======
map.cached = {};
>>>>>>> ea2ee83 (lazy commit)
let ws;
const callbacks = {};
let cachedMessages = '';
