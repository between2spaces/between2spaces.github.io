export class Client {

	constructor( serverUrl ) {

		this.serverURL = new URL( serverUrl );
		this.identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};

		this.listener = {};

		if ( this.identity.secret ) this.serverURL.search = `secret=${this.identity.secret}`;

		this.socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
            let ws;
            let clientTimeout = 10000;
            let heartbeat = 3333;
            let timeout;

			const callbacks = {};
            
            function connect() {
            
                clientMessage( 'info', 'Connecting to ${this.serverURL}...' );
            
                ws = new WebSocket( '${this.serverURL}' );
            
                ws.onopen = () => clientMessage( 'info', 'Connected.' );
            
                ws.onclose = () => {
                    ws = null;
                    clientMessage( 'info', 'Socket closed. Reconnect attempt in 5 second.' );
                    setTimeout( connect, 5000 );
                };
            
                ws.onerror = err => {
                    clientMessage( 'info', 'Socket error. Closing socket.' );
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

				if ( typeof message === 'object' && 'callback' in message ) {
					callbacks[ message.callback ] = {
						timestamp: Date.now(),
						callback
					};
				}
				 
				message = JSON.stringify( message );

				console.log( '-> ' + message );

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
				return this.perform( { type: 'error', message: `Invalid message '${message}'` } );

			if ( ! ( 'type' in message ) )
				return this.perform( { type: 'error', message: `Undefined message type ${JSON.stringify( message )}'` } );

			this.perform( message );

		};




		this.listen( 'undefined', message => {

			console.log( message );

		} );


		this.listen( 'connected', message => {

			console.log( message );

			//this.identity = { id: message.id, secret: msg.secret };
			//localStorage.setItem( 'client.identity', JSON.stringify( this.identity ) );

			//this.onConnected( this.identity );

		} );


		this.listen( 'disconnected', message => {

			console.log( message );

		} );


		this.listen( 'entity', message => {

			console.log( message );
			/*
			const id = message.body.id;

			if ( ! ( id in Entity.byId ) ) new Entity( message.body );

			const entity = Entity.byId[ id ];

			for ( const property of Object.keys( message.body ) ) {

				property !== 'id' && entity.setProperty( property, message.body[ property ] );

			}
*/

		} );


		this.listen( 'purge', message => {

			console.log( message );

			//const entity = Entity.byId[ message.id ];
			//entity.purge();

		} );

	}

	/**
	 * Registers a handler for the specifed message type.
	 *
	 * @param type The message type
	 * @param handler The handler to call
	 */
	listen( type, handler ) {

		if ( ! ( type in this.listener ) ) this.listener[ type ] = {};

		this.listener[ type ] = handler;

	}

	/**
	 * Calls the matching listeners.
	 *
	 * @param message A message object
	 */
	perform( message ) {

		if ( ! ( message.type in this.listener ) ) return this.listener[ 'undefined' ]( message );

		return this.listener[ message.type ]( message );

	}

	/**
	 * Queues the specified message for delivery.
	 */
	message( type, to, message = {}, callback ) {

		message.type = type;

		if ( to ) message.to = to;

		if ( callback ) {

			message.callbackId = crypto.randomUUID().split( '-' )[ 0 ];

		}

		this.socketWorker.postMessage( message );

	}

}


Client.uuid = ( bytes = 4, id ) => {

	while ( ! id || id in Client.usedUUIDs ) id = crypto.randomBytes( bytes ).toString( 'hex' );
	return Server.usedUUIDs[ id ] = id;

};


Client.usedUUIDs = {};





export class Entity {

	constructor( args = {} ) {

		Entity.byId[ this.id = args.id ] = this;

	}

	setProperty( property, value ) {

		console.log( `setProperty( "${property}", ${value} )` );

		// if no change to property value, do nothing
		if ( this[ property ] === value ) return;

		// if parentId is changing, remove entity from existing parentId list
		if ( property === 'parentId' && this.parentId in Entity.byParentId ) {

			const index = Entity.byParentId[ this.parentId ].indexOf( this );
			if ( index > - 1 ) Entity.byParentId[ this.parentId ].splice( index, 1 );

		}

		// if type is changing, remove entity from existing type:id map
		if ( property === 'type' && this.type in Entity.byType ) {

			const entitiesOfType = Entity.byType[ this.type ];
			const index = entitiesOfType.indexOf( this );

			if ( index > - 1 ) entitiesOfType.splice( index, 1 );

		}

		// assign property value
		this[ property ] = value;

		// if parentId has changed, add entity to parentId list
		if ( property === 'parentId' && this.parentId ) {

			if ( ! ( this.parentId in Entity.byParentId ) ) Entity.byParentId[ this.parentId ] = [];
			Entity.byParentId[ this.parentId ].push( this );

		}

		// if type has changed, add entity to type:id map
		if ( property === 'type' ) {

			if ( ! ( this.type in Entity.byType ) ) Entity.byType[ this.type ] = [];
			const byType = Entity.byType[ this.type ];
			const index = byType.indexOf( this.type );
			if ( index === - 1 ) byType.push( this );

		}

	}

	purge() {

		delete Entity.byId[ this.id ];

		if ( this.id in Entity.byParentId ) delete Entity.byParentId[ this.id ];

		const entitiesOfType = Entity.byType[ this.type ];
		const index = entitiesOfType.indexOf( this );
		if ( index > - 1 ) entitiesOfType.splice( index, 1 );

		console.log( `${this.id} purged.` );

	}

	update() {

	}

}

Entity.byId = {};
Entity.byParentId = {};
Entity.byType = {};
