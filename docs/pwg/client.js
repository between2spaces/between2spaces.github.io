export default class Client {

	constructor( serverUrl ) {

		this.serverURL = new URL( serverUrl );
		this.identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};

		this.listeners = {};

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
						callback: message.callback
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
				message = { type: 'error', message: `Invalid message '${message}'` };

			if ( ! ( 'type' in message ) )
				message = { type: 'error', message: `Undefined message type ${JSON.stringify( message )}'` };

			let type = message.type;

			if ( ! ( message.type in this.listeners ) ) type = 'undefined';

			for ( let handler of this.listeners[ type ] ) handler( message );

		};


		this.listen( 'undefined', message => {

			console.log( message );

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

		if ( callback ) message.callback = Client.uuid();

		this.socketWorker.postMessage( message );

	}

}


Client.uuid = () => {

	let id;
	while ( ! id || id in Client.usedUUIDs ) id = crypto.randomUUID().split( '-' )[ 0 ];
	return Client.usedUUIDs[ id ] = id;

};


Client.usedUUIDs = {};



