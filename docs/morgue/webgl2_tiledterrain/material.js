export default class Material {

	constructor( gl, vertexShader, fragmentShader ) {

		this.gl = gl;
		this.program = gl.createProgram();

		gl.attachShader( this.program, compileShader( gl, gl.VERTEX_SHADER, vertexShader ) );
		gl.attachShader( this.program, compileShader( gl, gl.FRAGMENT_SHADER, fragmentShader ) );

		// link the program.
		gl.linkProgram( this.program );

		// Check if it linked.
		if ( ! gl.getProgramParameter( this.program, gl.LINK_STATUS ) )
	 		throw ( "program failed to link:" + gl.getProgramInfoLog( this.program ) );

		this.attribute = {};
		this.uniform = {};

		this.onUseListeners = [];

	}

	setAttributeLocations( attributes ) {

		for ( let name of attributes ) {

			this.attribute[ name ] = this.gl.getAttribLocation( this.program, name );

		}

	}


	setUniformLocations( uniforms ) {

		for ( let name of uniforms ) {

			this.uniform[ name ] = this.gl.getUniformLocation( this.program, name );

		}

	}


	add( object ) {

		if ( this.objects.indexOf( object ) === - 1 ) {

			this.objects.push( object );

		}

	}


	use( camera, lights ) {

		this.gl.useProgram( this.program );
		this.gl.uniform1i( this.uniform.texture, 0 );
		this.gl.activeTexture( this.gl.TEXTURE0 );
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.texture );

		this.gl.uniformMatrix4fv( this.uniform.view, false, camera.view );
		this.gl.uniformMatrix4fv( this.uniform.projection, false, camera.projection );

		for ( let light in lights ) {

			if ( light instanceof DirectionalLight ) {

				if ( this.uniform.hasOwnProperty( "directionalLight" ) ) this.gl.uniform3fv( this.uniform.directionalLight, light.position );
				if ( this.uniform.hasOwnProperty( "directionalLightColour" ) ) this.gl.uniform3fv( this.uniform.directionalLightColour, light.colour );

			}

		}

		for ( let callback in this.onUseListeners ) {

			callback();

		}

	}


	onUse( callback ) {


		this.onUseListeners.push( callback );

	}


}


function compileShader( gl, shaderType, shaderSource ) {

	// Create the shader object
	let shader = gl.createShader( shaderType );

	// Set the shader source code.
	gl.shaderSource( shader, shaderSource );

	// Compile the shader
	gl.compileShader( shader );

	// Check if it compiled
	if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
		throw ( "could not compile shader:" + gl.getShaderInfoLog( shader ) );

	return shader;

}

