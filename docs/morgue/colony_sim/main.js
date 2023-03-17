const worker = new Worker( "./colony_sim.js", { type: "module" } );

const config = {
	fontSize: 16,
	worldSize: [ 128, 128, 128 ]
};

document.body.style.fontFamily = "monospace";
document.body.style.fontVariantNumeric = "tabular-nums lining-nums";
document.body.style.fontSize = `${config.fontSize}px`;
document.body.style.letterSpacing = '-2px';
document.body.style.color = "black";


const oneRowDiv = document.createElement( "div" );
oneRowDiv.style.position = "absolute";
oneRowDiv.style.left = 0;
oneRowDiv.style.top = 0;
oneRowDiv.style.wordBreak = "break-all";
oneRowDiv.style.visibility = "hidden";
oneRowDiv.textContent = "W";
document.body.append( oneRowDiv );

const layers = new Array( 3 );


for ( let i = 0; i < layers.length; i ++ ) {

	const div = layers[ i ] = document.createElement( "div" );
	div.style.position = "absolute";
	div.style.left = 0;
	div.style.right = 0;
	div.style.top = 0;
	div.style.bottom = 0;
	div.style.wordBreak = "break-all";
	div.style.whiteSpace = "break-spaces";
	document.body.append( div );

}

layers[ 0 ].style.color = "black";
layers[ 0 ].style.opacity = 1;

layers.CURSOR = layers[ 1 ];
layers.CURSOR.style.opacity = 0.5;
layers.CURSOR.style.color = "red";

function cursorFlash() {

	layers.CURSOR.style.visibility = layers.CURSOR.style.visibility === "hidden" ? "visible" : "hidden";

}

let cursorFlashInterval = setInterval( cursorFlash, 300 );


layers.UI = layers[ 2 ];
layers.UI.style.color = "sky blue";



const decoder = new TextDecoder();


worker.onmessage = function ( event ) {

	layers[ event.data[ 0 ] ].textContent = decoder.decode( event.data[ 1 ] );

};

worker.onerror = function ( err ) {

	console.error( err );

};



function resizeView() {

	oneRowDiv.textContent = "W";

	let curr = oneRowDiv.getBoundingClientRect();
	let rect = curr;

	while ( curr.height === rect.height ) {

		rect = curr;
		oneRowDiv.textContent += "W";
		curr = oneRowDiv.getBoundingClientRect();

	}

	oneRowDiv.textContent = oneRowDiv.textContent.substr( 1 );

	config.viewCols = Math.floor( oneRowDiv.textContent.length / 2 );
	config.viewRows = Math.round( visualViewport.height / rect.height );

	worker.postMessage( [ "ResizeView", config ] );

}

resizeView();

window.addEventListener( "resize", resizeView );

let mode = "cursor";

window.addEventListener( "keydown", event => {

	const key = event.key;

	console.log( `keydown = ${key}` );

	if ( key === " " ) return togglePause();

	if ( mode === "cursor" ) {

		let delta = [ 0, 0 ];

		if ( key === "k" ) delta[ 1 ] = - 1;
		else if ( key === "j" ) delta[ 1 ] = 1;
		else if ( key === "l" ) delta[ 0 ] = 1;
		else if ( key === "h" ) delta[ 0 ] = - 1;

		if ( delta[ 0 ] !== 0 || delta[ 1 ] !== 0 ) {

			worker.postMessage( [ "MoveCursor", delta ] );
			clearInterval( cursorFlashInterval );
			layers.CURSOR.style.visibility = "visible";
			cursorFlashInterval = setInterval( cursorFlash, 300 );

		}

		if ( key === "Escape" ) {

			mode = "command";
			clearInterval( cursorFlashInterval );
			layers.CURSOR.style.visibility = "hidden";

		}

		return;

	} else {

		if ( key === "i" ) {

			mode = "cursor";
			layers.CURSOR.style.visibility = "visible";
			cursorFlashInterval = setInterval( cursorFlash, 300 );
			return;

		}

	}

} );


function togglePause() {

	console.log( "key -> TogglePause" );
	worker.postMessage( [ "TogglePause" ] );

}

