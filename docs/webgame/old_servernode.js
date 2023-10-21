import { WebSocket } from 'ws';
import crypto from 'crypto';

export function connect( client ) {

	const swp = [ ( client.name = client.name || '' ) ];
	const push = ( id, arr ) =>
		arr?.length && swp.push( id + arr.join( '_' ).replace( ' ', '' ) );

	push( 'dep_', client.dependencies );
	push( 'prop_', client.properties );
	push( 'def_', client.default_values );

	client.entity && swp.push( 'ent' );

	ws = new WebSocket( `http://localhost:${process.env.PORT}`, swp );

	ws.on( 'open', function () {

		cached && ( cached = ws.send( cached ) ? '' : '' );

		client.update &&
			setInterval( () => client.update( client ), client.updateInterval || 10000 );

	} );

	ws.on( 'message', function ( message ) {

		const [ callerId, cid, fn, ...args ] = message.toString().split( '_' );

		if ( fn in callbacks ) {

			console.log( `callbacks[ '${fn}' ].resolve` );
			callbacks[ fn ].resolve( args );
			delete callbacks[ fn ];

		} else if ( fn in client ) {

			return client[ fn ]( client, args );

		} else if ( client.debug ) {

			console.error( `Warn: ${client.name}.${fn} not found` );

		}

	} );

	ws.on( 'close', () => {} );

}

export async function call( target, fn, args = '' ) {

	const cid = crypto.randomUUID().split( '-' )[ 0 ];

	args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

	callbacks[ cid ] = {};

	const msg = ( target ?? '' ) + '_' + cid + '_' + fn + ( args ? `_${args}` : '' );

	return new Promise( function ( resolve, reject ) {

		callbacks[ cid ].resolve = resolve;
		callbacks[ cid ].reject = reject;

		ws.readyState ? ws.send( msg ) : ( cached += ! cached ? msg : ';' + msg );

	} );

}

export function signal( target, fn, args = '' ) {

	args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

	const msg = ( target ?? '' ) + '__' + fn + ( args ? `_${args}` : '' );

	ws.readyState ? ws.send( msg ) : ( cached += ! cached ? msg : ';' + msg );

}

export async function propertiesOf( name ) {

	return new Promise( ( resolve, reject ) =>
		name in propertiesOf.cached ? resolve() : reject()
	).then(
		() => propertiesOf.cached[ name ],
		() =>
			call( 'Entity', 'properties', 'Tree' ).then( ( properties ) => {

				const propertyMap = ( propertiesOf.cached[ name ] = {} );

				for ( let index in properties ) {

					propertyMap[ properties[ index ] ] = parseInt( index );

				}

				return propertyMap;

			} )
	);

}

propertiesOf.cached = {};

let ws;
const callbacks = {};
let cached = '';
