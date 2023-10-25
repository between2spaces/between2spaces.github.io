export { connect, log, call, signal, properties };

const browser = typeof window !== 'undefined';
const crypto = browser ? crypto : ( await import( 'node:crypto' ) ).webcrypto;
const WebSocket = ( browser ? window : await import( 'ws' ) ).WebSocket;

const sockets = {};
const callbacks = {};
const intervals = {};
const cache = {};
const properties_cache = {};

function connect( client, url = `ws://localhost:${process.env.PORT}` ) {

	const swp = [];

	client.id && swp.push( client.id );

	swpadd( swp, 'dependencies', client );
	swpadd( swp, 'properties', client );
	swpadd( swp, 'defaults', client );

	client.entity && swp.push( 'ent' );

	const socket = new WebSocket( url, swp );

	callbacks[ ( client.id = uuid() ) ] = {
		connection: {
			resolve: ( id ) => {

				log(
					`server connection... assigned client id '${client.id}' -> '${id}'`
				);
				client.id || delete callbacks[ client.id ];
				client.id = id;
				sockets[ client.id ] = socket;
				client.config && client.config( id );

			},
			reject: ( error ) => {

				log( `server connection... error: ${error}` );

			},
		},
	};

	socket.addEventListener( 'open', () => open( client ) );
	socket.addEventListener( 'close', () => close( client ) );
	socket.addEventListener( 'message', ( msg ) => message( client, msg.data ) );
	socket.addEventListener( 'error', ( err ) => error( client, err ) );

}

function swpadd( swp, property, client ) {

	const arr = client[ property ];
	arr?.length && swp.push( property + arr.join( '_' ).replace( ' ', '' ) );

}

function log( ...args ) {

	console.log( '\x1b[35mclient:', ...args, '\x1b[0m' );

}

function open( client ) {

	if ( client.id in cache ) {

		sockets[ client.id ].send( cache[ client.id ] );
		delete cache[ client.id ];

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

	log( msg );

	if ( callback && fn in callback ) {

		( args.shift() ? callback[ fn ].reject : callback[ fn ].resolve )( ...args );
		delete callback[ fn ];

	}

	if ( fn in client ) {

		return client[ fn ]( args );

	}

	client.debug && console.error( `Warn: client.${fn} not found` );

}

function uuid() {

	return crypto.randomUUID().split( '-' )[ 0 ];

}

function call( client, target, fn, args = '' ) {

	args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

	const cid = uuid();
	const msg = ( target ?? '' ) + '_' + cid + '_' + fn + ( args ? `_${args}` : '' );

	return new Promise( function ( resolve, reject ) {

		( callbacks[ client.id ] ??= {} )[ cid ] = { resolve, reject };
		send( client, msg );

	} );

}

function signal( client, target, fn, args = '' ) {

	args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

	send( client, ( target ?? '' ) + '__' + fn + ( args ? `_${args}` : '' ) );

}

function send( client, msg ) {

	const socket = sockets[ client.id ];

	if ( socket.readyState ) {

		return socket.send( msg );

	}

	cache[ client.id ] = client.id in cache ? cache[ client.id ] + ';' : '';
	cache[ client.id ] += msg;

}

function properties( client_id ) {

	function map( properties ) {

		const map = ( properties_cache[ client_id ] = {} );

		for ( let index in properties ) {

			map[ properties[ index ] ] = parseInt( index );

		}

		return map;

	}

	return new Promise( ( resovle, reject ) =>
		client_id in properties_cache ? resolve() : reject()
	).then(
		() => properties_cache[ client_id ],
		() => call( 'Entity', 'properties', client_id ).then( map )
	);

}

function error( err ) {}
