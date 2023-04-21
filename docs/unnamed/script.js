const canvas = document.createElement( "canvas" );

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.append( canvas );


window.addEventListener( "resize", () => {

	gl.viewport( 0, 0, canvas.width = window.innerWidth, canvas.height = window.innerHeight );

} );


const gl = canvas.getContext( "webgl2", { alpha: false } );

gl.enable( gl.BLEND );
gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );


const shader = {
	vs: compileShader( gl, gl.VERTEX_SHADER, `#version 300 es
		
		in vec2 position;
		in vec2 uv;
	
		uniform float z;
		uniform mat4 projection;
		
		out vec2 fragUV;

		void main() {
			gl_Position = projection * vec4( position.x, position.y, z, 1.0 );
			fragUV = uv;
		}

	` ),

	fs: compileShader( gl, gl.FRAGMENT_SHADER, `#version 300 es
	
		precision highp float;
		
		in vec2 fragUV;	
		uniform sampler2D tex;
		
		out vec4 fragColor;

		void main() {
			fragColor = texture(tex, fragUV); //vec4( 1, 1, 1, 1); //
		}

	` ),

	program: gl.createProgram(),
	attributes: {},
	uniforms: {}
};

gl.attachShader( shader.program, shader.vs );
gl.attachShader( shader.program, shader.fs );
gl.linkProgram( shader.program );

if ( ! gl.getProgramParameter( shader.program, gl.LINK_STATUS ) )
	throw ( "program failed to link:" + gl.getProgramInfoLog( shader.program ) );

shader.attributes.position = gl.getAttribLocation( shader.program, "position" );
shader.attributes.uv = gl.getAttribLocation( shader.program, "uv" );
shader.attributes.z = gl.getAttribLocation( shader.program, "z" );
shader.uniforms.projection = gl.getUniformLocation( shader.program, "projection" );
shader.uniforms.tex = gl.getUniformLocation( shader.program, "tex" );

gl.useProgram( shader.program );

const texture = gl.createTexture();
//gl.activeTexture( gl.TEXTURE0 );
gl.uniform1i( shader.uniforms.tex, 0 );

const layers = [];


function render( currentTime ) {

	requestAnimationFrame( render );

	gl.clear( gl.COLOR_BUFFER_BIT );

	for ( let layer of layers ) {

		if ( layer.dirty ) {

			gl.bindBuffer( gl.ARRAY_BUFFER, layer.uvBuffer );
			gl.bufferData( gl.ARRAY_BUFFER, layer.uvData, gl.STATIC_DRAW );

		}

		gl.bindVertexArray( layer.vao );
		gl.drawArrays( gl.TRIANGLE_STRIP, 0, layer.indicesPerRow * layer.rows );

	}

	update( currentTime );

}

render();

function compileShader( gl, shaderType, shaderSource ) {

	const shader = gl.createShader( shaderType );

	gl.shaderSource( shader, shaderSource );
	gl.compileShader( shader );

	if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
		throw ( "could not compile shader:" + gl.getShaderInfoLog( shader ) );

	return shader;

}

function createLayer( gl, charSetUVs, cols = 80, rows = 30 ) {

	const layer = {
		rows: rows,
		cols: cols,
		z: layers.length,
		positionBuffer: gl.createBuffer(),
		uvBuffer: gl.createBuffer(),
		vao: gl.createVertexArray(),
		indicesPerCol: 4,
		indicesPerRow: cols * 4 + 2,
		dirty: false
	};

	let charUV = charSetUVs[ " " ];
	const vertices = [];
	const uvs = [];

	for ( let row = 0; row < rows; row ++ ) {

		for ( let col = 0; col < cols; col ++ ) {

			// four vertices for each cell
			vertices.push( col, row ); // vertex 1
			vertices.push( col, row + 1 ); // vertex 2
			vertices.push( col + 1, row ); // vertex 3
			vertices.push( col + 1, row + 1 ); // vertex 4

			uvs.push( ...charUV );

		}

		vertices.push( cols, row + 1 ); // vertex 1
		vertices.push( 0, row + 1 ); // vertex 2

		uvs.push( 0, 0, 0, 0 );

	}

	layer.uvData = new Float32Array( uvs );

	gl.bindBuffer( gl.ARRAY_BUFFER, layer.positionBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

	gl.bindBuffer( gl.ARRAY_BUFFER, layer.uvBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, layer.uvData, gl.STATIC_DRAW );

	gl.bindVertexArray( layer.vao );

	gl.enableVertexAttribArray( shader.attributes.position );
	gl.bindBuffer( gl.ARRAY_BUFFER, layer.positionBuffer );
	gl.vertexAttribPointer( shader.attributes.position, 2, gl.FLOAT, false, 0, 0 );

	gl.enableVertexAttribArray( shader.attributes.uv );
	gl.bindBuffer( gl.ARRAY_BUFFER, layer.uvBuffer );
	gl.vertexAttribPointer( shader.attributes.uv, 2, gl.FLOAT, false, 0, 0 );

	gl.uniform1f( shader.uniforms.z, layer.z );

	gl.bindVertexArray( null );

	layers.push( layer );

	return layer;

}

function projection( left = - 50, right = 50, top = 50, bottom = - 50, near = 0, far = 100 ) {

	const matrix = new Array( 16 );

	let lr = 1 / ( left - right );
	let bt = 1 / ( bottom - top );
	let nf = 1 / ( near - far );

	matrix[ 0 ] = - 2 * lr;
	matrix[ 1 ] = 0;
	matrix[ 2 ] = 0;
	matrix[ 3 ] = 0;
	matrix[ 4 ] = 0;
	matrix[ 5 ] = - 2 * bt;
	matrix[ 6 ] = 0;
	matrix[ 7 ] = 0;
	matrix[ 8 ] = 0;
	matrix[ 9 ] = 0;
	matrix[ 10 ] = 2 * nf;
	matrix[ 11 ] = 0;
	matrix[ 12 ] = ( left + right ) * lr;
	matrix[ 13 ] = ( top + bottom ) * bt;
	matrix[ 14 ] = ( far + near ) * nf;
	matrix[ 15 ] = 1;

	gl.uniformMatrix4fv( shader.uniforms.projection, false, matrix );

}

function characterSet( gl, chars, size = 1024 ) {

	const canvas = document.createElement( "canvas" );

	canvas.width = size;
	canvas.height = size;

	const ctx = canvas.getContext( "2d" );

	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	let font = size * 0.5;
	let metrics;
	let cols;
	let height;

	const uvs = {};

	do {

		ctx.font = `${font --}px monospace`;
		metrics = ctx.measureText( "█" );
		cols = Math.floor( canvas.width / metrics.width );
		height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

	} while ( cols * Math.floor( canvas.height / height ) < chars.length );

	for ( let i = 0, l = chars.length; i < l; i ++ ) {

		let y = metrics.actualBoundingBoxAscent + Math.floor( i / cols ) * height;
		let x = metrics.width * 0.5 + ( i % cols ) * metrics.width;

		ctx.fillText( chars[ i ], x, y );

		let left = ( x - 0.5 * metrics.width + 1 ) / size;
		let top = ( y - metrics.actualBoundingBoxAscent + 1 ) / size;
		let right = ( x + 0.5 * metrics.width - 2 ) / size;
		let bottom = ( y + metrics.actualBoundingBoxDescent - 1 ) / size;

		uvs[ chars[ i ] ] = [ left, bottom, left, top, right, bottom, right, top ];

	}

	gl.bindTexture( gl.TEXTURE_2D, texture );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas );

	return uvs;

}


const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕";
const charSetUVs = characterSet( gl, characters );

const cols = 256;
const rows = 200;

projection( 0, cols, rows, 0, 0, 100 );

function setChar( col, row, char, layer = 0 ) {

	const charUVs = charSetUVs[ char ];

	if ( layer > layers.length - 1 ) return;

	layer = layers[ layer ];

	let indice = row * layer.indicesPerRow + col * layer.indicesPerCol;
	let uvOffset = indice * 2;

	layer.uvData[ uvOffset ] = charUVs[ 0 ];
	layer.uvData[ uvOffset + 1 ] = charUVs[ 1 ];
	layer.uvData[ uvOffset + 2 ] = charUVs[ 2 ];
	layer.uvData[ uvOffset + 3 ] = charUVs[ 3 ];
	layer.uvData[ uvOffset + 4 ] = charUVs[ 4 ];
	layer.uvData[ uvOffset + 5 ] = charUVs[ 5 ];
	layer.uvData[ uvOffset + 6 ] = charUVs[ 6 ];
	layer.uvData[ uvOffset + 7 ] = charUVs[ 7 ];

	layer.dirty = true;

}

function writeText( col, row, string, layer = 0 ) {

	for ( let char of string ) this.setChar( col ++, row, char, layer );

}


let fps, startTime, prevTime, frameCount = 0;
let col = 0;
let row = 0;
let charsPerUpdate = rows * cols;

function update( currentTime ) {

	if ( layers.length < 3 ) return;

	if ( ! startTime ) {

		startTime = currentTime;
	    prevTime = startTime;

	}

	frameCount ++;

	if ( currentTime - prevTime >= 1000 ) {

	    fps = frameCount;
		writeText( 0, layers[ 2 ].rows - 1, `${fps}`, 2 );
	    frameCount = 0;
	    prevTime = currentTime;

		if ( fps >= 120 ) {

			if ( charsPerUpdate < rows * cols ) charsPerUpdate ++;

		} else {

			charsPerUpdate --;

		}

	}


	for ( let i = 0; i < charsPerUpdate; i ++ ) {

		setChar( col ++, row, characters[ Math.floor( Math.random() * characters.length ) ], 0 );

		if ( col === layers[ 0 ].cols ) {

			col = 0;
			row ++;

		}

		if ( row === layers[ 0 ].rows ) row = 0;

	}

}

createLayer( gl, charSetUVs, cols, rows );
createLayer( gl, charSetUVs, 20, 10 );
createLayer( gl, charSetUVs, 20, 10 );

writeText( 0, layers[ 1 ].rows - 1, "███", 1 );

