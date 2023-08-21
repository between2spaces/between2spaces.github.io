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
            
                sendClient( { log: 'Connecting to ${this.serverURL}...' } );
            
                ws = new WebSocket( '${this.serverURL}' );
            
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
            
                        if ( 'clientTimeout' in message ) clientTimeout = message.clientTimeout;
                        if ( 'serverHeartbeat' in message ) serverHeartbeat = message.serverHeartbeat;
            
                        sendClient( message );
            
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
                ws && ws.send( JSON.stringify( message ) );
                timeout = setTimeout( sendServer, clientTimeout );
            }
            
            function sendClient( json ) {
                postMessage( json );
            }
            
            setInterval( () => sendClient( { event: 'ClientHeartbeat' } ), clientHeartbeat );
        ` ] ) ) );

		this.socketWorker.onmessage = event => {

			const message = event.data;

			const onevent = 'event' in message ? `on${message.event}` : 'id' in message ? 'onUpdate' : null;

			if ( onevent !== 'onClientHeartbeat' ) console.log( message );

			if ( ! onevent ) return;

			if ( onevent in this ) {

				this[ onevent ]( message );

			} else {

				console.log( `${onevent}( message ) not found` );

			}

		};

	}

	onIdentity( message ) {

		this.identity = { id: message.id, secret: message.secret };
		localStorage.setItem( 'client.identity', JSON.stringify( this.identity ) );

	}

	onConnect( message ) {

	}

	onUpdate( delta ) {

	}

}


const client = new Client( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://daffodil-polite-seat.glitch.me/' );
