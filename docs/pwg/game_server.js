import Server from './server.js';
import * as url from 'node:url';
import fs from 'fs';


async function main() {

	const server = new Server( { allowedOrigins: [ 'http://localhost:8000', 'https://between2spaces.github.io' ] } );

	fs.readdir( './entities/', ( err, files = [] ) => {

		( async () => {

			for ( let file of files ) {

				if ( file.endsWith( '.js' ) ) {

					( await import( `./entities/${file}` ) ).main( server );

				}

			}

			server.run();

		} )();

	} );

}


url.fileURLToPath( import.meta.url ).replace( process.argv[ 1 ], '' ).replace( '.js', '' ) === '' && main();

