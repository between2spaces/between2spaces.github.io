
export function createCanvasTexture( gl, size = 1024 ) {

	const obj = {
		canvas: document.createElement( "canvas" ),
		texture: gl.createTexture()
	};

	obj.canvas.width = obj.canvas.height = size;
	obj.ctx = obj.canvas.getContext( "2d" );

	obj.ctx.clearRect( 0, 0, obj.canvas.width, obj.canvas.height );

	return obj;

}



export function updateTexture( gl, image, texture ) {

	gl.bindTexture( gl.TEXTURE_2D, texture );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );

}



export function charTileMap( gl, chars, size = 1024 ) {

	const obj = createCanvasTexture( gl, size );

	obj.ctx.fillStyle = "white";
	obj.ctx.textAlign = "center";
	obj.ctx.textBaseline = "middle";

	let font = size * 0.5;
	let metrics;
	let cols;
	let height;
	let uvs = {};

	do {

		obj.ctx.font = `${font --}px monospace`;
		metrics = obj.ctx.measureText( "█" );
		cols = Math.floor( obj.canvas.width / metrics.width );
		height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

	} while ( cols * Math.floor( obj.canvas.height / height ) < chars.length );

	for ( let i = 0, l = chars.length; i < l; i ++ ) {

		let y = metrics.actualBoundingBoxAscent + Math.floor( i / cols ) * height;
		let x = metrics.width * 0.5 + ( i % cols ) * metrics.width;

		obj.ctx.fillText( chars[ i ], x, y );

		let left = ( x - 0.5 * metrics.width ) / size;
		let top = ( y - metrics.actualBoundingBoxAscent ) / size;
		let right = ( x + 0.5 * metrics.width ) / size;
		let bottom = ( y + metrics.actualBoundingBoxDescent ) / size;

		uvs[ chars[ i ] ] = [ left, bottom, left, top, right, bottom, right, top ];

	}

	updateTexture( gl, obj.canvas, obj.texture );

	obj.uvs = uvs;

	return obj;

}



export function loadTexture( gl, imageSrc ) {

	const obj = createCanvasTexture( gl, 1 );

	const image = new Image();
	image.src = imageSrc;
	image.addEventListener( "load", function () {

		obj.canvas.width = obj.canvas.height = image.width;
		obj.ctx = obj.canvas.getContext( "2d" );
		obj.ctx.drawImage( image, 0, 0 );
		updateTexture( gl, obj.canvas, obj.texture );

	} );

	return obj;

}
