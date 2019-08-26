const main = () => {
    const global = {
        log: require( './log' )
    }
    process.on( 'SIGINT', () => {
        global.log( 'SIGINT received, stopping...' )
        process.exit()
    } )
    const httpserver = require( 'http' ).createServer( ( req, res ) => {
        if ( req.url === '/' || req.url === '/index.html' || req.url === '/index.htm' ) {
            res.writeHead( 200, { "Content-Type": "text/plain" } )
            res.write( "PBBG\n" )
        } else if ( req.url === '/favicon.ico' ) {
            res.writeHead( 200, { "Content-Type": "image/gif" } )
            res.write( 'base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw' )
        } else {
            res.writeHead( 302, { 'Location': '/' } )
        }
        res.end()
    } ).listen( process.env.PORT || 8108 )
    const websocket = require( 'ws' );
    ( new websocket.Server( { server: httpserver } ) ).on( 'connection', ws => {
        ws.on( 'message', message => {
            try {
                delete require.cache[ require.resolve( './message' ) ]// dev only; no cache
                require( './message' ).message( global, ws, JSON.parse( message ) )
            } catch ( err ) {
                global.log( err )
            }
        } )
    } )
    global.log( 'Listening on http://localhost:8108/' )
}
if ( require.main === module ) main()