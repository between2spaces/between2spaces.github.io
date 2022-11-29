function onverified( message ) {

	identity = { id: message.id, secret: message.secret };
	localStorage.setItem( 'client.identity', JSON.stringify( identity ) );
	read( message.world );

}

function ondestroy( message ) {

	if ( message.id in entitiesById ) entitiesById[ message.id ].destroy();

}

function onconnected( message ) {

}

function ondisconnected( message ) {

}

function onupdate( message ) {

	read( message );

}

function read( entityData ) {

	console.log( 'read', entityData );

	const id = entityData.id;
	let entity = null;

	if ( id in entitiesById ) {

		entity = entitiesById[ id ];

	} else {

		try {

			const Class = eval( entityData.type );
			entity = new Class( entityData );

		} catch ( err ) {

			console.log( `Unknown type "${entityData.type}"`, err );

		}

	}

	entity.update( entityData );

	if ( 'contents' in entityData ) for ( const content of entityData.contents ) read( content );

}

const entitiesById = {};
const entitiesByType = {};

class Entity {

	constructor( args = {} ) {

		Object.assign( this, args );

		this.name || ( this.name = '[Unnamed]' );
		this.parent = null;
		this.contents = [];

		if ( ! ( this.type in entitiesByType ) ) entitiesByType[ this.type ] = {};
		entitiesByType[ this.type ][ this.id ] = entitiesById[ this.id ] = this;

		if ( args.parent in entitiesById ) entitiesById[ args.parent ].add( this );

	}

	setProperty( property, value ) {

		property === 'parent' ? entitiesById[ value ].add( this ) : this[ property ] = value;
		const onproperty = `on${property}`;
		try {

			if ( onproperty in this ) this[ onproperty ]( value );

		} catch ( e ) {

			console.log( e );

		}

	}

	forContent( type, callback ) {

		if ( typeof type === 'function' ) {

			callback = type;
			type = null;

		}

		if ( ! type ) {

			for ( const content of this.contents ) callback( content );
			return;

		}

		for ( const content of this.contents ) content.type === type && callback( content );

	}

	add( entity ) {

		console.log( `add ${entity.name}(${entity.id}) -> ${this.name}(${this.id})` );

		console.log( `entity.parent = ${entity.parent}` );

		if ( entity.parent === this ) return;
		if ( entity.parent ) {

			const index = entity.parent.contents.indexOf( entity );
			if ( index > - 1 ) entity.parent.contents.splice( index, 1 );

		}

		entity.parent = this;
		this.contents.push( entity );

		return entity;

	}

	destroy() {

		if ( this.parent ) {

			for ( const content of this.contents ) this.parent.add( content, true );
			const siblings = this.parent.contents;
			const index = siblings.indexOf( this );
			if ( index > - 1 ) siblings.splice( index, 1 );

		}

	}

	update( data ) {

		for ( const p of Object.keys( data ) ) {

			if ( p !== 'id' && p !== 'type' && p !== 'contents' ) this.setProperty( p, data[ p ] );

		}

	}

}

let outMessages = [];

function send( message ) {

	outMessages.push( message );

}

let identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};

if ( identity.secret ) serverURL.search = `secret=${identity.secret}`;


//onmessage = () => setInterval( () => postMessage( 0 ), ${message.heartbeat} );

const SocketWorkerProg = `
const serverURL = new URL( '${document.location.host}' === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://daffodil-polite-seat.glitch.me/' );
function connect() {
	const postJSON = ( json ) => postMessage( JSON.stringify( json ) );
	postJSON( { log: 'Connecting to ' + serverURL + '...' } );
	const ws = new WebSocket( serverURL );
	ws.onopen = () => postJSON( { log: 'Connected.' } );
	ws.onclose = () => {
		postJSON( { log: 'Socket closed. Reconnect attempt in 5 second.' } );
		setTimeout( () => connect(), 5000 );
	};
	ws.onerror = ( err ) => {
		postJSON( { log: 'Socket error. Closing socket.' } );
		ws.close();
	};
	ws.onmessage = ( msg ) => postJSON( { log: msg } );
}
connect();
`;

var socketWorker = new Worker( URL.createObjectURL( new Blob( [ SocketWorkerProg ] ) ) );
socketWorker.onmessage = ( msg ) => {

	msg = JSON.parse( msg.data );
	if ( 'log' in msg ) {

		console.log( msg.log );

	}
	//socket.send( JSON.stringify( outMessages ) ); outMessages = [];

};
//socketWorker.postMessage( 0 );


// const socket = new WebSocket( serverURL );
// socket.onopen = () => console.log( `Connected to ${serverURL}` );
// socket.onclose = () => setTimeout( () => window.location.replace( window.location.href ), 1000 );
// socket.onmessage = ( e ) => {
//	const messages = JSON.parse( e.data );
//	console.log( 'Messages from server ', messages );
//	for ( const message of messages ) {
//		const funcName = '_' in message ? `on${message._}` : 'onupdate';
//		try {
//			eval( funcName )( message );
//		} catch ( err ) {
//			console.log( err );
//		}
//	}
// }

