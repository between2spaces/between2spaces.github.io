import { createNoise3D } from "./simplexnoise.js";
import { Terminal } from "./terminal.js";

const noise = createNoise3D();
const freq = 0.1;

//const worker = new Worker( "./colony_sim.js", { type: "module" } );


let cols = 128;
let rows = cols;
const terminal = new Terminal( [ { cols, rows }, { cols: 10, rows: 5 }, { cols: 10, rows: 5 }, { cols: 26, rows: 20 } ] ); //new Terminal( 256, 256, 256 );

terminal.writeText( 0, 4, 1, "█████", [ 1.0, 1.0, 1.0, 1.0 ] );
terminal.writeText( 0, 4, 2, "[12]{", [ 0.0, 0.0, 0.0, 1.0 ] );
terminal.writeText( 0, 3, 1, "█████████", [ 0.0, 0.5, 0.0, 1.0 ] );
terminal.writeText( 0, 3, 2, "Alphabet↗", [ 1.0, 1.0, 1.0, 1.0 ] );

drawIsland( terminal, cols / 2, rows / 2, cols );

terminal.update();

let worldTime = 0;

function animate() {

 	requestAnimationFrame( animate );

	worldTime += 0.01;

	/*for ( let row = 0; row < terminal.layers[ 0 ].rows; row ++ ) {

		for ( let col = 0; col < terminal.layers[ 0 ].cols; col ++ ) {

			let height = ( noise( col * freq, row * freq, worldTime ) + 1 ) / 2;

			let char = "░"; //height > 0.75 ? "█" : height > 0.5 ? "▓" : height > 0.25 ? "░" : " ";

			terminal.setChar( col, row, 0, char, [ height * 0.5, height, height, 1.0 ] );

		}

	}*/


}

animate();


function drawIsland( terminal, cx, cy, diameter = 128, seed = Date.now() * 0.000001 ) {

	const radius = diameter * 0.5;
	const radiusSq = radius * radius;
	const radiusSqrt = Math.sqrt( radius );

	const octaves = [
		{ frequency: 0.5, amplitude: 10 }
	];

	const flattenFactor = 0.03;

	for ( let y = cy - radius; y < cy + radius; y ++ ) {

		for ( let x = cx - radius; x < cx + radius; x ++ ) {

			let dist = Math.sqrt( ( x - cx ) * ( x - cx ) + ( y - cy ) * ( y - cy ) );
			let z = 0.0 - ( dist / radius );

			for ( let o of octaves ) {

				let n = noise( x * o.frequency, y * o.frequency, seed ) * o.amplitude;
				z += n;
				z = Math.max( 0, Math.min( 1, z ) );

			}

			terminal.setChar( x, y, 0, "█", [ z, z, z, 1.0 ] );

		}

	}

}
