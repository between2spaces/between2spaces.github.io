const http = require( "http" )
const url = require( "url" )
const path = require( "path" )
const fs = require( "fs" )
const websocket = require( "websocket" )

const clients = []

const httpServer = http.createServer( ( req, res ) => {
    var uri = url.parse( req.url ).pathname
    var filename = path.join( process.cwd(), uri )
    fs.exists( filename, function ( exists ) {
        if ( !exists ) {
            res.writeHead( 404, { "Content-Type": "text/plain" } )
            res.write( "404 Not Found\n" )
            res.end()
            return
        }
        if ( fs.statSync( filename ).isDirectory() ) {
            filename += "/index.html"
        }
        fs.readFile( filename, "binary", ( err, file ) => {
            if ( err ) {
                res.writeHead( 500, { "Content-Type": "text/plain" } )
                res.write( err + "\n" )
                res.end()
                return
            }
            res.writeHead( 200 )
            res.write( file, "binary" )
            res.end()
        } )
    } )
} )

httpServer.listen( 80, err => {
    console.log( err ? err : "Server runing at http://localhost" )
} )

const wsServer = new websocket.server( { httpServer: httpServer } )

wsServer.on( "request", request => {
    if ( "http://localhost" !== request.origin ) {
        let err = "Unauthorised origin " + request.origin + " rejected"
        console.log( err )
        request.reject( 403, err )
        return
    }
    let connection = request.accept( null, request.origin )
    clients.push( connection )
    console.log( "New player has connected" )
    connection.on( "close", () => {
        console.log( "Player has disconnected" )
        let index = clients.indexOf( this )
        if ( index === -1 ) {
            return console.log( "Player not found" )
        }
        players.splice( index, 1 )
        broadcast( "disconnected", { id: this.id } )
    } )
    connection.on( "message", message => {
        if ( message.type !== "utf8" ) {
            return
        }
        try {
            message = JSON.parse( message.utf8Data )
        } catch ( err ) {
            return console.log( " sent invalid JSON " + message.utf8Data )
        }
    } )
} )

function broadcast( type, data ) {
    let json = JSON.stringify( { type: type, data: data } )
    for ( var i = 0; i < clients.length; i++ ) {
        clients[ i ].sendUTF( json )
    }
}
