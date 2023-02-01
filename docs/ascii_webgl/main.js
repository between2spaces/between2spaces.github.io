import { createNoise3D } from "./simplexnoise.js";
import { openSimplexNoise } from "./openSimplexNoise.js";
import * as mat4 from "./mat4.js";

const noise = createNoise3D();
//const noise = openSimplexNoise( Math.random() ).noise3D;
const freq = 0.1;

//const worker = new Worker( "./colony_sim.js", { type: "module" } );


class Terminal {

	constructor( layers = [ { cols: 80, rows: 30 } ], container = document.body ) {

		this.layers = layers;
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

		this.gl.enable( this.gl.BLEND );
		this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );


		// Create a orthogonal projection matrix ( left = - 0.5 * cols; right = 0.5 * cols; top = 0.5 * rows; bottom = -0.5 * rows; near = 0; far = 100 )
		let left = - 50;
		let right = 50;
		let top = 50;
		let bottom = - 50;
		let near = 0;
		let far = 100;
		let lr = 1 / ( left - right );
		let bt = 1 / ( bottom - top );
		let nf = 1 / ( near - far );

		this.projectionMatrix = [ - 2 * lr, 0, 0, 0, 0, - 2 * bt, 0, 0, 0, 0, 2 * nf, 0, ( left + right ) * lr, ( top + bottom ) * bt, ( far + near ) * nf, 1 ];

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

		//this.loadCharacterSet( "tilemap.png", "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\0" );

		this.setCharacterSet( "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕" );

	}

	fitContainer() {

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );

	}

	setCharacterSet( characters, width = 512, height = 512, fontFamily = "monospace" ) {

		this.loadCharacterSet( this.createCharacterSetImage( characters, width, height, fontFamily ), characters );

	}

	createCharacterSetImage( characters, width = 512, height = 512, fontFamily = "monospace" ) {

		const canvas = document.createElement( "canvas" );

		canvas.width = width;
		canvas.height = height;

		const charsPerLine = Math.ceil( Math.sqrt( characters.length ) );

		console.log( characters.length, charsPerLine );

		const size = Math.ceil( width / charsPerLine );

		const ctx = canvas.getContext( "2d" );
		ctx.fillStyle = "white";
		ctx.strokeStyle = "white";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = `${size}px ${fontFamily}`;

		console.log( ctx.measureText( "W" ) );


		for ( let char of characters ) {

			const index = characters.indexOf( char );
			const col = index % charsPerLine;
			const row = Math.floor( index / charsPerLine );
			const cx = 0.5 * size + col * size;
			const cy = 0.5 * size + row * size;
			ctx.fillText( char, cx, cy );
			ctx.strokeRect( cx - 0.5 * size, cy - 0.5 * size, size, size );

		}

		document.body.append( canvas );

		return canvas.toDataURL();

	}


	loadCharacterSet( imageUrl, characters ) {

		this.texture = this.gl.createTexture();
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );

		// Start texture data as a 1x1 opaque black dot until Image has loaded to replace
		this.gl.texImage2D( this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array( [ 0, 0, 0, 0 ] ) );

		const self = this;
		this.textureImage = new Image();
		this.textureImage.onload = () => {

			self.gl.bindTexture( self.gl.TEXTURE_2D, self.texture );
			self.gl.texImage2D( self.gl.TEXTURE_2D, 0, self.gl.RGBA, self.gl.RGBA, self.gl.UNSIGNED_BYTE, self.textureImage );
			self.gl.generateMipmap( self.gl.TEXTURE_2D );

		};

		this.textureImage.src = imageUrl;

		this.charUVs = {};

		let charsPerLine = Math.ceil( Math.sqrt( characters.length ) );

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

		console.log( this.charUVs );

		this.buildBuffers();

	}


	buildBuffers() {

		const charUVs = this.charUVs[ " " ]; //\0" ];

		let layerZ = - this.layers.length + 1;

		for ( let layer of this.layers ) {

			let textureCoord = [];
			let colours = [];
			let vertices = [];

			let rowHeight = 100.0 / layer.rows;
			let colWidth = 100.0 / layer.cols;

			let top = rowHeight + ( layer.rows * 0.5 ) * rowHeight;

			for ( let row = 0; row < layer.rows; row ++ ) {

				top -= rowHeight;

				let bottom = top - rowHeight;
				let left = - colWidth - ( layer.cols * 0.5 ) * colWidth;

				for ( let col = 0; col < layer.cols; col ++ ) {

					left += colWidth;

					let right = left + colWidth;

					if ( row > 0 && col === 0 ) {

						vertices.push( left, bottom, left, bottom, left, bottom );
						textureCoord.push( 0, 0, 0, 0, 0, 0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );

					}

					vertices.push( left, bottom, left, top, right, bottom, right, top );
					colours.push( 0.0, 0.0, 1.0, 1.0 );
					colours.push( 0.0, 0.0, 1.0, 1.0 );
					colours.push( 0.0, 0.0, 1.0, 1.0 );
					colours.push( 0.0, 0.0, 1.0, 1.0 );

					textureCoord.push( ...charUVs );

					if ( col === layer.cols - 1 ) {

						vertices.push( right, top );
						textureCoord.push( 0, 0 );
						colours.push( 0.0, 0.0, 1.0, 1.0 );

					}


				}

			}

			layer.indicesPerRow = ( layer.cols + 1 ) * 4;
			layer.indicesTotal = layer.indicesPerRow * layer.rows;

			layer.vertices = { typedArray: new Float32Array( vertices ), size: 2, buffer: this.gl.createBuffer() };
			layer.colours = { typedArray: new Float32Array( colours ), size: 4, buffer: this.gl.createBuffer() };
			layer.textureCoord = { typedArray: new Float32Array( textureCoord ), size: 2, buffer: this.gl.createBuffer() };
			layer.modelViewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, layerZ ++, 1 ];

			// Load the vertices buffer to GPU and tell WebGL how to pull positions into the vertexPosition attribute
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.vertices.buffer );
			this.gl.bufferData( this.gl.ARRAY_BUFFER, layer.vertices.typedArray, this.gl.STATIC_DRAW );
			this.gl.vertexAttribPointer( this.shader.attributes.vertexPosition, layer.vertices.size, this.gl.FLOAT, false, 0, 0 );
			this.gl.enableVertexAttribArray( this.shader.attributes.vertexPosition );

			// Load the colours buffer to GPU and tell WebGL how to pull colors into the vertexColor attribute
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.colours.buffer );
			this.gl.bufferData( this.gl.ARRAY_BUFFER, layer.colours.typedArray, this.gl.STATIC_DRAW );
			this.gl.vertexAttribPointer( this.shader.attributes.colour, layer.colours.size, this.gl.FLOAT, false, 0, 0 );
			this.gl.enableVertexAttribArray( this.shader.attributes.colour );

			// Load the textureCoord buffer to GPU and tell WebGL how to pull texture coordinates into the textureCoord attribute
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.textureCoord.buffer );
			this.gl.bufferData( this.gl.ARRAY_BUFFER, layer.textureCoord.typedArray, this.gl.STATIC_DRAW );
			this.gl.vertexAttribPointer( this.shader.attributes.textureCoord, layer.textureCoord.size, this.gl.FLOAT, false, 0, 0 );
			this.gl.enableVertexAttribArray( this.shader.attributes.textureCoord );

		}

		// Tell WebGL to use our program when drawing
		this.gl.useProgram( this.shader.program );

		// Set the shaders project matrix uniform
		this.gl.uniformMatrix4fv( this.shader.uniforms.projectionMatrix, false, this.projectionMatrix );

		// Tell WebGL we want to affect texture unit 0
		this.gl.activeTexture( this.gl.TEXTURE0 );

		// Bind the texture to texture unit 0
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );

		// Tell the shader we bound the texture to texture unit 0
		this.gl.uniform1i( this.shader.uniforms.texture, 0 );

	}


	setChar( col, row, layer = 0, char, colour = undefined ) {

		const charUVs = this.charUVs[ char ];

		if ( layer > this.layers.length - 1 ) return;

		layer = this.layers[ layer ];

		let indices = row * layer.indicesPerRow + col * 4;
		let texIndex = indices * 2;

		layer.textureCoord.typedArray[ texIndex ] = charUVs[ 0 ];
		layer.textureCoord.typedArray[ texIndex + 1 ] = charUVs[ 1 ];
		layer.textureCoord.typedArray[ texIndex + 2 ] = charUVs[ 2 ];
		layer.textureCoord.typedArray[ texIndex + 3 ] = charUVs[ 3 ];
		layer.textureCoord.typedArray[ texIndex + 4 ] = charUVs[ 4 ];
		layer.textureCoord.typedArray[ texIndex + 5 ] = charUVs[ 5 ];
		layer.textureCoord.typedArray[ texIndex + 6 ] = charUVs[ 6 ];
		layer.textureCoord.typedArray[ texIndex + 7 ] = charUVs[ 7 ];

		if ( colour ) {

			let colIndex = indices * 4;

			layer.colours.typedArray[ colIndex ] = colour[ 0 ];
			layer.colours.typedArray[ colIndex + 1 ] = colour[ 1 ];
			layer.colours.typedArray[ colIndex + 2 ] = colour[ 2 ];
			layer.colours.typedArray[ colIndex + 3 ] = colour[ 3 ];
			layer.colours.typedArray[ colIndex + 4 ] = colour[ 0 ];
			layer.colours.typedArray[ colIndex + 5 ] = colour[ 1 ];
			layer.colours.typedArray[ colIndex + 6 ] = colour[ 2 ];
			layer.colours.typedArray[ colIndex + 7 ] = colour[ 3 ];
			layer.colours.typedArray[ colIndex + 8 ] = colour[ 0 ];
			layer.colours.typedArray[ colIndex + 9 ] = colour[ 1 ];
			layer.colours.typedArray[ colIndex + 10 ] = colour[ 2 ];
			layer.colours.typedArray[ colIndex + 11 ] = colour[ 3 ];
			layer.colours.typedArray[ colIndex + 12 ] = colour[ 0 ];
			layer.colours.typedArray[ colIndex + 13 ] = colour[ 1 ];
			layer.colours.typedArray[ colIndex + 14 ] = colour[ 2 ];
			layer.colours.typedArray[ colIndex + 15 ] = colour[ 3 ];

		}

	}

	writeText( col, row, layer = 0, string, colour = undefined ) {

		for ( let char of string ) this.setChar( col ++, row, layer, char, colour );

	}


	update() {

		for ( let layer of this.layers ) {

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.textureCoord.buffer );
			this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, layer.textureCoord.typedArray );
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.colours.buffer );
			this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, layer.colours.typedArray );

		}

	}

	render() {

		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

		for ( let layer of this.layers ) {

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.vertices.buffer );
			this.gl.vertexAttribPointer( this.shader.attributes.vertexPosition, layer.vertices.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.textureCoord.buffer );
			this.gl.vertexAttribPointer( this.shader.attributes.textureCoord, layer.textureCoord.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.colours.buffer );
			this.gl.vertexAttribPointer( this.shader.attributes.colour, layer.colours.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.uniformMatrix4fv( this.shader.uniforms.modelViewMatrix, false, layer.modelViewMatrix );

			this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, layer.indicesTotal );

		}

	}

}



const terminal = new Terminal( [ { cols: 32, rows: 32 }, { cols: 5, rows: 5 }, { cols: 5, rows: 5 } ] ); //new Terminal( 256, 256, 256 );

terminal.writeText( 0, 4, 1, "▓▓▓▓▓", [ 1.0, 1.0, 1.0, 0.5 ] );
terminal.writeText( 0, 4, 2, "12345", [ 0.0, 0.0, 0.0, 1.0 ] );


let worldTime = 0;

function animate() {

 	requestAnimationFrame( animate );

	worldTime += 0.01;

	for ( let row = 0; row < terminal.layers[ 0 ].rows; row ++ ) {

		for ( let col = 0; col < terminal.layers[ 0 ].cols; col ++ ) {

			let height = ( noise( col * freq, row * freq, worldTime ) + 1 ) / 2;

			let char = "░"; //height > 0.75 ? "█" : height > 0.5 ? "▓" : height > 0.25 ? "░" : " ";

			terminal.setChar( col, row, 0, char, [ height * 0.5, height, height, 1.0 ] );

		}

	}

	terminal.update();
	terminal.render();


}

animate();


