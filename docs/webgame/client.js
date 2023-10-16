connect( {
	serverURL: 'ws://localhost:6500',
	config: ( name ) => {

		console.log( name );

	},
	update: () => {

		console.log( 'update...' );

	},
	entity: ( entity ) => {

		console.log( entity );

	},
} );


function connect( client ) {

	client.name = client.name || '$UUID';

	const swp = [ client.name ];

	if ( client.dependencies && client.dependencies.length ) swp.push( 'dep_' + client.dependencies.join( '_' ).replace( ' ', '' ) );
	if ( client.entity ) swp.push( 'ent' );

	connect.socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
	let ws;
	let timeout;
	let clientTimeout = 10000;
	let cachedMessages = '';

	function connect() {

		postMessage( [ 'Client', '', 'debug', 'connecting' ] );

		ws = new WebSocket( '${client.serverURL}', ${JSON.stringify( swp )} );

		ws.onopen = () => {
			if ( cachedMessages ) {
				send( cachedMessages );
				cachedMessages = '';
			}
			if ( ${client.update ? true : false} ) {
				setInterval( () => postMessage( [ 'Client', '', 'update' ] ), ${client.updateInterval || 10000} );
			}
		};

		ws.onclose = () => {
			ws = null;
			postMessage( [ 'Client', '', 'closed' ] );
			setTimeout( connect, 5000 );
		};

		ws.onerror = err => {
			postMessage( [ 'Client', '', 'error' ] );
			ws.close();
		};

		ws.onmessage = messages => {
			messages = messages.data.split( ';' );
			for ( let message of messages ) postMessage( message.split( '_' ) );
		};

		timeout && clearTimeout( timeout );
		timeout = setTimeout( send, clientTimeout );

	}

	onmessage = message => {
		send( message.data );
	};

	function send( message ) {
		timeout && clearTimeout( timeout );
		if ( ! ws || ! ws.readyState ) return cachedMessages += ( ! cachedMessages ) ? message : ';' + message;
		ws && ws.send( JSON.stringify( message ) );
		timeout = setTimeout( send, clientTimeout );
	}

	connect();
` ] ) ) );


	connect.socketWorker.onmessage = message => {

		const [ callerId, callbackId, fn, ...args ] = message.data;

		if ( 'config' === fn ) client.name = args[ 0 ];
		if ( 'debug' === fn ) console.log( 'debug', args );

		if ( fn in client ) {

			const returnValue = client[ fn ]( args );
			return callbackId && call( callerId, callbackId, returnValue );

		}

		console.error( `${client.name}.${fn} is not a function` );

	};

}


function call( targetId, fn, args = undefined, callback = undefined ) {

	let callbackId = '';

	if ( callback ) {

		if ( ! call.backs ) call.backs = {};
		while ( ! callbackId || callbackId in call.backs ) callbackId = crypto.randomUUID().split( '-' )[ 0 ];
		call.backs[ callbackId ] = callback;

	}

	const message = ( targetId ?? '' ) + '_' + callbackId + '_' + fn + ( args ? args.constructor === Array ? '_' + args.join( '_' ) : `_${args}` : '' );

	connect.socketWorker.postMessage( message );

}
