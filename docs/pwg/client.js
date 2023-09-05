export class Client {

	constructor( serverUrl ) {

		this.serverURL = new URL( serverUrl );
		this.identity = JSON.parse( localStorage.getItem( 'client.identity' ) ) || {};

		console.log( this.identity );

		if ( this.identity.secret ) this.serverURL.search = `secret=${this.identity.secret}`;

		this.socketWorker = new Worker( URL.createObjectURL( new Blob( [ `
            let ws;
            let clientTimeout = 10000;
            let serverHeartbeat = 3333;
            let clientHeartbeat = serverHeartbeat;
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
					postMessage( { _: 'disconnected' } );
                };
            
                ws.onmessage = msg => {

                    let msgs = JSON.parse( msg.data );

					msgs = ( msgs.constructor !== Array ) ? [ msgs ] : msgs;
            
                    for ( const msg of msgs ) {
            
                        if ( 'clientTimeout' in msg ) clientTimeout = msg.clientTimeout;
                        if ( 'serverHeartbeat' in msg ) serverHeartbeat = clientHeartbeat = msg.serverHeartbeat;
						if ( 'Reconnect' in msg ) setTimeout( connect, 0 );
            
                        postMessage( msg );
            
                    }
            
                };
            
                timeout && clearTimeout( timeout );
                timeout = setTimeout( sendServer, clientTimeout );
            
            }
            
            connect();
            
            onmessage = msg => {
                sendServer( msg.data );
            };
            
            function sendServer( msg ) {
                timeout && clearTimeout( timeout );
				const string = JSON.stringify( msg );
                ws && ws.send( string );
                timeout = setTimeout( sendServer, clientTimeout );
            }
            
            setInterval( () => postMessage( { _: 'clientHeartbeat' } ), clientHeartbeat );
        ` ] ) ) );

		this.socketWorker.onmessage = msg => {

			const _ = `_${msg.data._}`;

			this[ _ in this ? _ : '_undefined' ]( msg.data );

		};

	}

	send( msg ) {

		this.socketWorker.postMessage( msg );

	}

	onConnected() {
	}

	onDisconnected() {
	}

	onEntityUpdate( entity ) {
	}

	onEntityPurge( entity ) {
	}

	_clientHeartbeat() {
	}

	_log( msg ) {

		console.log( msg );

	}

	_undefined( msg ) {

		this._log( msg );

	}

	_connected( msg ) {

		this.identity = { id: msg.id, secret: msg.secret };
		localStorage.setItem( 'client.identity', JSON.stringify( this.identity ) );

		this.onConnected( this.identity );

	}

	_disconnected( msg ) {

		this.onDisconnected();

	}

	_entity( msg ) {

		const id = msg.entity.id;

		if ( ! ( id in Entity.byId ) ) new Entity( msg.entity );

		const entity = Entity.byId[ id ];

		for ( const property of Object.keys( msg.entity ) ) {

			property !== 'id' && entity.setProperty( property, msg.entity[ property ] );

		}

		this.onEntityUpdate( entity );

	}

	_purge( msg ) {

		const entity = Entity.byId[ msg.id ];
		entity.purge();
		this.onEntityPurge( entity );

	}

}




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
