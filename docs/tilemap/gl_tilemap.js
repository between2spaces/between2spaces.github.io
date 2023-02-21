class TileMap {

	constructor( gl, cols = 100, rows = 100 ) {

		this.cols = cols;
		this.rows = rows;

		this.position = { x: 0, y: 0, z: 0 };
		this.modelViewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
		this.updatePosition = true;

		this.projection = { left: - 50, right: 50, top: 50, bottom: - 50, near: 0, far: 100 };
		this.updateProjection = true;

		this.vertexShader = gl.createShader( gl.VERTEX_SHADER );

		gl.shaderSource( vertexShader, `
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			attribute vec4 aVertexPosition;
			void main() {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
			}
		` );
		gl.compileShader( vertexShader );

		if ( ! gl.getShaderParameter( vertexShader, gl.COMPILE_STATUS ) )
			console.error( `An error occurred compiling the vertex shader: ${gl.getShaderInfoLog( vertexShader )}` );

		const fragmentShader = gl.createShader( gl.FRAGMENT_SHADER );

		gl.shaderSource( fragmentShader, `
			varying highp vec2 vTextureCoord;
			varying highp vec4 vColour;
			uniform sampler2D uTexture;
			void main() {
				gl_FragColor = texture2D(uTexture, vTextureCoord) * vColour;
			}
		` );
		gl.compileShader( fragmentShader );

		if ( ! gl.getShaderParameter( fragmentShader, gl.COMPILE_STATUS ) )
			console.error( `An error occurred compiling the fragment shader: ${gl.getShaderInfoLog( fragmentShader )}` );

		this.shader = {
			program: gl.createProgram(),
			attributes: {},
			uniforms: {}
		};

		gl.attachShader( this.shader.program, vertexShader );
		gl.attachShader( this.shader.program, fragmentShader );
		gl.linkProgram( this.shader.program );

		if ( ! gl.getProgramParameter( this.shader.program, gl.LINK_STATUS ) )
			console.error( `Unable to initialize the shader program: ${gl.getProgramInfoLog( this.shader.program )}` );

		this.shader.uniforms.projectionMatrix = gl.getUniformLocation( this.shader.program, "uProjectionMatrix" );
		this.shader.uniforms.modelViewMatrix = gl.getUniformLocation( this.shader.program, "uModelViewMatrix" );
		this.shader.attributes.vertexPosition = gl.getAttribLocation( this.shader.program, "aVertexPosition" );

		const vertices = [];

		let top = 1 + this.rows * 0.5;

		for ( let row = 0; row < this.rows; row ++ ) {

			top --;

			let left = - 1 - layer.cols * 0.5;

			for ( let col = 0; col < layer.cols; col ++ ) {

				left ++;

				if ( row > 0 && col === 0 ) {

					vertices.push( left, top - 1, layerZ, left, top - 1, layerZ, left, top - 1, layerZ );

				}

				vertices.push( left, top - 1, layerZ, left, top, layerZ, left + 1, top - 1, layerZ, left + 1, top, layerZ );

				if ( col === this.cols - 1 ) {

					vertices.push( left + 1, top, layerZ );

				}

			}

		}

		this.indicesCount = ( this.cols + 1 ) * 4 * this.rows - 3;

		this.vertices = {
			typedArray: new Float32Array( vertices ),
			size: 3,
			buffer: gl.createBuffer(),
			dirty: true
		};

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices.buffer );
		gl.bufferData( gl.ARRAY_BUFFER, this.vertices.typedArray, gl.STATIC_DRAW );
		gl.vertexAttribPointer( this.shader.attributes.vertexPosition, this.vertices.size, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.shader.attributes.vertexPosition );

	}


	setPosition( x, y, z ) {

		this.position.x = x;
		this.position.y = y;
		this.position.z = z;

		this.updatePosition = true;

	}


	setProjection( left, right, top, bottom, near, far ) {

		this.projection.left = left;
		this.projection.right = right;
		this.projection.top = top;
		this.projection.bottom = bottom;
		this.projection.near = near;
		this.projection.far = far;

		this.updateProjection = true;

	}


	zoomProjection( delta ) {

		this.setProjection( this.projection.left * delta, this.projection.right * delta, this.projection.top * delta, this.projection.bottom * delta );

	}


	draw( gl ) {

		gl.useProgram( this.shader.program );

		if ( this.updateProjection ) {

			let lr = 1 / ( this.projection.left - this.projection.right );
			let bt = 1 / ( this.projection.bottom - this.projection.top );
			let nf = 1 / ( this.projection.near - this.projection.far );

			this.projection.matrix = [
				- 2 * lr, 0, 0, 0,
				0, - 2 * bt, 0, 0,
				0, 0, 2 * nf, 0,
				( this.projection.left + this.projection.right ) * lr, ( this.projection.top + this.projection.bottom ) * bt, ( this.projection.far + this.projection.near ) * nf, 1
			];


			gl.uniformMatrix4fv( this.shader.uniforms.projectionMatrix, false, this.projection.matrix );

			this.updateProjection = false;

		}

		if ( this.updatePosition ) {

			this.modelViewMatrix[ 12 ] = this.position.x;
			this.modelViewMatrix[ 13 ] = this.position.y;
			this.modelViewMatrix[ 14 ] = this.position.z;

			gl.uniformMatrix4fv( this.shader.uniforms.modelViewMatrix, false, this.modelViewMatrix );

			this.updatePosition = false;

		}

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices.buffer );

		if ( this.vertices.dirty ) {

			gl.bufferSubData( gl.ARRAY_BUFFER, 0, this.vertices.typedArray );
			this.vertices.dirty = false;

		}

		gl.vertexAttribPointer( this.shader.attributes.vertexPosition, this.vertices.size, gl.FLOAT, false, 0, 0 );

		gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.indicesCount );

	}

}


export default TileMap;

