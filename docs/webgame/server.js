import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";

const wss = new WebSocketServer( {
	port: process.env.PORT,
	verifyClient: ( info ) => [ undefined, "http://localhost:8000" ].indexOf( info.req.headers.origin ) > - 1,
} );

wss.on( "connection", ( ws, req ) => {

	const swp = req.headers[ "sec-websocket-protocol" ],
	index = swp.indexOf( "_" );

	if ( swp.substring( 0, index ) === "ID" ) {

		ws.id = swp.substring( index + 1 );
		if ( ! ws.id || ws.id in clients ){
			return console.error( `ERROR: Connection passed an invalid sec-websocket-protocol "${swp}"` );
		}

	}

	clients[ ws.id ] = { ws };

	ws.send( `${ws.id}__connected` );
	ws.on( "message", ( message ) => onMessage( ws, message ) );
	ws.on( "close", () => console.log( "WebSocket connection closed." ) );

} );


function onMessage( ws, message ) {

	console.log( `Received: '${message}'` );

	const requests = `${message}`.split( ";" );

	for ( const requestIndex in requests ) {

		const request = requests[ requestIndex ],
		index = request.indexOf( "_" ),
		id = request.substring( 0, index );

		if ( id in clients ) clients[ id ].ws.send( `${ws.id}_${request.substring( index + 1 )}` );

	}

}

export function connect( client ) {

	const id = client.id = client.id ?? uuid();
	const ws = websockets[ id ] = new WebSocket( `http://localhost:${process.env.PORT}`, `ID_${id}` );
	ws.on( "open", () => {} );
	ws.on( "message", ( message ) => {

		const args = `${message}`.split( "_" );
		args.callerId = args.shift();
		const callbackId = args.shift();
		if ( callbackId ) args.callbackId = callbackId;
		const fn = args.shift();
		let returnValue;
		if ( fn in callbacks ) {

			returnValue = callbacks[ fn ]( args );
		delete callbacks[ fn ];

		} else {

			if ( ! ( fn in client ) ) return console.error( `${id}.${fn} is not a function` );
			returnValue = client[ fn ]( args );

		}

		if ( args.callbackId ) call( client, args.callerId, args.callbackId, returnValue );

	} );
	ws.on( "close", () => delete websockets[ id ] );
	ws.on( "error", ( error ) => {} );

}

export function uuid() {

	let id;
	while ( ! id || id in usedUUIDs ) id = crypto.randomUUID().split( "-" )[ 0 ];
	usedUUIDs[ id ] = undefined;
	return id;

}


export function call( client, targetId, fn, args = undefined, callback = undefined ) {

	let message = targetId,
	callbackId = "";
	if ( callback ) callbacks[ callbackId = uuid() ] = callback;
	message += `_${callbackId}_${fn}`;
	if ( args ) message += args.constructor === Array ? `_${args.join( "_" )}` : `_${args}`;
	websockets[ client.id ].send( message );

}

const clients = {};
const websockets = {};
const callbacks = {};
const usedUUIDs = {};

fs.readdir( "./servernodes/", ( err, files = [] ) => {

	if ( err ) return console.log( err.message );

	for ( const file of files ) file.endsWith( ".js" ) && import( `./servernodes/${file}` );

} );

