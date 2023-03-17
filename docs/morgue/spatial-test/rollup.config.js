import alias from 'rollup-plugin-alias'

const path = require( 'path' )

export default {
    input: 'src/main.js',
    plugins: [
        alias( {
            src: path.join( __dirname, './src' ),
            threejs: path.join( __dirname, './lib/threejs-92' ),
            rbush: path.join( __dirname, './lib/rbush-2.0.2' ),
        } ),
    ],
    output: {
        file: 'dist/build.js',
        format: 'es',
        sourcemap: 'inline',
    }
}
