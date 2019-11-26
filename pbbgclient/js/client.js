( function () {

	const PBBG = window.PBBG = {};

	try {

		PBBG.cacheStorage = JSON.parse( localStorage.getItem( "PBBG" ) || "{}" );
		console.log( "(localStorage) " + JSON.stringify( PBBG.cacheStorage, null, 4 ) );

	} catch ( e ) { }

	PBBG.store = ( key, value ) => {

		if ( ! PBBG.cacheStorage.hasOwnProperty( key ) || ( typeof value !== "undefined" && value !== PBBG.cacheStorage[ key ] ) ) {

			PBBG.cacheStorage[ key ] = value;
			localStorage.setItem( "PBBG", JSON.stringify( PBBG.cacheStorage, null, 4 ) );
			console.log( "(localStorage) " + JSON.stringify( PBBG.cacheStorage, null, 4 ) );

		}

		return PBBG.cacheStorage[ key ];


	};


	PBBG.send = ( json ) => {

		if ( ! PBBG.ws || PBBG.ws.readyState === WebSocket.CLOSING || PBBG.ws.readyState === WebSocket.CLOSED ) {

			console.log( "Connecting to Primordial Soup" );

			PBBG.ws = new WebSocket( 'ws://primordial-soup.glitch.me' );

			PBBG.ws.addEventListener( 'message', ( event ) => {

				let message = JSON.parse( event.data );

				console.log( "(received) " + JSON.stringify( message, null, 4 ) );

				message.token && PBBG.store( "token", message.token );

				message.username && PBBG.store( "username", message.username );

				message.password && PBBG.store( "password", message.password );

				if ( message.error === "Auth token not valid" ) {

					let username = PBBG.store( "username" );

					if ( username.startsWith( "Guest-" ) ) {

						PBBG.send( { username: username, password: PBBG.store( "password" ) } );

					}

				}

			} );

		}

		json = json || {};

		function _send() {

			json.token = PBBG.store( "token" );
			let message = JSON.stringify( json, null, 4 );
			PBBG.ws.send( message );
			console.log( "(sent) " + message );

		}

		PBBG.ws.readyState === WebSocket.OPEN ? _send() : PBBG.ws.addEventListener( "open", _send );

	};

	PBBG.send();

} )();
