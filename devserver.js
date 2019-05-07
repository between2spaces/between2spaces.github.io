const http = require( "http" )
const url = require( "url" )
const path = require( "path" )
const fs = require( "fs" )

const main = () => {

    process.on( 'SIGINT', function () {
        process.exit()
    } )

    http.createServer( ( req, res ) => {
        var uri = url.parse( req.url ).pathname
        let date = new Date
        let timestamp = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
        console.log( '[' + timestamp + '] GET ' + uri )
        var filename = path.join( process.cwd(), uri )
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
    } ).listen( 7708 )

    console.log( 'Serving up http://localhost:7708/' )

}

if ( require.main === module ) main()