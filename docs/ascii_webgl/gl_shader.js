class Shader {

	constructor( gl, vertexShaderSource, fragmentShaderSource ) {

		this.gl = gl;
		this.program = createShaderProgram( gl, vertexShaderSource, fragmentShaderSource );
		this.attributes = {};
		this.uniforms = {};

		this.setAttribute( "vertexPosition", "aVertexPosition" );
		this.setUniform( "projectionMatrix", "uProjectionMatrix" );
		this.setUniform( "modelViewMatrix", "uModelViewMatrix" );

	}

	setAttribute( attributeName, shaderAttribute ) {

		this.attributes[ attributeName ] = this.gl.getAttribLocation( this.program, shaderAttribute );

	}

	setUniform( uniformName, shaderUniform ) {

		this.uniforms[ uniformName ] = this.gl.getUniformLocation( this.program, shaderUniform );

	}

}

function createShaderProgram( gl, vertexShaderSource, fragmentShaderSource ) {

	const vertexShader = loadShader( gl, gl.VERTEX_SHADER, vertexShaderSource );
	const fragmentShader = loadShader( gl, gl.FRAGMENT_SHADER, fragmentShaderSource );

	const shaderProgram = gl.createProgram();
	gl.attachShader( shaderProgram, vertexShader );
	gl.attachShader( shaderProgram, fragmentShader );
	gl.linkProgram( shaderProgram );

	if ( ! gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) ) {

		console.error(
			`Unable to initialize the shader program: ${gl.getProgramInfoLog(
				shaderProgram
			)}`
		);
		return null;

	}

	return shaderProgram;

}


function loadShader( gl, type, source ) {

	const shader = gl.createShader( type );
	gl.shaderSource( shader, source );
	gl.compileShader( shader );
	if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {

		console.error(
			`An error occurred compiling the shaders: ${gl.getShaderInfoLog( shader )}`
	  	);
	  	gl.deleteShader( shader );
	  	return null;

	}

	return shader;

}

export { Shader };
