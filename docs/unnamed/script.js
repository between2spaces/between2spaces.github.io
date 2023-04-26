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
        in vec4 colour;

        uniform float z;
        uniform mat4 projection;

        out vec2 fragUV;
        out vec4 fragRGBA;

        void main() {
            gl_Position = projection * vec4( position.x, position.y, z, 1.0 );
            fragUV = uv;
            fragRGBA = colour; 
        }

    ` ),

	fs: compileShader( gl, gl.FRAGMENT_SHADER, `#version 300 es

        precision highp float;

        in vec2 fragUV;	
        in vec4 fragRGBA;	

        uniform sampler2D glyph;

        out vec4 fragColor;

        void main() {
            fragColor = texture(glyph, fragUV) * fragRGBA;
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
shader.attributes.colour = gl.getAttribLocation( shader.program, "colour" );
shader.attributes.z = gl.getAttribLocation( shader.program, "z" );
shader.uniforms.projection = gl.getUniformLocation( shader.program, "projection" );
shader.uniforms.glyph = gl.getUniformLocation( shader.program, "glyph" );

gl.useProgram( shader.program );

gl.uniformMatrix4fv( shader.uniforms.projection, false, projection( 0, 1, 1, 0, 0, 100 ) );

const texture = gl.createTexture();

gl.activeTexture( gl.TEXTURE0 );
gl.uniform1i( shader.uniforms.glyph, 0 );


const layers = [];


function render( currentTime ) {

	requestAnimationFrame( render );

	gl.clear( gl.COLOR_BUFFER_BIT );

	for ( let layer of layers ) {

		if ( layer.uv.dirty ) {

			gl.bindBuffer( gl.ARRAY_BUFFER, layer.uv.buffer );
			gl.bufferSubData( gl.ARRAY_BUFFER, 0, layer.uv.data );
			layer.uv.dirty = false;

		}

		if ( layer.colour.dirty ) {

			gl.bindBuffer( gl.ARRAY_BUFFER, layer.colour.buffer );
			gl.bufferSubData( gl.ARRAY_BUFFER, 0, layer.colour.data );
			layer.colour.dirty = false;

		}

		gl.bindVertexArray( layer.vao );
		gl.drawArrays( gl.TRIANGLE_STRIP, 0, layer.indices.perRow * layer.rows );

	}

	update( currentTime );

}


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
		cols: cols,
		rows: rows,
		char: new Array( cols * rows ),
		z: layers.length,
		uv: {
			buffer: gl.createBuffer(),
			dirty: false
		},
		colour: {
			buffer: gl.createBuffer(),
			dirty: false
		},
		vao: gl.createVertexArray(),
		indices: {
			perCol: 4,
			perRow: 4 * cols + 2,
			total: ( cols * 4 + 2 ) * rows
		}
	};

	const vertices = [];
	const uvs = [];
	const charUV = charSetUVs[ " " ];
	const colours = [];

	for ( let row = 0; row < rows; row ++ ) {

		for ( let col = 0; col < cols; col ++ ) {

			vertices.push( col / cols, row / rows );
			vertices.push( col / cols, ( row + 1 ) / rows );
			vertices.push( ( col + 1 ) / cols, row / rows );
			vertices.push( ( col + 1 ) / cols, ( row + 1 ) / rows );

			uvs.push( ...charUV );

			colours.push( 1, 0, 0, 1 );
			colours.push( 1, 0, 0, 1 );
			colours.push( 1, 0, 0, 1 );
			colours.push( 1, 0, 0, 1 );

			layer.char[ row * rows + col ] = " ";

		}

		vertices.push( 1, ( row + 1 ) / rows );
		vertices.push( 0, ( row + 1 ) / rows );

		uvs.push( 0, 0, 0, 0 );

		colours.push( 0, 0, 0, 0 );
		colours.push( 0, 0, 0, 0 );

	}

	layer.uv.data = new Float32Array( uvs );

	layer.colour.data = new Float32Array( colours );

	const positionBuffer = gl.createBuffer();

	gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

	gl.bindBuffer( gl.ARRAY_BUFFER, layer.uv.buffer );
	gl.bufferData( gl.ARRAY_BUFFER, layer.uv.data, gl.STATIC_DRAW );

	gl.bindBuffer( gl.ARRAY_BUFFER, layer.colour.buffer );
	gl.bufferData( gl.ARRAY_BUFFER, layer.colour.data, gl.STATIC_DRAW );

	gl.bindVertexArray( layer.vao );

	gl.enableVertexAttribArray( shader.attributes.position );
	gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
	gl.vertexAttribPointer( shader.attributes.position, 2, gl.FLOAT, false, 0, 0 );

	gl.enableVertexAttribArray( shader.attributes.uv );
	gl.bindBuffer( gl.ARRAY_BUFFER, layer.uv.buffer );
	gl.vertexAttribPointer( shader.attributes.uv, 2, gl.FLOAT, false, 0, 0 );

	gl.enableVertexAttribArray( shader.attributes.colour );
	gl.bindBuffer( gl.ARRAY_BUFFER, layer.colour.buffer );
	gl.vertexAttribPointer( shader.attributes.colour, 4, gl.FLOAT, false, 0, 0 );

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

	return matrix;

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


function setChar( col, row, char, layer = 0, colour = null ) {

	if ( layer > layers.length - 1 ) return;

	layer = layers[ layer ];

	const charUVs = charSetUVs[ char ];
	const indice = row * layer.indices.perRow + col * layer.indices.perCol;
	const charOffset = row * layer.cols + col;

	if ( layer.char[ charOffset ] !== char ) {

		layer.char[ charOffset ] = char;

		let data = layer.uv.data;
		let i = indice * 2;

		data[ i ] = charUVs[ 0 ];
		data[ i + 1 ] = charUVs[ 1 ];
		data[ i + 2 ] = charUVs[ 2 ];
		data[ i + 3 ] = charUVs[ 3 ];
		data[ i + 4 ] = charUVs[ 4 ];
		data[ i + 5 ] = charUVs[ 5 ];
		data[ i + 6 ] = charUVs[ 6 ];
		data[ i + 7 ] = charUVs[ 7 ];

		layer.uv.dirty = true;

	}

	if ( colour ) {

		let data = layer.colour.data;
		let i = indice * 4;

		if ( data[ i ] !== colour[ 0 ] || data[ i + 1 ] !== colour[ 1 ] || data[ i + 2 ] !== colour[ 1 ] || data[ i + 3 ] !== colour[ 1 ] ) {

			data[ i ] = data[ i + 4 ] = data[ i + 8 ] = data[ i + 12 ] = colour[ 0 ];
			data[ i + 1 ] = data[ i + 5 ] = data[ i + 9 ] = data[ i + 13 ] = colour[ 1 ];
			data[ i + 2 ] = data[ i + 6 ] = data[ i + 10 ] = data[ i + 14 ] = colour[ 2 ];
			data[ i + 3 ] = data[ i + 7 ] = data[ i + 11 ] = data[ i + 15 ] = colour[ 3 ];

			layer.colour.dirty = true;

		}

	}

}

function writeText( col, row, string, layer = 0, colour = null ) {

	for ( let char of string ) setChar( col ++, row, char, layer, colour );

}


const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕";
const charSetUVs = characterSet( gl, characters );

const view = {
	cols: 200,
	rows: 100
};


createLayer( gl, charSetUVs, view.cols, view.rows );
createLayer( gl, charSetUVs, 20, 10 );
createLayer( gl, charSetUVs, 20, 10 );

writeText( 0, layers[ 1 ].rows - 1, "███", 1, [ 1, 1, 1, 0.5 ] );

setChar( 1, 0, "▒", 0, [ 0, 1, 0, 1 ] );

let fps, startTime, prevTime, frameCount = 0;
let col = 0;
let row = 0;
let charsPerUpdate = view.rows * view.cols;

function update( currentTime ) {

	if ( layers.length < 3 ) return;

	if ( ! startTime ) {

		startTime = currentTime;
		prevTime = startTime;

	}

	frameCount ++;

	if ( currentTime - prevTime >= 1000 ) {

		fps = frameCount;
		writeText( 0, layers[ 2 ].rows - 1, `${fps}`, 2, [ 0, 0, 0, 1 ] );
		frameCount = 0;
		prevTime = currentTime;

		if ( fps >= 120 ) {

			if ( charsPerUpdate < view.rows * view.cols ) charsPerUpdate ++;

		} else {

			charsPerUpdate --;

		}

	}


	for ( let i = 0; i < charsPerUpdate; i ++ ) {

		setChar( col ++, row, "▒", 0, [ Math.random(), Math.random(), Math.random(), 1 ] );

		if ( col === view.cols ) {

			col = 0;
			row ++;

		}

		if ( row === view.rows ) row = 0;

	}

}



render();

