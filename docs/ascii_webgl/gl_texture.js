class Texture {

	constructor( gl, imageSrc ) {

		this.gl = gl;
		this.texture = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
		// Start texture data as a 1x1 opaque black dot until Image has loaded and can replace
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array( [ 0, 0, 0, 0 ] ) );

		const self = this;
		this.image = new Image();
		this.image.onload = () => {

			gl.bindTexture( gl.TEXTURE_2D, self.texture );
			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self.image );

			if ( isPowerOf2( self.image.width ) && isPowerOf2( self.image.height ) ) {

				// Yes, it's a power of 2. Generate mips.
				gl.generateMipmap( gl.TEXTURE_2D );

			} else {

				// No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
				gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
				gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
				gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );

			}

			document.body.append( self.image );

		};

		this.image.src = imageSrc;

	}

}

function isPowerOf2( value ) {

	return ( value & ( value - 1 ) ) === 0;

}

export { Texture };
