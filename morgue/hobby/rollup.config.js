import alias from 'rollup-plugin-alias';

const path = require( 'path' )

function glsl() {

    return {

        transform( code, id ) {

            if ( /\.glsl$/.test( id ) === false ) return

            var transformedCode = 'export default ' + JSON.stringify(
                code.replace( /[ \t]*\/\/.*\n/g, '' )           // remove //
                    .replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' )   // remove /* */
                    .replace( /\n{2,}/g, '\n' )                 // # \n+ to \n
            ) + ';'
            return {
                code: transformedCode,
                map: { mappings: '' }
            }

        }

    }

}

export default {
    input: 'client/src/main.js',
    plugins: [
        glsl(),
        alias( {
            client: path.join( __dirname, './client/src' ),
            threejs: path.join( __dirname, './client/src/threejs.0.95.0' )
        } ),
    ],
    output: {
        format: 'es',
        file: 'client/client.js',
        sourcemap: 'inline'
    }
}
