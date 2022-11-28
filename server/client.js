const serverURL = new URL( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://daffodil-polite-seat.glitch.me/' );
let identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};
if ( identity.secret ) serverURL.search = `secret=${identity.secret}`;

const socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
function connect() {

	const postJSON = json => postMessage( JSON.stringify( json ) );

	postJSON( [ { log: 'Connecting to ${serverURL}...' } ] );

	const ws = new WebSocket( '${serverURL}' );

	ws.onopen = () => postJSON( [ { log: 'Connected.' } ] );

	ws.onclose = () => {
		postJSON( [ { log: 'Socket closed. Reconnect attempt in 5 second.' } ] );
		setTimeout( () => connect(), 5000 );
	};

	ws.onerror = err => {
		postJSON( [ { log: 'Socket error. Closing socket.' } ] );
		ws.close();
	};

	ws.onmessage = msg => postJSON( JSON.parse( msg.data ) );

}
connect();
` ] ) ) );

socketWorker.onmessage = messages => {

	messages = JSON.parse( messages.data );

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

function onverified( message ) {

	identity = { id: message.id, secret: message.secret };
	console.log( identity );
	localStorage.setItem( 'client.identity', JSON.stringify( identity ) );
	//read( message.world );

}


function onupdate( message ) {

	Entity.read( message );

}


class Entity {

	constructor( data ) {

		this.id = data.id;
		this.type = data.type;

		if ( ! ( this.id in Entity.byId ) ) Entity.byId[ this.id ] = {};
		Entity.byId[ this.id ] = Entity.dirty[ this.id ] = this;

	}

	static read( data ) {

		console.log( data );

		const id = data.id;
		let entity = null;

		if ( id in Entity.byId ) {

			entity = Entity.byId[ id ];

		} else {

			entity = new Entity( data );

		}

		entity.update( data );

		console.log( this );

	}

	update( data ) {

		for ( const property of Object.keys( data ) ) {

			if ( property !== 'id' ) this.setProperty( property, data[ property ] );

		}

	}

	setProperty( property, value ) {

		if ( this[ property ] === value ) return;

		if ( property === 'parentId' ) {

			if ( this.parentId in Entity.byParentId ) {

				const index = Entity.byParentId[ this.parentId ].indexOf( this );
				if ( index > - 1 ) Entity.byParentId[ this.parentId ].splice( index, 1 );

			}

		}

		if ( property === 'type' ) {

			if ( this.type in Entity.byType ) {

				const index = Entity.byType[ this.type ].indexOf( this );
				if ( index > - 1 ) Entity.byType[ this.type ].splice( index, 1 );

			}

		}

		this[ property ] = value;

		if ( property === 'parentId' ) {

			if ( this.parentId ) {

				if ( ! ( this.parentId in Entity.byParentId ) ) Entity.byParentId[ this.parentId ] = [];
				Entity.byParentId.push( this );

			}

		}

		if ( property === 'type' ) {

			if ( ! ( this.type in Entity.byType ) ) Entity.byType[ this.type ] = [];
			Entity.byType[ this.type ].push( this );

		}

		Entity.dirty[ this.id ] = this;

	}

	destroy() {

		if ( this.id in Entity.byId ) delete Entity.byId[ this.id ];

		if ( this.type in Entity.byType ) {

			const index = Entity.byType[ this.type ].indexOf( this );
			if ( index > - 1 ) Entity.byType[ this.type ].splice( index, 1 );

		}

		if ( this.id in Entity.byParentId ) delete Entity.byParentId[ this.id ];
		if ( this.id in Entity.dirty ) delete Entity.dirty[ this.id ];

	}

}

Entity.byId = {};
Entity.byType = {};
Entity.byParentId = {};
Entity.dirty = {};
