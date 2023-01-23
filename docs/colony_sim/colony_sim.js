import { createNoise4D } from "./simplexnoise.js";
import { openSimplexNoise } from "./openSimplexNoise.js";

const noise = createNoise4D();
//const noise = openSimplexNoise( Math.random() ).noise4D;
const freq = 0.01;
const encoder = new TextEncoder();

//const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const characters = " ░▓█";

let config;

let worldMap;
let worldCols;
let worldRows;
let worldDepth;
let worldArea;
let worldTime = 0;

let view;
let viewOffsetRow;
let viewOffsetCol;
let viewOffsetDepth;
let cursorCol;
let cursorRow;

let pause = false;


onmessage = event => self[ `on${event.data[ 0 ]}` ]( event.data[ 1 ] );


self.onInit = _config => {

	config = _config;

	worldCols = config.worldSize[ 0 ];
	worldRows = config.worldSize[ 1 ];
	worldDepth = config.worldSize[ 2 ];
	worldArea = worldCols * worldRows;

	worldMap = new Array( worldCols * worldRows * worldDepth );

	for ( let depth = 0; depth < worldDepth; depth ++ ) {

		for ( let row = 0; row < worldRows; row ++ ) {

			for ( let col = 0; col < worldCols; col ++ ) {

				worldMap[ depth * worldArea + row * worldCols + col ] = {
					depth, row, col,
					height: ( noise( col * freq, row * freq, depth * freq, worldTime ) + 1 ) / 2
				};

			}

		}

	}

	viewOffsetRow = 0;
	viewOffsetCol = 0;
	viewOffsetDepth = worldDepth / 2;

	cursorCol = Math.round( config.viewCols / 2 );
	cursorRow = Math.round( config.viewRows / 2 );

	onResizeView( _config );
	onMoveCursor( [ 0, 0 ] );

};


self.onResizeView = _config => {

	if ( ! config ) {

		onInit( _config );

	} else {

		config.viewCols = _config.viewCols;
		config.viewRows = _config.viewRows;

	}

	view = new Array( config.viewRows * config.viewCols );

	onMoveCursor( [ 0, 0 ] );

};


self.onMoveCursor = delta => {

	cursorCol += delta[ 0 ];
	cursorRow += delta[ 1 ];

	let layerText = "".padStart( cursorRow, "\n" ) + "⬤".padStart( cursorCol * 2 + 1 );

	const arrayBuffer = encoder.encode( layerText ).buffer;
	postMessage( [ 3, arrayBuffer ], [ arrayBuffer ] );

};


self.onPanView = delta => {

	viewOffsetCol += delta[ 0 ];
	viewOffsetRow += delta[ 1 ];

};


self.onTogglePause = () => {

	pause = ! pause;

	console.log( `Pause = ${pause}` );

};


function animate() {

	requestAnimationFrame( animate );

	if ( ! view || pause ) return;

	worldTime += 0.001;

	for ( let depth = viewOffsetDepth - 0; depth <= viewOffsetDepth + 0; depth ++ ) {

		let layerText = "";

		for ( let row = 0; row < config.viewRows; row ++ ) {

			for ( let col = 0; col < config.viewCols; col ++ ) {

				const world = worldMap[ depth * worldRows * worldCols + row * worldCols + col ];
				world.height = ( noise( col * freq, row * freq, depth * freq, worldTime ) + 1 ) / 2;

				let height = world.height * worldDepth;
				let char = "░";

				if ( height >= depth + 1 ) char = "█";
				else if ( height >= depth + .1 ) char = "▓";
				//else if ( height >= depth - 1.66 ) char = "░";
				//world.type = characters.charAt( Math.floor( ( ( noise( col * freq, row * freq, depth * freq, t ) + 1 ) / 2 ) * characters.length ) );
				layerText += char + char;

			}

			layerText += "\n";

		}

		const arrayBuffer = encoder.encode( layerText ).buffer;
		postMessage( [ depth - viewOffsetDepth + 1, arrayBuffer ], [ arrayBuffer ] );

	}

	let layerText = "╭" + "╮".padStart( config.viewCols * 2 - 1, "━" );
	const arrayBuffer = encoder.encode( layerText ).buffer;
	postMessage( [ 4, arrayBuffer ], [ arrayBuffer ] );

}

animate();


