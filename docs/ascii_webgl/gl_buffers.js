class Buffer {

	constructor( gl, array, size ) {

		this.gl = gl;
		this.array = array;
		this.buffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
		gl.bufferData( gl.ARRAY_BUFFER, array, gl.STATIC_DRAW );
		this.size = size;

	}

	update() {

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.buffer );
		this.gl.bufferSubData( this.gl.ARRAY_BUFFER, 0, this.array );

	}

}

export { Buffer };
