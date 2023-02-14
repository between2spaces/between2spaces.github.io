import { createNoise2D } from "./simplexnoise.js";
import { seedrandom } from "./seedrandom.js";
import { Terminal } from "./terminal.js";


//const worker = new Worker( "./colony_sim.js", { type: "module" } );


let cols = 64;
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

		this.noise = createNoise2D( Math.random ); //seedrandom( Math.random() ) );

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

		// shift range from [-1, 1] to [0, 1]; and
		// normalise such that lowest is 0 and highest is 1; and
		// clamp height near edges (i.e. gaurantees island )
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

	erode( erosionAmount ) {

		for ( let y = 0; y < this.mapSize; y ++ ) {

			for ( let x = 0; x < this.mapSize; x ++ ) {

				let index = y * this.mapSize + x;
				let currentHeight = this.heightArray[ index ];
				let totalAmountToMove = 0;
				let numberOfLowerNeighbors = 0;

				if ( x > 0 ) {

					let westHeight = this.heightArray[ index - 1 ];
					if ( westHeight < currentHeight ) {

						totalAmountToMove += currentHeight - westHeight;
						numberOfLowerNeighbors ++;

					}

				}

				if ( y > 0 ) {

					let northHeight = this.heightArray[ ( y - 1 ) * this.mapSize + x ];

					if ( northHeight < currentHeight ) {

						totalAmountToMove += currentHeight - northHeight;
						numberOfLowerNeighbors ++;

					}

				}

				if ( i < rows - 1 ) {

					if ( heightmap[ i + 1 ][ j ] < currentHeight ) {

						totalAmountToMove += currentHeight - heightmap[ i + 1 ][ j ];
						numberOfLowerNeighbors ++;

					}

				}

				if ( j < cols - 1 ) {

					if ( heightmap[ i ][ j + 1 ] < currentHeight ) {

						totalAmountToMove += currentHeight - heightmap[ i ][ j + 1 ];
						numberOfLowerNeighbors ++;

					}

				}

				if ( numberOfLowerNeighbors > 0 ) {

					let averageAmountToMove = totalAmountToMove / numberOfLowerNeighbors;
					averageAmountToMove = Math.min( averageAmountToMove, erosionAmount );

					heightmap[ i ][ j ] -= averageAmountToMove;

					if ( i > 0 ) {

						heightmap[ i - 1 ][ j ] += averageAmountToMove / numberOfLowerNeighbors;

					}

					if ( j > 0 ) {

						heightmap[ i ][ j - 1 ] += averageAmountToMove / numberOfLowerNeighbors;

					}

					if ( i < rows - 1 ) {

						heightmap[ i + 1 ][ j ] += averageAmountToMove / numberOfLowerNeighbors;

					}

					if ( j < cols - 1 ) {

						heightmap[ i ][ j + 1 ] += averageAmountToMove / numberOfLowerNeighbors;

					}

				}

			}

		}

		return heightmap;

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

			/*if ( slope < 3.0 / heightmap.mapSize ) {

				r = 0.1;
				g = 0.5;
				b = 0.1;

			}*/

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
//	heightmap.erode();
drawHeightMap( terminal, heightmap );




function animate() {

 	requestAnimationFrame( animate );

	terminal.update();

}

animate();


