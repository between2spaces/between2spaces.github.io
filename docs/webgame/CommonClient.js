export { connect, call, signal, properties };

const browser = typeof window !== 'undefined';
const crypto = browser ? crypto : ( await import( 'node:crypto' ) ).webcrypto;
const WebSocket = ( browser ? window : await import( 'ws' ) ).WebSocket;

console.log( crypto );

const sockets = {};
const callbacks = {};
const intervals = {};
const messages_cache = {};
const properties_cache = {};

function connect( client, url = `ws://localhost:${process.env.PORT}` ) {

	client.id ??= crypto.randomUUID().split( '-' )[ 0 ];

	const swp = [];

	swpadd( swp, 'dependencies', client );
	swpadd( swp, 'properties', client );
	swpadd( swp, 'defaults', client );

	client.entity && swp.push( 'ent' );

	console.log( swp );

	const socket = ( sockets[ client.id ] = new WebSocket( url, swp ) );

	const listen = socket.addEventListener;
	socket.addEventListener( 'open', () => open( client ) );
	socket.addEventListener( 'close', () => close( client ) );
	socket.addEventListener( 'message', ( msg ) => message( client, msg.data ) );
	socket.addEventListener( 'error', ( err ) => error( client, err ) );

}

function swpadd( swp, property, client ) {

	const arr = client[ property ];
	arr?.length && swp.push( property + arr.join( '_' ).replace( ' ', '' ) );

}

function open( client ) {

	if ( client.id in messages_cache ) {

		sockets[ client.id ].send( messages_cache[ client.id ] );
		delete messages_cache[ client.id ];

	}

	client.interval ??= 10000;

	if ( client.update && ! ( client.id in intervals ) ) {

		client.interval ??= 10000;
		intervals[ client.id ] = setInterval(
			() => client.update( client ),
			client.interval
		);

	}

}

function close( client ) {}

function message( client, msg ) {

	const [ callerId, cid, fn, ...args ] = msg.toString().split( '_' );
	const callback = callbacks[ client.id ];

	console.log( msg );

	if ( callback && fn in callback ) {

		console.log( `callbacks[ '${fn}' ].resolve` );
		callback[ fn ].resolve( args );
		delete callback[ fn ];

	}

	if ( fn in client ) {

		return client[ fn ]( args );

	}

	client.debug && console.error( `Warn: client.${fn} not found` );

}

function call( client, target, fn, args = '' ) {

	const cid = crypto.randomUUID().split( '-' )[ 0 ];

	args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

	const callback = ( callbacks[ client.id ] ??= {} );

	callback[ cid ] = {};

	const msg = ( target ?? '' ) + '_' + cid + '_' + fn + ( args ? `_${args}` : '' );
	const socket = sockets[ client.id ];

	return new Promise( function ( res, rej ) {

		callback[ cid ].res = res;
		callback[ cid ].rej = rej;

		socket.readyState
			? socket.send( msg )
			: ( messages_cache[ client.id ] =
					client.id in messages_cache
						? messages_cache[ client.id ] + ';' + msg
						: msg );

	} );

}

function signal( client, target, fn, args = '' ) {

	args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

	const msg = ( target ?? '' ) + '__' + fn + ( args ? `_${args}` : '' );

	const socket = sockets[ client.id ];

	socket.readyState
		? socket.send( msg )
		: ( messages_cache[ client.id ] =
				client.id in messages_cache
					? messages_cache[ client.id ] + ';' + msg
					: msg );

}

function properties( client_id ) {

	return new Promise( ( res, rej ) =>
		client_id in properties_cache ? res() : rej()
	).then(
		() => properties_cache[ client_id ],
		() =>
			call( 'Entity', 'properties', client_id ).then( ( properties ) => {

				const map = ( properties_cache[ name ] = {} );

				for ( let index in properties ) {

					map[ properties[ index ] ] = parseInt( index );

				}

				return map;

			} )
	);

}

function error( err ) {}
