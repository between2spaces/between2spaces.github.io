export default class Client {

	constructor( serverUrl ) {

		this.serverURL = new URL( serverUrl );
		this.identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};

		this.listeners = {};
		this.callbacks = {};

		this.entityById = {};
		this.entitiesByParentId = {};
		this.entitiesByType = {};

		if ( this.identity.secret ) this.serverURL.search = `secret=${this.identity.secret}`;

		this.socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
            let ws;
            let clientTimeout = 10000;
            let heartbeat = 3333;
            let timeout;

            function connect() {
            
                clientMessage( 'connecting', { message: 'Connecting to ${this.serverURL}...' } );
            
                ws = new WebSocket( '${this.serverURL}' );
            
                ws.onclose = () => {
                    ws = null;
                    clientMessage( 'closed', { message: 'Socket closed. Reconnect attempt in 5 second.' } );
                    setTimeout( connect, 5000 );
                };
            
                ws.onerror = err => {
                    clientMessage( 'err', { error: 'Socket error. Closing socket.' } );
                    ws.close();
					clientMessage( 'disconnected' );
                };
            
                ws.onmessage = msg => {

                    let msgs = JSON.parse( msg.data );

					msgs = ( msgs.constructor !== Array ) ? [ msgs ] : msgs;
            
                    for ( const msg of msgs ) postMessage( msg );
            
                };
            
                timeout && clearTimeout( timeout );
                timeout = setTimeout( serverMessage, clientTimeout );
            
            }
            
            connect();
            
            onmessage = message => {
                serverMessage( message.data );
            };
            
            function serverMessage( message ) {
                timeout && clearTimeout( timeout );

				message = JSON.stringify( message );

                ws && ws.send( message );
                timeout = setTimeout( serverMessage, clientTimeout );
            }

			function clientMessage( type, data ) {
				const message = { type };
				if ( data ) message.data = data;
				postMessage( message );
			}

            setInterval( () => clientMessage( 'heartbeat' ), heartbeat );
        ` ] ) ) );


		this.socketWorker.onmessage = message => {

			message = message.data;

			if ( ! message )
				message = { type: 'error', message: `Invalid message '${message}'` };

			if ( ! ( 'type' in message ) )
				message = { type: 'error', message: `Undefined message type ${JSON.stringify( message )}'` };

			let type = message.type;

			if ( type === 'heartbeat' ) return;

			if ( ! ( message.type in this.listeners ) ) type = 'undefined';

			for ( let handler of this.listeners[ type ] ) handler( message );

		};


		this.listen( 'undefined', message => {

			console.log( message );

		} );

		this.listen( 'connecting', () => {

			this.entityById = {};
			this.entitiesByParentId = {};
			this.entitiesByType = {};

		} );


		this.listen( 'connected', message => {

			console.log( message );
			this.identity = { id: message.data.id, secret: message.data.secret };
			localStorage.setItem( 'client.identity', JSON.stringify( this.identity ) );

		} );


		this.listen( 'disconnected', message => {

			console.log( message );

		} );


		this.listen( 'entity', message => {

			const id = message.data.id;

			if ( ! ( id in this.entityById ) ) this.entityById[ id ] = { id };

			const entity = this.entityById[ id ];

			for ( const property of Object.keys( message.data ) ) {

				if ( property === 'id' ) continue;

				// if no change to property value, do nothing
				if ( message.data[ property ] === entity[ property ] ) continue;

				//
				// previous value cleanup steps....
				//

				// if parentId is changing, remove entity from existing parents list of children
				if ( property === 'parentId' && entity.parentId in this.entitiesByParentId ) {

					const siblings = this.entitiesByParentId[ entity.parentId ];
					const index = siblings.indexOf( entity );
					if ( index > - 1 ) siblings.splice( index, 1 );

				}

				// if type is changing, remove entity from types map
				if ( property === 'type' && entity.type in this.entitiesByType ) {

					const entitiesOfType = this.entitiesByType[ entity.type ];
					const index = entitiesOfType.indexOf( entity );
					if ( index > - 1 ) entitiesOfType.splice( index, 1 );

				}

				//
				// new value asignment
				//

				entity[ property ] = message.data[ property ];

				//
				// new value implications...
				//

				// if parentId has changed, add entity to parents list of children
				if ( property === 'parentId' ) {

					if ( ! ( entity.parentId in this.entitiesByParentId ) )
						this.entitiesByParentId[ entity.parentId ] = [];

					this.entitiesByParentId[ entity.parentId ].push( entity );

				}

				// if type has changed, add entity to types map
				if ( property === 'type' ) {

					if ( ! ( entity.type in this.entitiesByType ) ) this.entitiesByType[ entity.type ] = [];
					this.entitiesByType[ entity.type ].push( entity );

				}

			}

		} );


		this.listen( 'destroy', message => {

			const id = message.data.id;

			const entity = this.entityById[ id ];

			delete this.entityById[ id ];

			if ( id in this.entitiesByParentId ) {

				for ( let child in this.entitiesByParentId[ id ] ) {

					if ( entity.parentId in this.entitiesByParentId )
						this.entitiesByParentId[ entity.parentId ].push( child );

					child.parentId = entity.parentId;

				}

				delete this.entitiesByParentId[ id ];

			}

			const entitiesOfType = this.entitiesByType[ entity.type ];
			const index = entitiesOfType.indexOf( entity );
			if ( index > - 1 ) entitiesOfType.splice( index, 1 );

		} );


		this.listen( 'response', message => {

			if ( ! ( message.data.callback in this.callbacks ) )
				return console.log( `Response ${JSON.stringify( message )} recieved, but no matching callback '${message.data.callback}'` );

			this.callbacks[ message.data.callback ]( message.data.returnvalue );

		} );

	}


	/**
	 * Registers a handler for the specifed message type.
	 *
	 * @param type The message type
	 * @param handler The handler to call
	 */
	listen( messageType, handler ) {

		if ( ! ( messageType in this.listeners ) ) this.listeners[ messageType ] = [];

		this.listeners[ messageType ].push( handler );

	}

	/**
	 * Sends the message { type, to?, data?, callback? }.
	 */
	message( to, type, data, callback ) {

		const message = { type };

		if ( to ) message.to = to;
		if ( data ) message.data = data;

		if ( callback ) {

			this.callbacks[ message.callback = Client.uuid() ] = callback;

		}

		this.socketWorker.postMessage( message );

	}

	response( message, returnvalue ) {

		if ( message.callback )
			this.message( message.from, 'response', { callback: message.callback, returnvalue } );

	}

}


Client.uuid = () => {

	let id;
	while ( ! id || id in Client.usedUUIDs ) id = crypto.randomUUID().split( '-' )[ 0 ];
	return Client.usedUUIDs[ id ] = id;

};


Client.usedUUIDs = {};
