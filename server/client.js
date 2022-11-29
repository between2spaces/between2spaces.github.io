const serverURL = new URL( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://daffodil-polite-seat.glitch.me/' );
let identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};
if ( identity.secret ) serverURL.search = `secret=${identity.secret}`;

const socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
let ws;
let heartbeat = 3333;
let timeout;

function connect() {

	const postJSON = json => postMessage( JSON.stringify( json ) );

	postJSON( [ { log: 'Connecting to ${serverURL}...' } ] );

	ws = new WebSocket( '${serverURL}' );

	ws.onopen = () => postJSON( [ { log: 'Connected.' } ] );

	ws.onclose = () => {
		ws = null;
		postJSON( [ { log: 'Socket closed. Reconnect attempt in 5 second.' } ] );
		setTimeout( () => connect(), 5000 );
	};

	ws.onerror = err => {
		postJSON( [ { log: 'Socket error. Closing socket.' } ] );
		ws.close();
	};

	ws.onmessage = event => {

		const messages = JSON.parse( event.data );
		postJSON( messages );

	};

	setInterval( () => postJSON( [ { event: 'heartbeat' } ] ), heartbeat );
	timeout = setTimeout( () => ws.send( 0 ), heartbeat );
}

connect();

onmessage = event => {
	timeout && clearTimeout( timeout );
	ws && ws.send( event.data );
	timeout = setTimeout( () => ws.send( 0 ), heartbeat );
};
` ] ) ) );

socketWorker.onmessage = event => {

	const messages = JSON.parse( event.data );

	for ( const message of messages ) {

		if ( 'log' in message ) console.log( message.log ); else console.log( message );

		const funcName = 'event' in message ? `on${message.event}` : 'id' in message ? 'onupdate' : null;

		if ( ! funcName ) continue;

		try {

			eval( funcName )( message );

		} catch ( err ) {

			console.log( err );

		}

	}

};


class Entity {

	constructor( data ) {

		this.id = data.id;
		this.type = data.type;

		if ( ! ( this.id in Entity.byId ) ) Entity.byId[ this.id ] = {};
		Entity.byId[ this.id ] = Entity.dirty[ this.id ] = this;

	}

	static read( data ) {

		const entity = data.id in Entity.byId ? Entity.byId[ data.id ] : new Entity( data );
		entity.update( data );

	}

	update( data ) {

		for ( const property of Object.keys( data ) ) property !== 'id' && this.setProperty( property, data[ property ] );

	}

	setProperty( property, value ) {

		if ( this[ property ] === value ) return;

		if ( property === 'parentId' && this.parentId in Entity.byParentId ) {

			const index = Entity.byParentId[ this.parentId ].indexOf( this );
			if ( index > - 1 ) Entity.byParentId[ this.parentId ].splice( index, 1 );

		}

		if ( property === 'type' && this.type in Entity.byTypebyId && this.id in Entity.byTypebyId[ this.type ] )
			delete Entity.byTypebyId[ this.type ][ this.id ];

		this[ property ] = value;

		if ( property === 'parentId' && this.parentId ) {

			if ( ! ( this.parentId in Entity.byParentId ) ) Entity.byParentId[ this.parentId ] = [];
			Entity.byParentId.push( this );

		}

		if ( property === 'type' ) {

			if ( ! ( this.type in Entity.byTypebyId ) ) Entity.byTypebyId[ this.type ] = {};
			Entity.byTypebyId[ this.type ][ this.id ] = this;

		}


		Entity.dirty[ this.id ] = this;

	}

	destroy() {

		if ( this.id in Entity.byId ) delete Entity.byId[ this.id ];
		if ( this.type in Entity.byTypebyId && this.id in Entity.byTypebyId[ this.type ] )
			delete Entity.byTypebyId[ this.type ][ this.id ];
		if ( this.id in Entity.byParentId ) delete Entity.byParentId[ this.id ];
		if ( this.id in Entity.dirty ) delete Entity.dirty[ this.id ];

	}

}

Entity.byId = {};
Entity.byTypebyId = {};
Entity.byParentId = {};
Entity.dirty = {};


function onverified( message ) {

	identity = { id: message.id, secret: message.secret };
	console.log( identity );
	localStorage.setItem( 'client.identity', JSON.stringify( identity ) );
	//read( message.world );

}


function onupdate( message ) {

	Entity.read( message );

}


function ondestroy( message ) {

	message.id in Entity.byId && Entity.byId[ message.id ].destroy();

}


function ondisconnected( message ) {

}

function onheartbeat( message ) {


}
