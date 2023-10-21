const crypto = window ? window.crypto : require( 'node:crypto' ).webcrypto;

export default class Client {

	constructor( client ) {

		this.socket = null;
		this.client = client;
		this.client.interval ??= 10000;
		this.callbacks = {};
		this.cached = '';

	}

	connect( url = `ws://localhost:${process.env.PORT}` ) {

		const swp = [ ( this.client.name = this.client.name || '' ) ];

		swpAddProperty( swp, 'dependencies', this.client );
		swpAddProperty( swp, 'properties', this.client );
		swpAddProperty( swp, 'defaults', this.client );

		this.client.entity && swp.push( 'ent' );

		this.socket = new WebSocket( url, swp );
		this.socket.addEventListener( 'open', this.onOpen );
		this.socket.addEventListener( 'close', this.onClose );
		this.socket.addEventListener( 'message', ( message ) =>
			this.onMessage( message.data )
		);
		this.socket.addEventListener( 'error', this.onError );

	}

	send( message ) {

		this.socket.send( JSON.stringify( { message } ) );

	}

	onOpen() {

		this.cached && ( this.cached = this.send( this.cached ) ? '' : '' );

		const client = this.client;

		client.update &&
			( this.uiid ??= setInterval( () => client.update( client ), client.interval ) );

	}

	onClose() {}

	onMessage( message ) {

		const [ callerId, cid, fn, ...args ] = message.toString().split( '_' );

		if ( fn in this.callbacks ) {

			console.log( `callbacks[ '${fn}' ].resolve` );
			this.callbacks[ fn ].resolve( args );
			delete this.callbacks[ fn ];
			return;

		}

		if ( fn in this.client ) {

			return this.client[ fn ]( this.client, args );

		}

		this.client.debug &&
			console.error( `Warn: ${this.client.name}.${fn} not found` );

	}

	call( target, fn, args = '' ) {

		const cid = crypto.randomUUID().split( '-' )[ 0 ];

		args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

		this.callbacks[ cid ] = {};

		const msg =
			( target ?? '' ) + '_' + cid + '_' + fn + ( args ? `_${args}` : '' );

		return new Promise( function ( resolve, reject ) {

			this.callbacks[ cid ].resolve = resolve;
			this.callbacks[ cid ].reject = reject;

			this.socket.readyState
				? this.socket.send( msg )
				: ( this.cached += ! this.cached ? msg : ';' + msg );

		} );

	}

	signal( target, fn, args = '' ) {

		args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

		const msg = ( target ?? '' ) + '__' + fn + ( args ? `_${args}` : '' );

		this.socket.readyState
			? this.socket.send( msg )
			: ( this.cached += ! this.cached ? msg : ';' + msg );

	}

	propertiesOf( name ) {

		return new Promise( ( resolve, reject ) =>
			name in this.cachedProperties ? resolve() : reject()
		).then(
			() => this.cachedProperties[ name ],
			() =>
				this.call( 'Entity', 'properties', 'Tree' ).then( ( properties ) => {

					const propertyMap = ( this.cachedProperties[ name ] = {} );

					for ( let index in properties ) {

						propertyMap[ properties[ index ] ] = parseInt( index );

					}

					return propertyMap;

				} )
		);

	}

	onError( error ) {}

}

function swpAddProperty( swp, property, client ) {

	const arr = client[ property ];
	arr?.length && swp.push( property + arr.join( '_' ).replace( ' ', '' ) );

}
