const http = require( "http" )
const https = require( "https" )
const url = require( "url" )
const path = require( "path" )
const fs = require( "fs" )
const websocket = require( "websocket" )

const global = {
    sessions: {},
    playersByName: {},
    local: {
        sunnyPlains: {
            playerNames: []
        }
    }
}

const main = () => {

    http.createServer( ( req, res ) => {
        // Redirect HTTP requests to HTTPS
        res.writeHead( 301, { "Location": "https://" + req.headers[ 'host' ] + req.url } );
        res.end();
    } ).listen( 80 )

    const httpsServer = https.createServer( {
        key: fs.readFileSync( "server/certs/key.pem" ),
        cert: fs.readFileSync( "server/certs/cert.pem" ),
        passphrase: "passphrase"
    }, ( req, res ) => {
        var uri = url.parse( req.url ).pathname
        var filename = path.join( process.cwd(), "client", uri )
        fs.exists( filename, function ( exists ) {
            if ( !exists ) {
                res.writeHead( 404, { "Content-Type": "text/plain" } )
                res.write( "404 Not Found\n" )
                res.end()
                return
            }
            if ( fs.statSync( filename ).isDirectory() ) filename += "/index.html"
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

    httpsServer.listen( 443, err => {
        if ( err ) return require( "server/utils" ).debug( null, err )
        require( "server/utils" ).debug( null, "Server runing at https://localhost" )
    } )

    const wsServer = new websocket.server( { httpServer: httpsServer } )

    wsServer.on( "request", request => {
        if ( "https://localhost" !== request.origin ) {
            let err = "Unauthorised origin " + request.origin + " rejected"
            console.log( err )
            request.reject( 403, err )
            return
        }
        let connection = request.accept( null, request.origin )
        connection.on( "close", () => { } )
        connection.on( "message", message => {
            if ( message.type !== "utf8" ) return   // accept only text
            try {
                message = JSON.parse( message.utf8Data )
            } catch ( err ) {
                console.log( " sent invalid JSON " + message.utf8Data )
                return
            }
            require( "server/router" ).receive( global, connection, message )
        } )
    } )

    require( "chokidar" ).watch( __dirname ).on( "all", function ( event, filepath ) {
        // live coding - purge servers modules from cache when any of them change
        let serverfiles = path.join( "server", "node_modules", "server" )
        if ( event !== "change" || filepath.indexOf( serverfiles ) === -1 ) return
        console.log( "CHANGED " + filepath + "; CLEARED require.cache" )
        for ( let filepath in require.cache ) {
            if ( filepath.indexOf( serverfiles ) > -1 ) delete require.cache[ filepath ]
        }
    } )
}

if ( require.main === module ) main()
