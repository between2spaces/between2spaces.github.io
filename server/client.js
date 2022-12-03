const serverURL = ( () => {

	let url = 'wss://daffodil-polite-seat.glitch.me/';
	if ( document.location.host === 'localhost:8000' ) url = 'ws://localhost:6500/';
	return new URL( url );

} )();

let identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};
if ( identity.secret ) serverURL.search = `secret=${identity.secret}`;


const socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
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
	ws && ws.send( message );
	timeout = setTimeout( sendServer, clientUnheardLimit );
}

function sendClient( json ) {
	postMessage( JSON.stringify( json ) );
}

setInterval( () => sendClient( { event: 'Heartbeat' } ), clientHeartbeat );
` ] ) ) );


socketWorker.onmessage = event => {

	const message = JSON.parse( event.data );
	const onevent = 'event' in message ? `on${message.event}` : 'id' in message ? 'onUpdate' : null;

	if ( 'log' in message ) console.log( message.log ); else if ( onevent !== 'onHeartbeat' ) console.log( message );

	if ( ! onevent ) return;

	try {

		eval( onevent )( message );

	} catch ( err ) {

		console.log( err );

	}

};


class Entity {

	constructor( data ) {

		this.id = data.id;
		this.type = data.type;

		if ( ! ( this.id in Entity.byId ) ) Entity.byId[ this.id ] = {};
		Entity.byId[ this.id ] = this;

	}

	static read( data ) {

		const entity = data.id in Entity.byId ? Entity.byId[ data.id ] : new Entity( data );
		entity.update( data );

	}

	update( data ) {

		for ( const property of Object.keys( data ) ) {

			const value = data[ property ];

			if ( property === 'id' || this[ property ] === value ) continue;

			if ( property === 'parentId' && this.parentId in Entity.byParentId ) {

				const index = Entity.byParentId[ this.parentId ].indexOf( this );
				if ( index > - 1 ) Entity.byParentId[ this.parentId ].splice( index, 1 );

			}

			if ( property === 'type' && this.type in Entity.byTypebyId && this.id in Entity.byTypebyId[ this.type ] )
				delete Entity.byTypebyId[ this.type ][ this.id ];

			this[ property ] = value;

			if ( property === 'parentId' && this.parentId ) {

				if ( ! ( this.parentId in Entity.byParentId ) ) Entity.byParentId[ this.parentId ] = [];
				Entity.byParentId[ this.parentId ].push( this );

			}

			if ( property === 'type' ) {

				if ( ! ( this.type in Entity.byTypebyId ) ) Entity.byTypebyId[ this.type ] = {};
				Entity.byTypebyId[ this.type ][ this.id ] = this;

			}

		}

	}

	setProperty( property, value ) {
	}

	destroy() {

	}

}

Entity.byId = {};
Entity.byTypebyId = {};
Entity.byParentId = {};
Entity.dirty = {};


function onConnect( message ) {

	identity = { id: message.id, secret: message.secret };
	//console.log( identity );
	localStorage.setItem( 'client.identity', JSON.stringify( identity ) );
	//read( message.world );

}


function onUpdate( message ) {

	Entity.read( message );

}


function onDestroy( message ) {

	if ( message.id in Entity.byId ) {

		const entity = Entity.byId[ message.id ];
		delete Entity.byId[ entity.id ];
		if ( entity.type in Entity.byTypebyId && entity.id in Entity.byTypebyId[ entity.type ] )
			delete Entity.byTypebyId[ entity.type ][ entity.id ];
		if ( entity.id in Entity.byParentId ) delete Entity.byParentId[ entity.id ];

	}

}


function onDisconnect( message ) {

}


function onHeartbeat( message ) {

}

