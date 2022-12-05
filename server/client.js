class Client {

	constructor( serverUrl ) {

		this.entityId = {};
		this.entityTypeId = {};
		this.entityParentId = {};

		this.serverURL = new URL( serverUrl );
		this.identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};

		if ( this.identity.secret ) this.serverURL.search = `secret=${identity.secret}`;

		this.socketWorker = new Worker( SocketWorkerObjURL );

		this.socketWorker.onmessage = event => {

			const message = event.data;
			const onevent = 'event' in message ? `on${message.event}` : 'id' in message ? 'onUpdate' : null;

			if ( 'log' in message ) console.log( message.log ); else if ( onevent !== 'onHeartbeat' ) console.log( message );

			if ( ! onevent ) return;

			if ( onevent in this ) {

				this[ onevent ]( message );

			} else {

				console.log( `${onevent}( message ) not found` );

			}

		};

	}


	onConnect( message ) {

		this.identity = { id: message.id, secret: message.secret };
		localStorage.setItem( 'client.identity', JSON.stringify( this.identity ) );

	}


	onUpdate( data ) {

		if ( ! ( data.id in this.entityId ) ) {

			this.entityId[ data.id ] = new Entity();
			this.entityId[ data.id ].id = data.id;

		}

		const entity = this.entityId[ data.id ];

		for ( const property of Object.keys( data ) ) {

			const value = data[ property ];

			if ( property === 'id' || entity[ property ] === value ) continue;

			if ( property === 'parentId' && entity.parentId in this.entityParentId ) {

				const index = this.entityParentId[ entity.parentId ].indexOf( entity );
				if ( index > - 1 ) this.entityParentId[ entity.parentId ].splice( index, 1 );

			}

			if ( property === 'type' && entity.type in this.entityTypebyId && entity.id in this.entityTypebyId[ entity.type ] )
				delete this.entityTypebyId[ entity.type ][ entity.id ];

			entity[ property ] = value;

			if ( property === 'parentId' && entity.parentId ) {

				if ( ! ( entity.parentId in this.entityParentId ) ) this.entityParentId[ entity.parentId ] = [];
				this.entityParentId[ entity.parentId ].push( entity );

			}

			if ( property === 'type' ) {

				if ( ! ( entity.type in this.entityTypebyId ) ) this.entityTypeId[ entity.type ] = {};
				this.entityTypeId[ entity.type ][ entity.id ] = entity;

			}

		}

		this.onNewEntity( entity );

	}

	setProperty( entity, property, value ) {

	}

	destroy( entity ) {

	}

	onDestroy( message ) {

		if ( message.id in this.entityId ) {

			const entity = this.entityId[ message.id ];
			delete this.entityId[ entity.id ];
			if ( entity.type in this.entityTypeId && entity.id in this.entityTypeId[ entity.type ] )
				delete this.entityTypeId[ entity.type ][ entity.id ];
			if ( entity.id in this.entityParentId ) delete this.entityParentId[ entity.id ];

		}

	}


	onDisconnect( message ) {

	}


	onHeartbeat( message ) {

	}


	send( event, message ) {

		if ( event ) message.event = event;
		console.log( `<- ${JSON.stringify( message )}` );
		this.socketWorker.postMessage( message );

	}

}


const SocketWorkerObjURL = URL.createObjectURL( new Blob( [ `
let ws;
let clientHeartbeat = 1000;
let clientUnheardLimit = 10000;
let serverHeartbeat = 3333;
let timeout;

function connect() {

	sendClient( { log: 'Connecting to ${serverURL}...' } );

	ws = new WebSocket( '${serverURL}' );

	ws.onopen = () => sendClient( { log: 'Connected.' } );

	ws.onclose = () => {
		ws = null;
		sendClient( { log: 'Socket closed. Reconnect attempt in 5 second.' } );
		setTimeout( connect, 5000 );
	};

	ws.onerror = err => {
		sendClient( { log: 'Socket error. Closing socket.' } );
		ws.close();
	};

	ws.onmessage = event => {

		const messages = JSON.parse( event.data );

		for ( const message of messages ) {

			if ( 'clientUnheardLimit' in message ) clientUnheardLimit = message.clientUnheardLimit;
			if ( 'serverHeartbeat' in message ) serverHeartbeat = message.serverHeartbeat;

			sendClient( message );

		}

	};

	timeout && clearTimeout( timeout );
	timeout = setTimeout( sendServer, clientUnheardLimit );

}

connect();

onmessage = event => {
	sendServer( event.data );
};

function sendServer( message ) {
	timeout && clearTimeout( timeout );
	ws && ws.send( JSON.stringify( message ) );
	timeout = setTimeout( sendServer, clientUnheardLimit );
}

function sendClient( json ) {
	postMessage( json );
}

setInterval( () => sendClient( { event: 'Heartbeat' } ), clientHeartbeat );
` ] ) );


class Entity {

}


class WurmClient extends Client {

}


const client = new WurmClient( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://daffodil-polite-seat.glitch.me/' );

let player;

function move( dx, dy ) {

	send( 'Move', { dx, dy } );

}

document.addEventListener( 'keydown', event => {

	const key = event.key;

	if ( key === 'k' ) move( 0, - 1 );
	if ( key === 'k' ) move( 0, - 1 );
	if ( key === 'k' ) move( 0, - 1 );
	if ( key === 'k' ) move( 0, - 1 );

} );

