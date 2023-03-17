
window.WebSocket = window.WebSocket || window.MozWebSocket
const connection = new WebSocket( 'wss://localhost' )
connection.onopen = () => {
    let sessionId = null
    try {
        sessionId = localStorage.getItem( "sessionId" )
    } catch ( err ) { }
    send( "login", { sessionId: sessionId } )
}
connection.onerror = err => {
    receive( "login", { connectionHelp: "Connection with server lost." } )
}
setInterval( () => { if ( connection.readyState !== 1 ) { connection.onerror() } }, 10000 )

connection.onmessage = message => {
    try { message = JSON.parse( message.data ) } catch ( e ) { return console.log( 'ERROR', 'Invalid JSON ' + message.data ) }
    console.log( message )
    let requests = Object.keys( message )
    for ( let i = 0; i < requests.length; i++ ) {
        receive( requests[ i ], message[ requests[ i ] ] )
    }
}


const receive = ( request, params ) => {
    if ( typeof routes[ request ] !== "object" ) {
        console.log( '"' + request + '" request unhandled.' )
    } else {
        console.log( '"' + request + '" <- ' + JSON.stringify( params ) )
    }
    routes[ request ].receive( params )
}

const send = ( request, params ) => {
    if ( typeof routes[ request ] !== "object" ) {
        console.log( '"' + request + '" request unhandled.' )
    } else {
        console.log( '"' + request + '" -> ' + JSON.stringify( params ) )
    }
    routes[ request ].send( params )
}