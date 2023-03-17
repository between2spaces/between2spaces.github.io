export class Terminal {

	constructor( layers = [ { cols: 80, rows: 30 } ], container = document.body ) {

		this.layers = layers;
		this.container = container;

		this.canvas = document.createElement( "canvas" );
		this.container.append( this.canvas );

		this.gl = this.canvas.getContext( "webgl", { antialias: false } );
		this.fitContainer();

		let self = this;
		window.addEventListener( "resize", () => self.fitContainer() );

		this.gl.clearColor( 0.0, 0.0, 0.0, 1.0 ); // Clear to black, fully opaque
		this.gl.clearDepth( 1.0 ); // Clear everything
		this.gl.disable( this.gl.DEPTH_TEST );

		this.gl.enable( this.gl.BLEND );
		this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );

		let cols = layers[ 0 ].cols;
		let rows = layers[ 0 ].rows;

		this.projection = {
			left: - cols * 0.5,
			right: cols * 0.5,
			top: rows * 0.5,
			bottom: - rows * 0.5,
			near: 0,
			far: 100
		};

		this.zoom( 1 );


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

		this.setCharacterSet( "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕", 1024, 1024 );


		this.modelViewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
		this.modelViewDirty = true;

	}

	fitContainer() {

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );

	}

	zoom( delta ) {

		this.projection.left *= delta;
		this.projection.right *= delta;
		this.projection.top *= delta;
		this.projection.bottom *= delta;

		let lr = 1 / ( this.projection.left - this.projection.right );
		let bt = 1 / ( this.projection.bottom - this.projection.top );
		let nf = 1 / ( this.projection.near - this.projection.far );

		this.projectionMatrix = [ - 2 * lr, 0, 0, 0, 0, - 2 * bt, 0, 0, 0, 0, 2 * nf, 0, ( this.projection.left + this.projection.right ) * lr, ( this.projection.top + this.projection.bottom ) * bt, ( this.projection.far + this.projection.near ) * nf, 1 ];

		this.projectionDirty = true;

	}

	setCharacterSet( characters, texWidth = 512, texHeight = 512, fontFamily = "monospace" ) {

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

		this.charUVs = {};

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

				this.charUVs[ char ] = [ left, bottom, left, top, right, bottom, right, top ];


			}

		}

		this.texture = this.gl.createTexture();
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );
		this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR );
		this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR );
		this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE );
		this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE );
		this.gl.texImage2D( this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas );

		this.buildBuffers();

	}


	buildBuffers() {

		const charUVs = this.charUVs[ " " ]; //\0" ];

		let layerZ = - this.layers.length + 1;

		for ( let layer of this.layers ) {

			let textureCoord = [];
			let colours = [];
			let vertices = [];

			let top = 1 + layer.rows * 0.5;

			for ( let row = 0; row < layer.rows; row ++ ) {

				top --;

				let bottom = top - 1;
				let left = - 1 - layer.cols * 0.5;

				for ( let col = 0; col < layer.cols; col ++ ) {

					left ++;

					let right = left + 1;

					if ( row > 0 && col === 0 ) {

						vertices.push( left, bottom, layerZ, left, bottom, layerZ, left, bottom, layerZ );
						textureCoord.push( 0, 0, 0, 0, 0, 0 );
						colours.push( 0.0, 0.0, 0.0, 0.0 );
						colours.push( 0.0, 0.0, 0.0, 0.0 );
						colours.push( 0.0, 0.0, 0.0, 0.0 );

					}

					vertices.push( left, bottom, layerZ, left, top, layerZ, right, bottom, layerZ, right, top, layerZ );
					colours.push( 0.0, 0.0, 0.0, 0.0 );
					colours.push( 0.0, 0.0, 0.0, 0.0 );
					colours.push( 0.0, 0.0, 0.0, 0.0 );
					colours.push( 0.0, 0.0, 0.0, 0.0 );

					textureCoord.push( ...charUVs );

					if ( col === layer.cols - 1 ) {

						vertices.push( right, top, layerZ );
						textureCoord.push( 0, 0 );
						colours.push( 0.0, 0.0, 0.0, 0.0 );

					}


				}

			}

			layer.indicesPerRow = ( layer.cols + 1 ) * 4;
			layer.indicesTotal = layer.indicesPerRow * layer.rows - 3;

			layer.vertices = {
				typedArray: new Float32Array( vertices ),
				size: 3,
				buffer: this.gl.createBuffer(),
				dirty: true
			};
			layer.colours = {
				typedArray: new Float32Array( colours ),
				size: 4,
				buffer: this.gl.createBuffer(),
				dirty: true
			};

			layer.textureCoord = {
				typedArray: new Float32Array( textureCoord ),
				size: 2,
				buffer: this.gl.createBuffer(),
				dirty: true
			};

			//layer.modelViewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, layerZ ++, 1 ];
			layer.z = layerZ;
			layerZ ++;

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


		// Tell WebGL we want to affect texture unit 0
		this.gl.activeTexture( this.gl.TEXTURE0 );

		// Bind the texture to texture unit 0
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );

		// Tell the shader we bound the texture to texture unit 0
		this.gl.uniform1i( this.shader.uniforms.texture, 0 );

	}


	translate( x, y, z ) {

		this.projectionMatrix[ 12 ] = this.projectionMatrix[ 0 ] * x + this.projectionMatrix[ 4 ] * y + this.projectionMatrix[ 8 ] * z + this.projectionMatrix[ 12 ];
		this.projectionMatrix[ 13 ] = this.projectionMatrix[ 1 ] * x + this.projectionMatrix[ 5 ] * y + this.projectionMatrix[ 9 ] * z + this.projectionMatrix[ 13 ];
		this.projectionMatrix[ 14 ] = this.projectionMatrix[ 2 ] * x + this.projectionMatrix[ 6 ] * y + this.projectionMatrix[ 10 ] * z + this.projectionMatrix[ 14 ];
		this.projectionMatrix[ 15 ] = this.projectionMatrix[ 3 ] * x + this.projectionMatrix[ 7 ] * y + this.projectionMatrix[ 11 ] * z + this.projectionMatrix[ 15 ];
		this.projectionDirty = true;

	}

	setHeight( col, row, layer, height ) {

		if ( layer > this.layers.length - 1 ) return;

		layer = this.layers[ layer ];

		let indices = row * layer.indicesPerRow + col * 4;
		let verticesIndex = indices * 3;

		layer.vertices.typedArray[ verticesIndex ] = layer.z + height;

		layer.vertices.dirty = false;

	}


	setChar( col, row, layer, char, colour = undefined ) {

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

		layer.textureCoord.dirty = true;

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

			layer.colours.dirty = true;

		}

	}

	writeText( col, row, layer = 0, string, colour = undefined ) {

		for ( let char of string ) this.setChar( col ++, row, layer, char, colour );

	}


	update() {

		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

		if ( this.modelViewDirty ) {

			this.gl.uniformMatrix4fv( this.shader.uniforms.modelViewMatrix, false, this.modelViewMatrix );

			this.modelViewDirty = false;

		}

		if ( this.projectionDirty ) {

			this.gl.uniformMatrix4fv( this.shader.uniforms.projectionMatrix, false, this.projectionMatrix );

			this.gl.uniformMatrix4fv( this.shader.uniforms.modelViewMatrix, false, this.modelViewMatrix );

			this.projectionDirty = false;

		}

		for ( let layer of this.layers ) {

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.vertices.buffer );

			if ( layer.vertices.dirty ) {

				this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, layer.vertices.typedArray );
				layer.vertices.dirty = false;

			}

			this.gl.vertexAttribPointer( this.shader.attributes.vertexPosition, layer.vertices.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.textureCoord.buffer );

			if ( layer.textureCoord.dirty ) {

				this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, layer.textureCoord.typedArray );
				layer.textureCoord.dirty = false;

			}

			this.gl.vertexAttribPointer( this.shader.attributes.textureCoord, layer.textureCoord.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, layer.colours.buffer );

			if ( layer.colours.dirty ) {

				this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, layer.colours.typedArray );
				layer.textureCoord.dirty = false;

			}

			this.gl.vertexAttribPointer( this.shader.attributes.colour, layer.colours.size, this.gl.FLOAT, false, 0, 0 );

			this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, layer.indicesTotal );

		}

	}

}


