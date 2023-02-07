export class Terminal {

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


		// An orthogonal projection matrix ( left = - 0.5 * cols; right = 0.5 * cols; top = 0.5 * rows; bottom = -0.5 * rows; near = 0; far = 100 )
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

		this.setCharacterSet( "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕", 512, 512 );

	}

	fitContainer() {

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );

	}

	setCharacterSet( characters, texWidth = 512, texHeight = 512, fontFamily = "monospace" ) {

		const canvas = document.createElement( "canvas" );
		canvas.style.border = "1px solid black";

		canvas.width = texWidth;
		canvas.height = texHeight;

		const ctx = canvas.getContext( "2d" );

		ctx.fillStyle = "white";
		//ctx.strokeStyle = "rgb(150, 150, 150)";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		let fontSize = 99;
		let metrics;
		let rows;
		let cols;

		do {

			fontSize --;
			ctx.font = `${fontSize}px ${fontFamily}`;
			metrics = ctx.measureText( "▓" );
			metrics.height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent + 10;
			rows = Math.floor( texHeight / metrics.height );
			cols = Math.floor( texWidth / ( metrics.width + 2 ) );

		} while ( rows * cols < characters.length );

		this.charUVs = {};

		let i = 0;

		for ( let cy = Math.ceil( 0.5 * metrics.height ); cy < texHeight; cy += metrics.height + 1 ) {

			for ( let cx = Math.ceil( 0.5 * metrics.width ); cx < texWidth - 0.5 * metrics.width; cx += metrics.width + 2 ) {

				if ( i >= characters.length ) break;

				let char = characters[ i ++ ];

				let left = ( cx - 0.5 * metrics.width + 1 ) / texWidth;
				let top = ( cy - metrics.fontBoundingBoxAscent - 1 ) / texHeight;
				let right = ( cx + 0.5 * metrics.width - 1 ) / texWidth;
				let bottom = ( cy + metrics.fontBoundingBoxDescent + 1 ) / texHeight;

				this.charUVs[ char ] = [ left, bottom, left, top, right, bottom, right, top ];

				//ctx.strokeRect( left * texWidth, top * texHeight, right * texWidth - left * texWidth, bottom * texHeight - top * texHeight );

				ctx.fillText( char, cx, cy );

			}

		}

		document.body.append( canvas );

		this.texture = this.gl.createTexture();
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );
		this.gl.texImage2D( this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas );
		this.gl.generateMipmap( this.gl.TEXTURE_2D );

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
						colours.push( 0.0, 0.0, 0.0, 0.0 );
						colours.push( 0.0, 0.0, 0.0, 0.0 );
						colours.push( 0.0, 0.0, 0.0, 0.0 );

					}

					vertices.push( left, bottom, left, top, right, bottom, right, top );
					colours.push( 0.0, 0.0, 0.0, 0.0 );
					colours.push( 0.0, 0.0, 0.0, 0.0 );
					colours.push( 0.0, 0.0, 0.0, 0.0 );
					colours.push( 0.0, 0.0, 0.0, 0.0 );

					textureCoord.push( ...charUVs );

					if ( col === layer.cols - 1 ) {

						vertices.push( right, top );
						textureCoord.push( 0, 0 );
						colours.push( 0.0, 0.0, 0.0, 0.0 );

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

		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

		for ( let layer of this.layers ) {

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.vertices.buffer );
			this.gl.vertexAttribPointer( this.shader.attributes.vertexPosition, layer.vertices.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.textureCoord.buffer );
			this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, layer.textureCoord.typedArray );
			this.gl.vertexAttribPointer( this.shader.attributes.textureCoord, layer.textureCoord.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.colours.buffer );
			this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, layer.colours.typedArray );
			this.gl.vertexAttribPointer( this.shader.attributes.colour, layer.colours.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.uniformMatrix4fv( this.shader.uniforms.modelViewMatrix, false, layer.modelViewMatrix );

			this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, layer.indicesTotal );

		}

	}

}


