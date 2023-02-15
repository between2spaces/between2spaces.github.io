const canvas = document.createElement( "canvas" );
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.append( canvas );

const charUVs = {};


function generateImage( characters, texWidth = 512, texHeight = 512, fontFamily = "monospace" ) {

	const canvas = document.createElement( "canvas" );
	canvas.style.border = "1px solid black";

	canvas.width = texWidth;
	canvas.height = texHeight;

	const ctx = canvas.getContext( "2d" );

	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	let fontSize = 199;
	let metrics;
	let rows;
	let cols;

	do {

		fontSize --;
		ctx.font = `${fontSize}px ${fontFamily}`;
		metrics = ctx.measureText( "▓" );
		metrics.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 10;
		rows = Math.floor( texHeight / metrics.height );
		cols = Math.floor( texWidth / metrics.width );

	} while ( rows * cols < characters.length );

	let i = 0;

	for ( let cy = Math.ceil( 0.5 * metrics.height ); cy < texHeight; cy += metrics.height ) {

		for ( let cx = Math.ceil( 0.5 * metrics.width ); cx < texWidth - 0.5 * metrics.width; cx += metrics.width ) {

			if ( i >= characters.length ) break;

			let char = characters[ i ++ ];

			ctx.fillText( char, cx, cy );

			let left = ( cx - 0.5 * metrics.width + 3 ) / texWidth;
			let top = ( cy - metrics.actualBoundingBoxAscent + 3 ) / texHeight;
			let right = ( cx + 0.5 * metrics.width - 3 ) / texWidth;
			let bottom = ( cy + metrics.actualBoundingBoxDescent - 3 ) / texHeight;

			charUVs[ char ] = [ left, bottom, left, top, right, bottom, right, top ];


		}

	}

	document.body.append( canvas );

	return canvas;

}

const image = generateImage( "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕", 1024, 1024 );


const gl = canvas.getContext( "webgl", { antialias: false } );
const ext = gl.getExtension( "GMAN_debug_helper" );
if ( ext ) {

	ext.setConfiguration( {
		maxDrawCalls: 2000,
		failUnsetSamplerUniforms: true,
	} );

}



gl.viewport( 0, 0, canvas.width, canvas.height );
gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
gl.clearDepth( 1.0 );
gl.disable( gl.DEPTH_TEST );
gl.enable( gl.BLEND );
gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

const cols = 1;
const rows = cols;

let right = cols * 0.5;
let left = - right;
let top = rows * 0.5;
let bottom = - top;


const vertexShader = gl.createShader( gl.VERTEX_SHADER );
gl.shaderSource( vertexShader, `
	attribute vec4 aVertexPosition;
	attribute vec2 aTextureCoord;
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	varying highp vec2 vTextureCoord;
	void main() {
		gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		vTextureCoord = aTextureCoord;
	}
` );
gl.compileShader( vertexShader );

if ( ! gl.getShaderParameter( vertexShader, gl.COMPILE_STATUS ) )
	console.error( `An error occurred compiling the vertex shader: ${gl.getShaderInfoLog( vertexShader )}` );

const fragmentShader = gl.createShader( gl.FRAGMENT_SHADER );
gl.shaderSource( fragmentShader, `
	varying highp vec2 vTextureCoord;
	uniform sampler2D uTexture;
	void main() {
		gl_FragColor = texture2D(uTexture, vTextureCoord);
	}
` );
gl.compileShader( fragmentShader );

if ( ! gl.getShaderParameter( fragmentShader, gl.COMPILE_STATUS ) )
	console.error( `An error occurred compiling the fragment shader: ${gl.getShaderInfoLog( fragmentShader )}` );

const shaderProgram = gl.createProgram();
gl.attachShader( shaderProgram, vertexShader );
gl.attachShader( shaderProgram, fragmentShader );
gl.linkProgram( shaderProgram );

if ( ! gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) )
	console.error( `Unable to initialize the shader program: ${gl.getProgramInfoLog( shaderProgram )}` );

const shaderAttributes = {
	vertexPosition: gl.getAttribLocation( shaderProgram, "aVertexPosition" ),
	textureCoord: gl.getAttribLocation( shaderProgram, "aTextureCoord" ),
};


const shaderUniforms = {
	projectionMatrix: gl.getUniformLocation( shaderProgram, "uProjectionMatrix" ),
	modelViewMatrix: gl.getUniformLocation( shaderProgram, "uModelViewMatrix" ),
	texture: gl.getUniformLocation( shaderProgram, "uTexture" )
};

// build vertices array
const arrays = ( () => {

	let arrays = {
		vertices: [],
		texCoords: []
	};

	arrays.indicesPerRow = rows > 1 ? ( cols + 1 ) * 4 : cols * 4;
	arrays.indices = rows > 1 ? arrays.indicesPerRow * rows - 3 : arrays.indicesPerRow;

	//arrays.vertices.push( left, bottom, left, top, right, bottom, right, top );
	//arrays.texCoords.push( 0, 1, 0, 0, 1, 1, 1, 0 );

	let charUV = charUVs[ "X" ];
	let top = 1 + rows * 0.5;

	for ( let row = 0; row < rows; row ++ ) {

		top --;

		let bottom = top - 1;
		let left = - 1 - cols * 0.5;

		for ( let col = 0; col < cols; col ++ ) {

			left ++;

			let right = left + 1;

			if ( row > 0 && col === 0 ) {

				arrays.vertices.push( left, bottom, left, bottom, left, bottom );
				arrays.texCoords.push( 0, 0, 0, 0, 0, 0 );

			}

			console.log( left, bottom, left, top, right, bottom, right, top );

			arrays.vertices.push( left, bottom, left, top, right, bottom, right, top );
			console.log( charUV );
			arrays.texCoords.push( ...charUV );

			if ( col === cols - 1 && row < rows - 1 ) {

				arrays.vertices.push( right, top );
				arrays.texCoords.push( 0, 0 );

			}

		}

	}

	return arrays;

} )();


let verticesBuffer = gl.createBuffer();
gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( arrays.vertices ), gl.STATIC_DRAW );


const texture = gl.createTexture();
gl.bindTexture( gl.TEXTURE_2D, texture );
gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
gl.generateMipmap( gl.TEXTURE_2D );

const textureCoordBuffer = gl.createBuffer();
gl.bindBuffer( gl.ARRAY_BUFFER, textureCoordBuffer );
gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( arrays.texCoords ), gl.STATIC_DRAW );


let near = 0;
let far = 100;
let lr = 1 / ( left - right );
let bt = 1 / ( bottom - top );
let nf = 1 / ( near - far );

gl.useProgram( shaderProgram );
gl.uniformMatrix4fv( shaderUniforms.projectionMatrix, false, [ - 2 * lr, 0, 0, 0, 0, - 2 * bt, 0, 0, 0, 0, 2 * nf, 0, ( left + right ) * lr, ( top + bottom ) * bt, ( far + near ) * nf, 1 ] );
gl.uniformMatrix4fv( shaderUniforms.modelViewMatrix, false, [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ] );

gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
gl.vertexAttribPointer( shaderAttributes.vertexPosition, 2, gl.FLOAT, false, 0, 0 );
gl.enableVertexAttribArray( shaderAttributes.vertexPosition );

gl.bindBuffer( gl.ARRAY_BUFFER, textureCoordBuffer );
gl.vertexAttribPointer( shaderAttributes.textureCoord, 2, gl.FLOAT, false, 0, 0 );
gl.enableVertexAttribArray( shaderAttributes.textureCoord );

gl.activeTexture( gl.TEXTURE0 );
gl.bindTexture( gl.TEXTURE_2D, texture );
gl.uniform1i( shaderUniforms.texture, 0 );



function animate() {

 	requestAnimationFrame( animate );

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	gl.drawArrays( gl.TRIANGLE_STRIP, 0, arrays.indices );

}

animate();

