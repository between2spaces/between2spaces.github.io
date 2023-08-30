export default class Client {

	constructor( serverUrl ) {

		this.serverURL = new URL( serverUrl );
		this.identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};

		console.log( this.identity );

		if ( this.identity.secret ) this.serverURL.search = `secret=${this.identity.secret}`;

		this.socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
            let ws;
            let clientHeartbeat = 1000;
            let clientTimeout = 10000;
            let serverHeartbeat = 3333;
            let timeout;
            
            function connect() {
            
                postMessage( { log: 'Connecting to ${this.serverURL}...' } );
            
                ws = new WebSocket( '${this.serverURL}' );
            
                ws.onopen = () => postMessage( { log: 'Connected.' } );
            
                ws.onclose = () => {
                    ws = null;
                    postMessage( { log: 'Socket closed. Reconnect attempt in 5 second.' } );
                    setTimeout( connect, 5000 );
                };
            
                ws.onerror = err => {
                    postMessage( { log: 'Socket error. Closing socket.' } );
                    ws.close();
                };
            
                ws.onmessage = event => {

                    let messages = JSON.parse( event.data );

					messages = ( messages.constructor !== Array ) ? [ messages ] : messages;
            
                    for ( const message of messages ) {
            
                        if ( 'clientTimeout' in message ) clientTimeout = message.clientTimeout;
                        if ( 'serverHeartbeat' in message ) serverHeartbeat = message.serverHeartbeat;
						if ( 'Reconnect' in message ) setTimeout( connect, 0 );
            
                        postMessage( message );
            
                    }
            
                };
            
                timeout && clearTimeout( timeout );
                timeout = setTimeout( sendServer, clientTimeout );
            
            }
            
            connect();
            
            onmessage = event => {
                sendServer( event.data );
            };
            
            function sendServer( message ) {
                timeout && clearTimeout( timeout );
				const string = JSON.stringify( message );
				postMessage( { event: 'Debug', sent: '--> "' + string + '"' } );
                ws && ws.send( string );
                timeout = setTimeout( sendServer, clientTimeout );
            }
            
            setInterval( () => postMessage( { event: 'ClientHeartbeat' } ), clientHeartbeat );
        ` ] ) ) );

		this.socketWorker.onmessage = event => {

			const message = event.data;

			const fn = `_${message.fn}`;

			this[ fn in this ? fn : '_undefined' ]( message );

		};

	}

	send( message ) {

		this.socketWorker.postMessage( message );

	}

	_log( message ) {

		console.log( message );

	}

	_debug( message ) {

		this._log( message );

	}

	_warn( message ) {

		this._log( message );

	}

	_error( message ) {

		this._log( message );

	}

	_success( message ) {

		this._log( message );

	}

	_undefined( message ) {

		this._log( message );

	}

	_identity( message ) {

		this.identity = { id: message.id, secret: message.secret };
		localStorage.setItem( 'client.identity', JSON.stringify( this.identity ) );

	}

	_connect( message ) {

	}

	_update( message ) {

	}

}


window.client = new Client( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://knowing-laced-tulip.glitch.me/' );

//window.client = new Client( 'wss://knowing-laced-tulip.glitch.me/' );
