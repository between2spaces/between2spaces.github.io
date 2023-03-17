const http = require( "http" );
const fs = require( "fs" );
const path = require( "path" );

process.on( "SIGINT", () => {

    process.exit();

} );

http.createServer( ( req, res ) => {

    let filepath = req.url.match( '^[^?]*' )[ 0 ];

    if ( /\/$/.test( filepath ) ) {

        filepath = filepath + "index.html";

    }

    console.log( filepath );

    fs.createReadStream( path.join( __dirname, filepath ) )
        .on( "error", () => {

            res.writeHead( 404 );
            res.end();

        } )
        .pipe( res );

} )
.on( "error", err => {

    console.log( err );

} )
.listen( 9999 );

