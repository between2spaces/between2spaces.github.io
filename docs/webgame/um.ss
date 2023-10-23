const in_browser = typeof window !== 'undefined';
const crypto = in_browser ? window.crypto : import( 'node:crypto' ).webcrypto;
const WebSocket = in_browser ? window.WebSocket : ( await import( 'ws' ) ).WebSocket;

const sockets = {};
const callbacks = {};
const caches = {};

function connect( client, url = `ws://localhost:${process.env.PORT}` ) {

client.interval ??= 10000;

let swp = [];

swpAddProperty( swp, 'dependencies', this.client );
swpAddProperty( swp, 'properties', this.client );
swpAddProperty( swp, 'defaults', this.client );

this.client.entity && swp.push( 'ent' );

console.log( swp );

this.socket = new WebSocket( url, swp );

this.socket.addEventListener( 'open', () => onOpen() );
this.socket.addEventListener( 'close', () => onClose() );
this.socket.addEventListener( 'message', ( msg ) => onMessage( msg.data ) );
this.socket.addEventListener( 'error', ( err ) => onError( err ) );

}


function	onOpen() {

this.cached && ( this.cached = this.socket.send( this.cached ) ? '' : '' );

const client = this.client;

client.update &&
( this.uiid ??= setInterval( () => client.update( client ), client.interval ) );

}

function	onClose() {}

function	onMessage( message ) {

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
console.error( `Warn:
	       ${this.client.name}.${fn} not found` );

}

function	call( target, fn, args = '' ) {

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

function	signal( target, fn, args = '' ) {

args = args?.constructor === Array ? args.join( '_' ) : `${args}`;

const msg = ( target ?? '' ) + '__' + fn + ( args ? `_${args}` : '' );

this.socket.readyState
? this.socket.send( msg )
: ( this.cached += ! this.cached ? msg : ';' + msg );

}

function	propertiesOf( name ) {

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

function	onError( error ) {}


function swpAddProperty( swp, property, client ) {

const arr = client[ property ];
arr?.length && swp.push( property + arr.join( '_' ).replace( ' ', '' ) );

}

export default const Client { connect, call, signal, propertiesOf };


