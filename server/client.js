const serverURL = new URL( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://daffodil-polite-seat.glitch.me/' );
let identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) ?? {};
if ( identity.secret ) serverURL.search = `secret=${identity.secret}`;

const socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
function connect() {
	const postJSON = ( json ) => postMessage( JSON.stringify( json ) );
	postJSON( { log: 'Connecting to ${serverURL}...' } );
	const ws = new WebSocket( '${serverURL}' );
	ws.onopen = () => postJSON( { log: 'Connected.' } );
	ws.onclose = () => {
		postJSON( { log: 'Socket closed. Reconnect attempt in 5 second.' } );
		setTimeout( () => connect(), 5000 );
	};
	ws.onerror = ( err ) => {
		postJSON( { log: 'Socket error. Closing socket.' } );
		ws.close();
	};
	ws.onmessage = ( msg ) => postJSON( JSON.parse( msg.data ) );
}
connect();
` ] ) ) );

socketWorker.onmessage = ( msg ) => {
	msg = JSON.parse( msg.data );
	console.log( msg );
//	if ( 'log' in msg ) console.log( msg.log ); else console.log( msg );
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

};

function onverified( message ) {

	identity = { id: message.id, secret: message.secret };
	localStorage.setItem( 'client.identity', JSON.stringify( identity ) );
	read( message.world );

}


