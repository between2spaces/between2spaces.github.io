import { createNoise2D } from "./simplexnoise.js";
import { seedrandom } from "./seedrandom.js";
import { Terminal } from "./terminal.js";

//  Pseudo Random Number Generator
function PRNG( seed = 0 ) {

	let prng = () => {

		let z = ( seed += 0x9e3779b9 );
		z ^= z >>> 16;
		z = Math.imul( z, 0x21f0aaad );
		z ^= z >>> 15;
		z = Math.imul( z, 0x735a2d97 );
		z ^= z >>> 15;
		return z;

	};

	return prng;

}


const freq = 0.1;

//const worker = new Worker( "./colony_sim.js", { type: "module" } );


let cols = 512;
let rows = cols;
const terminal = new Terminal( [
	{ cols, rows },
	{ cols: 20, rows: 10 },
	{ cols: 20, rows: 10 }
] );

terminal.writeText( 0, 4, 1, "█████", [ 0.0, 0.0, 0.0, 0.5 ] );
terminal.writeText( 0, 4, 2, "[12]{", [ 0.99, 0.99, 0.99, 1.0 ] );


class HeightMap {

	constructor( seed, mapSize, edgeWidth = null ) {

		this.seed = seed;
		this.mapSize = mapSize;
		this.edgeWidth = edgeWidth === null ? this.mapSize * 0.3 : edgeWidth;

		this.noise = createNoise2D( seedrandom( Math.random() ) ); //PRNG( seed ) );

		this.heightArray = new Array( this.mapSize * this.mapSize );

	}

	generateHeights() {

		const octaves = [
			{ frequency: 1.0 / this.mapSize, amplitude: 1 },
			{ frequency: 2.0 / this.mapSize, amplitude: 0.5 },
			{ frequency: 4.0 / this.mapSize, amplitude: 0.25 },
			{ frequency: 8.0 / this.mapSize, amplitude: 0.125 },
		];

		let minHeight = 1;
		let maxHeight = - 1;

		for ( let y = 0; y < this.mapSize; y ++ ) {

			for ( let x = 0; x < this.mapSize; x ++ ) {

				let index = y * this.mapSize + x;
				let height = 0;

				for ( let octave of octaves ) height += this.noise( x * octave.frequency, y * octave.frequency ) * octave.amplitude;

				if ( height < minHeight ) minHeight = height;
				if ( height > maxHeight ) maxHeight = height;

				this.heightArray[ index ] = height;

			}

		}

		// normalise heights from (-1, 1) to [0, 1]
		let normalised = 1.0 / ( maxHeight - minHeight );
		let edgeSq = Math.sqrt( this.edgeWidth * this.edgeWidth * 2 );

		for ( let y = 0; y < this.mapSize; y ++ ) {

			for ( let x = 0; x < this.mapSize; x ++ ) {

				let index = y * this.mapSize + x;

			    let dx = 0;
				let dy = 0;

				if ( x < this.edgeWidth ) dx = this.edgeWidth - x;
				if ( y < this.edgeWidth ) dy = this.edgeWidth - y;
				if ( y > this.mapSize - this.edgeWidth ) dy = y - ( this.mapSize - this.edgeWidth );
				if ( x > this.mapSize - this.edgeWidth ) dx = x - ( this.mapSize - this.edgeWidth );

			    let clamp = ( dx > 0 || dy > 0 ) ? ( edgeSq - Math.sqrt( dx * dx + dy * dy ) ) / edgeSq : 1;

				let height = ( this.heightArray[ index ] - minHeight ) * normalised * clamp * clamp;
				this.heightArray[ index ] = height;

			}

		}

	}


	erode( iterations = 10 ) {

		//const singleDirt = 1.0 / this.mapSize;
		const minSlope = 0.01; //1.0 / this.mapSize;
		const sedimentMax = 50;

		for ( let iteration = 0; iteration < iterations; iteration ++ ) {

			for ( let y = 1; y < this.mapSize - 1; y ++ ) {

				for ( let x = 1; x < this.mapSize - 1; x ++ ) {

					let index = y * this.mapSize + x;
					let current = this.heightArray[ index ];
					let neighbours = [
						( y - 1 ) * this.mapSize + x,
						( y + 1 ) * this.mapSize + x,
						y * this.mapSize + x + 1,
						y * this.mapSize + x - 1
					];

					let lowest = 0;
					let maxDiff = 0;

					for ( let n = 0; n < neighbours.length; n ++ ) {

						let diff = current - this.heightArray[ neighbours[ n ] ];
						if ( diff > maxDiff ) {

							maxDiff = diff;
							lowest = n;

						}

					}

					if ( maxDiff > minSlope ) {

						let sediment = minSlope;//( sedimentMax * singleDirt ) * maxDiff;
						this.heightArray[ index ] -= sediment;
						this.heightArray[ neighbours[ lowest ] ] += sediment;

					}

				}

			}

		}

	}

	getHeight( x, y ) {

		return this.heightArray[ y * this.mapSize + x ];

	}

	setHeight( x, y, height ) {

		if ( height < - 1 ) height = - 1;
		if ( height > 1 ) height = 1;

		let index = y * this.mapSize + x;
		this.heightArray[ index ] = height;

	}

}


function drawHeightMap( terminal, heightmap ) {

	const halfSize = 0.5 * heightmap.mapSize;

	for ( let y = 0; y < heightmap.mapSize; y ++ ) {

		for ( let x = 0; x < heightmap.mapSize; x ++ ) {

			let height = heightmap.getHeight( x, y );
			let slope = 0;

			if ( y > 0 ) slope = Math.max( slope, Math.abs( heightmap.getHeight( x, y - 1 ) - height ) );
			if ( y < heightmap.mapSize - 1 ) slope = Math.max( slope, Math.abs( heightmap.getHeight( x, y + 1 ) - height ) );
			if ( x > 0 ) slope = Math.max( slope, Math.abs( heightmap.getHeight( x - 1, y ) - height ) );
			if ( x < heightmap.mapSize - 1 ) slope = Math.max( slope, Math.abs( heightmap.getHeight( x + 1, y ) - height ) );

			let r = height;
			let g = height;
			let b = height;

			if ( slope < 3.0 / heightmap.mapSize ) {

				r = 0.1;
				g = 0.5;
				b = 0.1;

			}

			// below water line
			if ( height < 0.2 ) {

				r *= 0.5;
				g *= 0.5;
				b = 0.5;

			}

			terminal.setChar( x, y, 0, "█", [ r, g, b, 1.0 ] );

		}

	}

}


const heightmap = new HeightMap( Math.random() * 9999999999, cols );

heightmap.generateHeights();


let worldTime = 0;

function animate() {

 	requestAnimationFrame( animate );

	worldTime += 0.01;

	//	heightmap.erode();

	drawHeightMap( terminal, heightmap );

	terminal.update();


	/*for ( let row = 0; row < terminal.layers[ 0 ].rows; row ++ ) {

		for ( let col = 0; col < terminal.layers[ 0 ].cols; col ++ ) {

			let height = ( noise( col * freq, row * freq, worldTime ) + 1 ) / 2;

			let char = "░"; //height > 0.75 ? "█" : height > 0.5 ? "▓" : height > 0.25 ? "░" : " ";

			terminal.setChar( col, row, 0, char, [ height * 0.5, height, height, 1.0 ] );

		}

	}*/


}

animate();


