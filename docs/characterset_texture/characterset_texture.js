async function main() {

	const characterSet = document.querySelector( "#characterSet" );
	characterSet.setAttribute( "rows", 10 );
	characterSet.setAttribute( "cols", 20 );
	characterSet.value = "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕";
	characterSet.addEventListener( "keyup", () => setCharacterSet( characterSet.value ) );

	const fontFace = document.querySelector( "#fontFace" );
	fontFace.setAttribute( "rows", 10 );
	fontFace.setAttribute( "cols", 40 );
	fontFace.value = `@font-face {
	font-family: "fontFace";
	src: url("https://mdn.github.io/learning-area/css/styling-text/web-fonts/fonts/zantroke-webfont.woff2") format("woff2");
	font-weight: normal;
	font-style: normal;
}`;
	document.querySelector( "#fontFaceHeadStyle" ).textContent = fontFace.value;
	fontFace.addEventListener( "keyup", () => {

		document.querySelector( "#fontFaceHeadStyle" ).textContent = fontFace.value;
		setCharacterSet( characterSet.value );

	} );

	setCharacterSet( characterSet.value );

}


main();


function setCharacterSet( characters, texSize = 512, fontFamily = "fontFace" ) {


	const canvas = document.querySelector( "canvas" );
	canvas.style.border = "1px solid black";

	canvas.width = canvas.height = texSize;

	const ctx = canvas.getContext( "2d" );

	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	let fontSize = 44;
	let metrics;
	let rows;
	let cols;

	do {

		fontSize -= 0.1;
		ctx.font = `${fontSize}px ${fontFamily}`;
		metrics = ctx.measureText( "▓" );
		metrics.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 10;
		rows = Math.floor( texSize / metrics.height );
		cols = Math.floor( texSize / metrics.width );

	} while ( rows * cols < characters.length );

	let dx = texSize / cols;
	let dy = texSize / rows;

	for ( let i = 0; i < characters.length; i ++ ) {

		let cy = 0.5 * dy + Math.floor( i / cols ) * dy;
		let cx = 0.5 * dx + ( i % cols ) * dx;

		ctx.fillText( characters[ i ], cx, cy );

	}

	// for ( let cy = Math.ceil( 0.5 * metrics.height ); cy < texSize; cy += metrics.height ) {

	// 	for ( let cx = Math.ceil( 0.5 * metrics.width ); cx < texSize - 0.5 * metrics.width; cx += metrics.width ) {

	// 		if ( i >= characters.length ) break;

	// 		let char = characters[ i ++ ];

	// 		ctx.fillText( char, cx, cy );

	// 	}

	// }

	console.log( fontSize );

}
