window.onload = main;

function main() {

	const canvas = document.querySelector( "#glCanvas" );
	const gl = canvas.getContext( "webgl" );
	gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
	gl.clear( gl.COLOR_BUFFER_BIT );

	const shaderProgram = initShaderProgram( gl, `
	  attribute vec4 aVertexPosition;
	  uniform mat4 uModelViewMatrix;
	  uniform mat4 uProjectionMatrix;
	  void main() {
	    gl_Position = uModelViewMatrix * aVertexPosition;
	  }
	`, `
	  void main() {
	    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
	  }
	` );

	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation( shaderProgram, "aVertexPosition" ),
		},
		uniformLocations: {
			modelViewMatrix: gl.getUniformLocation( shaderProgram, "uModelViewMatrix" ),
		}
	};


	initBuffers( gl );

	drawScene( gl, programInfo );


}

function initBuffers( gl ) {

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
	const positions = [
		 1.0, 1.0,
		- 1.0, 1.0,
		 1.0, - 1.0,
		- 1.0, - 1.0
	];
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( positions ), gl.STATIC_DRAW );

}

function drawScene( gl, programInfo ) {

	gl.clearColor( 0.0, 0.0, 0.0, 1.0 ); // Clear to black, fully opaque
	gl.clearDepth( 1.0 ); // Clear everything
	gl.enable( gl.DEPTH_TEST ); // Enable depth testing
	gl.depthFunc( gl.LEQUAL ); // Near things obscure far things
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	// Create a perspective matrix
	//const projectionMatrix = glMatrix.mat4.create();
	//glMatrix.mat4.perspective( projectionMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0 );

	// Set drawing position to the "identity" point, which is the centre of the scene
	const modelViewMatrix = glMatrix.mat4.create();

	// Move drawing position
	// DEBUG: offset -0.1 to remember we're drawing something over black background
	glMatrix.mat4.translate( modelViewMatrix, modelViewMatrix, [ - 0.1, 0.0, - 0.0 ] );

	// Tell WebGL how to pull out positions form position buffer into the vertexPosition attribute
	gl.vertexAttribPointer( programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( programInfo.attribLocations.vertexPosition );

	gl.useProgram( programInfo.program );

	//gl.uniformMatrix4fv( programInfo.uniformLocations.projectionMatrix, false, projectionMatrix );
	gl.uniformMatrix4fv( programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix );

	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

}

function initShaderProgram( gl, vertexShaderSource, fragmentShaderSource ) {

	const vertexShader = loadShader( gl, gl.VERTEX_SHADER, vertexShaderSource );
	const fragmentShader = loadShader( gl, gl.FRAGMENT_SHADER, fragmentShaderSource );
	const shaderProgram = gl.createProgram();
	gl.attachShader( shaderProgram, vertexShader );
	gl.attachShader( shaderProgram, fragmentShader );
	gl.linkProgram( shaderProgram );
	if ( gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) ) return shaderProgram;
	alert( `Unable to initialize the shader program:
${gl.getProgramInfoLog( shaderProgram )}` );

}

function loadShader( gl, type, source ) {

	const shader = gl.createShader( type );
	gl.shaderSource( shader, source );
	gl.compileShader( shader );
	if ( gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) return shader;
	alert( `An error occurred compiling the shaders:
${gl.getShaderInfoLog( shader )}` );
	gl.deleteShader( shader );

}
