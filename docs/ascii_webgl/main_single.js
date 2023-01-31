import { createNoise3D } from "./simplexnoise.js";
import { openSimplexNoise } from "./openSimplexNoise.js";
import * as mat4 from "./mat4.js";

const noise = createNoise3D();
//const noise = openSimplexNoise( Math.random() ).noise3D;
const freq = 0.1;

//const worker = new Worker( "./colony_sim.js", { type: "module" } );


class Terminal {

	constructor( cols, rows, layers = 1, container = document.body ) {

		this.cols = cols;
		this.rows = rows;
		this.layers = new Array( layers );

		this.container = container;

		this.canvas = document.createElement( "canvas" );
		this.container.append( this.canvas );

		this.gl = this.canvas.getContext( "webgl" );
		this.fitContainer();
		let self = this;
		window.addEventListener( "resize", () => self.fitContainer() );

		this.gl.clearColor( 0.0, 0.0, 0.0, 1.0 ); // Clear to black, fully opaque
		this.gl.clearDepth( 1.0 ); // Clear everything
		this.gl.disable( this.gl.DEPTH_TEST );
		//this.gl.enable( this.gl.DEPTH_TEST ); // Enable depth testing
		//this.gl.depthFunc( this.gl.LEQUAL ); // Near things obscure far things

		this.gl.enable( this.gl.BLEND );
		this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );

		// Create a orthogonal projection matrix (left:- 0.5*cols, right:0.5*cols, top:0.5*rows, bottom:-0.5*rows, near:0, far:100 )
		this.projectionMatrix = [ - 2 / ( - 0.5 * this.cols - 0.5 * this.cols ), 0, 0, 0, 0, - 2 / ( - 0.5 * this.rows - 0.5 * this.rows ), 0, 0, 0, 0, - 2 / 100, 0, 0, 0, - 1, 1 ];

		// Create a model view matrix to draw at origin
		this.modelViewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];


		const vertexShader = this.gl.createShader( this.gl.VERTEX_SHADER );

		this.gl.shaderSource( vertexShader, `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			attribute vec4 aColour;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;
			varying highp vec4 vColour;
			void main() {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
				vColour = aColour;
			}
		` );
		this.gl.compileShader( vertexShader );

		if ( ! this.gl.getShaderParameter( vertexShader, this.gl.COMPILE_STATUS ) )
			console.error( `An error occurred compiling the vertex shader: ${this.gl.getShaderInfoLog( vertexShader )}` );

		const fragmentShader = this.gl.createShader( this.gl.FRAGMENT_SHADER );

		this.gl.shaderSource( fragmentShader, `
			varying highp vec2 vTextureCoord;
			varying highp vec4 vColour;
			uniform sampler2D uTexture;
			void main() {
				gl_FragColor = texture2D(uTexture, vTextureCoord) * vColour;
			}
		` );
		this.gl.compileShader( fragmentShader );

		if ( ! this.gl.getShaderParameter( fragmentShader, this.gl.COMPILE_STATUS ) )
			console.error( `An error occurred compiling the fragment shader: ${this.gl.getShaderInfoLog( fragmentShader )}` );

		this.shader = {
			program: this.gl.createProgram(),
			attributes: {},
			uniforms: {}
		};

		this.gl.attachShader( this.shader.program, vertexShader );
		this.gl.attachShader( this.shader.program, fragmentShader );
		this.gl.linkProgram( this.shader.program );

		if ( ! this.gl.getProgramParameter( this.shader.program, this.gl.LINK_STATUS ) )
			console.error( `Unable to initialize the shader program: ${this.gl.getProgramInfoLog( this.shader.program )}` );


		this.shader.attributes.vertexPosition = this.gl.getAttribLocation( this.shader.program, "aVertexPosition" );
		this.shader.attributes.textureCoord = this.gl.getAttribLocation( this.shader.program, "aTextureCoord" );
		this.shader.attributes.colour = this.gl.getAttribLocation( this.shader.program, "aColour" );
		this.shader.uniforms.projectionMatrix = this.gl.getUniformLocation( this.shader.program, "uProjectionMatrix" );
		this.shader.uniforms.modelViewMatrix = this.gl.getUniformLocation( this.shader.program, "uModelViewMatrix" );
		this.shader.uniforms.texture = this.gl.getUniformLocation( this.shader.program, "uTexture" );

		this.loadCharacterSet( "tilemap.png", 16, "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" );

	}

	fitContainer() {

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );

	}

	loadCharacterSet( tilemapUrl, charsPerLine, characters ) {

		this.texture = this.gl.createTexture();

		// Start texture data as a 1x1 opaque black dot until Image has loaded to replace
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );
		this.gl.texImage2D( this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array( [ 0, 0, 0, 0 ] ) );

		const self = this;

		this.textureImage = new Image();
		this.textureImage.onload = () => {

			self.gl.bindTexture( self.gl.TEXTURE_2D, self.texture );
			self.gl.texImage2D( self.gl.TEXTURE_2D, 0, self.gl.RGBA, self.gl.RGBA, self.gl.UNSIGNED_BYTE, self.textureImage );
			self.gl.generateMipmap( self.gl.TEXTURE_2D );

		};

		this.textureImage.src = tilemapUrl;

		this.charUVs = {};

		for ( let char of characters ) {

			const index = characters.indexOf( char );
			const col = index % charsPerLine;
			const row = Math.floor( index / charsPerLine );
			const left = col / charsPerLine + 0.001;
			const right = ( col + 1 ) / charsPerLine - 0.001;
			const top = row / charsPerLine + 0.001;
			const bottom = ( row + 1 ) / charsPerLine - 0.001;
			this.charUVs[ char ] = [ left, bottom, left, top, right, bottom, right, top ];

		}

		this.buildBuffers();

	}


	buildBuffers() {

		const charUVs = this.charUVs[ " " ]; //\0" ];

		const farZ = - this.layers.length + 1;
		const topY = this.rows / 2.0 - 0.5;
		const leftX = - this.cols / 2.0 + 0.5;

		let vertices = [];
		let textureCoord = [];
		let colours = [];

		for ( let z = farZ; z < 1; z ++ ) {

			for ( let row = 0; row < this.rows; row ++ ) {

				let cy = topY - row;
				let top = cy + 0.5;
				let bottom = cy - 0.5;

				for ( let col = 0; col < this.cols; col ++ ) {

					const cx = leftX + col;
					const left = cx - 0.5;
					const right = cx + 0.5;

					if ( ( z > farZ || row > 0 ) && col === 0 ) {

						vertices.push( left, bottom, z, left, bottom, z, left, bottom, z );
						textureCoord.push( 0, 0, 0, 0, 0, 0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );

					}

					vertices.push( left, bottom, z, left, top, z, right, bottom, z, right, top, z );
					textureCoord.push( ...charUVs );
					colours.push( 0.0, 0.0, 1.0, 1.0 );
					colours.push( 0.0, 0.0, 1.0, 1.0 );
					colours.push( 0.0, 0.0, 1.0, 1.0 );
					colours.push( 0.0, 0.0, 1.0, 1.0 );

					if ( col === this.cols - 1 ) {

						vertices.push( right, top, z );
						textureCoord.push( 0, 0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );

					}

				}

			}

		}

		this.indicesPerRow = ( this.cols + 1 ) * 4;
		this.indicesPerLayer = this.rows * this.indicesPerRow;
		this.indicesTotal = this.layers.length * this.indicesPerLayer;

		this.vertices = { typedArray: new Float32Array( vertices ), size: 3, buffer: this.gl.createBuffer() };
		this.colours = { typedArray: new Float32Array( colours ), size: 4, buffer: this.gl.createBuffer() };
		this.textureCoord = { typedArray: new Float32Array( textureCoord ), size: 2, buffer: this.gl.createBuffer() };

		// Load the vertices buffer to GPU and tell WebGL how to pull positions into the vertexPosition attribute
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertices.buffer );
		this.gl.bufferData( this.gl.ARRAY_BUFFER, this.vertices.typedArray, this.gl.STATIC_DRAW );
		this.gl.vertexAttribPointer( this.shader.attributes.vertexPosition, this.vertices.size, this.gl.FLOAT, false, 0, 0 );
		this.gl.enableVertexAttribArray( this.shader.attributes.vertexPosition );

		// Load the colours buffer to GPU and tell WebGL how to pull colors into the vertexColor attribute
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.colours.buffer );
		this.gl.bufferData( this.gl.ARRAY_BUFFER, this.colours.typedArray, this.gl.STATIC_DRAW );
		this.gl.vertexAttribPointer( this.shader.attributes.colour, this.colours.size, this.gl.FLOAT, false, 0, 0 );
		this.gl.enableVertexAttribArray( this.shader.attributes.colour );

		// Load the textureCoord buffer to GPU and tell WebGL how to pull texture coordinates into the textureCoord attribute
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.textureCoord.buffer );
		this.gl.bufferData( this.gl.ARRAY_BUFFER, this.textureCoord.typedArray, this.gl.STATIC_DRAW );
		this.gl.vertexAttribPointer( this.shader.attributes.textureCoord, this.textureCoord.size, this.gl.FLOAT, false, 0, 0 );
		this.gl.enableVertexAttribArray( this.shader.attributes.textureCoord );

		// Tell WebGL to use our program when drawing
		this.gl.useProgram( this.shader.program );

		// Set the shaders project matrix uniform
		this.gl.uniformMatrix4fv( this.shader.uniforms.projectionMatrix, false, this.projectionMatrix );

		// Set the shaders model view matrix uniform
		this.gl.uniformMatrix4fv( this.shader.uniforms.modelViewMatrix, false, this.modelViewMatrix );

		// Tell WebGL we want to affect texture unit 0
		this.gl.activeTexture( this.gl.TEXTURE0 );

		// Bind the texture to texture unit 0
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );

		// Tell the shader we bound the texture to texture unit 0
		this.gl.uniform1i( this.shader.uniforms.texture, 0 );

	}


	setChar( col, row, layer, char, colour = undefined ) {

		const charUVs = this.charUVs[ char ];

		let indices = layer * this.indicesPerLayer + row * this.indicesPerRow + col * 4;

		let texIndex = indices * 2;

		this.textureCoord.typedArray[ texIndex ] = charUVs[ 0 ];
		this.textureCoord.typedArray[ texIndex + 1 ] = charUVs[ 1 ];
		this.textureCoord.typedArray[ texIndex + 2 ] = charUVs[ 2 ];
		this.textureCoord.typedArray[ texIndex + 3 ] = charUVs[ 3 ];
		this.textureCoord.typedArray[ texIndex + 4 ] = charUVs[ 4 ];
		this.textureCoord.typedArray[ texIndex + 5 ] = charUVs[ 5 ];
		this.textureCoord.typedArray[ texIndex + 6 ] = charUVs[ 6 ];
		this.textureCoord.typedArray[ texIndex + 7 ] = charUVs[ 7 ];

		if ( colour ) {

			let colIndex = indices * 4;

			this.colours.typedArray[ colIndex ] = colour[ 0 ];
			this.colours.typedArray[ colIndex + 1 ] = colour[ 1 ];
			this.colours.typedArray[ colIndex + 2 ] = colour[ 2 ];
			this.colours.typedArray[ colIndex + 3 ] = colour[ 3 ];
			this.colours.typedArray[ colIndex + 4 ] = colour[ 0 ];
			this.colours.typedArray[ colIndex + 5 ] = colour[ 1 ];
			this.colours.typedArray[ colIndex + 6 ] = colour[ 2 ];
			this.colours.typedArray[ colIndex + 7 ] = colour[ 3 ];
			this.colours.typedArray[ colIndex + 8 ] = colour[ 0 ];
			this.colours.typedArray[ colIndex + 9 ] = colour[ 1 ];
			this.colours.typedArray[ colIndex + 10 ] = colour[ 2 ];
			this.colours.typedArray[ colIndex + 11 ] = colour[ 3 ];
			this.colours.typedArray[ colIndex + 12 ] = colour[ 0 ];
			this.colours.typedArray[ colIndex + 13 ] = colour[ 1 ];
			this.colours.typedArray[ colIndex + 14 ] = colour[ 2 ];
			this.colours.typedArray[ colIndex + 15 ] = colour[ 3 ];

		}

	}

	writeText( col, row, layer, string, colour = undefined ) {

		for ( let char of string ) this.setChar( col ++, row, layer, char, colour );

	}


	update() {

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.textureCoord.buffer );
		this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, this.textureCoord.typedArray );
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.colours.buffer );
		this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, this.colours.typedArray );

	}

	render() {

		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.textureCoord.buffer );
		this.gl.vertexAttribPointer( this.shader.attributes.textureCoord, this.textureCoord.size, this.gl.FLOAT, false, 0, 0 );

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.colours.buffer );
		this.gl.vertexAttribPointer( this.shader.attributes.colour, this.colours.size, this.gl.FLOAT, false, 0, 0 );

		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, this.indicesTotal );

	}

}





const terminal = new Terminal( 256, 256, 15 ); //new Terminal( 256, 256, 256 );


let worldTime = 0;



function animate() {

 	requestAnimationFrame( animate );

	worldTime += 0.01;

	for ( let row = 0; row < terminal.rows; row ++ ) {

		for ( let col = 0; col < terminal.cols; col ++ ) {

			let height = ( noise( col * freq, row * freq, worldTime ) + 1 ) / 2;

			let char = "░"; //height > 0.75 ? "█" : height > 0.5 ? "▓" : height > 0.25 ? "░" : " ";

			terminal.setChar( col, row, 0, char, [ height, height, height, 1.0 ] );

		}

	}

	terminal.writeText( 10, 10, 1, "Test", [ 1.0, 0.0, 0.0, 1.0 ] );

	terminal.update();
	terminal.render();


}

animate();


