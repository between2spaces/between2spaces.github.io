async function main() {

	const characterSet = document.querySelector( "#characterSet" );
	characterSet.setAttribute( "rows", 10 );
	characterSet.setAttribute( "cols", 20 );
	characterSet.value = "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕";
	const fontFace = document.querySelector( "#fontFace" );
	fontFace.setAttribute( "rows", 10 );
	fontFace.setAttribute( "cols", 40 );
	document.querySelector( "#fontFaceHeadStyle" ).textContent = fontFace.value;
	fontFace.addEventListener( "keyup", () => {

		document.querySelector( "#fontFaceHeadStyle" ).textContent = fontFace.value;

	} );

	const size = document.querySelector( "#size" );
	size.value = "512";

	setInterval( update, 200 );

}


main();


function update() {

	const characters = document.querySelector( "#characterSet" ).value;
	const texSize = parseInt( document.querySelector( "#size" ).value );

	const canvas = document.querySelector( "canvas" );
	canvas.style.border = "1px solid black";

	canvas.width = canvas.height = texSize;

	const ctx = canvas.getContext( "2d" );

	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	let fontSize = 100;
	let metrics;
	let rows;
	let cols;

	do {

		fontSize -= 1;
		ctx.font = `${fontSize}px fontFace`;
		metrics = ctx.measureText( "▓" );
		metrics.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 10;
		rows = Math.floor( texSize / ( metrics.height + 3 ) );
		cols = Math.floor( texSize / ( metrics.width + 3 ) );

	} while ( rows * cols < characters.length );

	let dx = texSize / cols;
	let dy = texSize / rows;

	for ( let i = 0; i < characters.length; i ++ ) {

		let cy = 0.5 * dy + Math.floor( i / cols ) * dy;
		let cx = 0.5 * dx + ( i % cols ) * dx;

		ctx.fillText( characters[ i ], cx, cy );

	}

	if ( document.querySelector( "#boundaries" ).checked ) {

		// debug/test spacing - everything should be locatable using texSize, cols, rows

		dx = texSize / cols;
		dy = texSize / rows;
		ctx.strokeStyle = "blue";
		ctx.lineWidth = 1;

		for ( let x = dx; x < texSize; x += dx ) {

			ctx.beginPath();
			ctx.moveTo( x, 0 );
			ctx.lineTo( x, texSize );
			ctx.stroke();

		}

		for ( let y = dy; y < texSize; y += dy ) {

			ctx.beginPath();
			ctx.moveTo( 0, y );
			ctx.lineTo( texSize, y );
			ctx.stroke();

		}

	}

}
