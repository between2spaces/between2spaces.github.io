import { createNoise2D } from "./simplexnoise.js";
import { seedrandom } from "./seedrandom.js";
import { Terminal } from "./terminal.js";


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

	constructor( mapSize, edgeWidth = null ) {

		this.mapSize = mapSize;
		this.edgeWidth = edgeWidth === null ? this.mapSize * 0.3 : edgeWidth;
		this.heightArray = new Array( this.mapSize * this.mapSize );

	}

	generateHeights( seed = Math.random() * 999999999 ) {

		const noise = createNoise2D( seedrandom( seed ) );
		const octaves = [
			{ frequency: 2.0 / this.mapSize, amplitude: 1 },
			{ frequency: 4.0 / this.mapSize, amplitude: 0.5 },
			{ frequency: 8.0 / this.mapSize, amplitude: 0.25 },
			{ frequency: 16.0 / this.mapSize, amplitude: 0.125 },
		];

		let minHeight = 1;
		let maxHeight = - 1;

		for ( let y = 0; y < this.mapSize; y ++ ) {

			for ( let x = 0; x < this.mapSize; x ++ ) {

				let index = y * this.mapSize + x;
				let height = 0;

				for ( let octave of octaves ) height += noise( x * octave.frequency, y * octave.frequency ) * octave.amplitude;

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

				if ( y < this.mapSize - 1 ) {

					let southHeight = this.heightArray[ ( y + 1 ) * this.mapSize + x ];

					if ( southHeight < currentHeight ) {

						totalAmountToMove += currentHeight - southHeight;
						numberOfLowerNeighbors ++;

					}

				}

				if ( x < this.mapSize - 1 ) {

					let eastHeight = this.heightArray[ index + 1 ];

					if ( eastHeight < currentHeight ) {

						totalAmountToMove += currentHeight - eastHeight;
						numberOfLowerNeighbors ++;

					}

				}

				if ( numberOfLowerNeighbors > 0 ) {

					let averageAmountToMove = totalAmountToMove / numberOfLowerNeighbors;
					averageAmountToMove = Math.min( averageAmountToMove, erosionAmount );

					this.heightArray[ index ] -= averageAmountToMove;


					if ( x > 0 ) {

						this.heightArray[ index - 1 ] += averageAmountToMove / numberOfLowerNeighbors;

					}

					if ( y > 0 ) {

						this.heightArray[ ( y - 1 ) * this.mapSize + x ] += averageAmountToMove / numberOfLowerNeighbors;

					}

					if ( y < this.mapSize - 1 ) {

						this.heightArray[ ( y + 1 ) * this.mapSize + x ] += averageAmountToMove / numberOfLowerNeighbors;

					}

					if ( x < this.mapSize - 1 ) {

						this.heightArray[ index + 1 ] += averageAmountToMove / numberOfLowerNeighbors;

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


const TILE = {
	ROCK: 0,
	DIRT: 1,
	GRASS: 2,
	WATER: 3,
};


class TileMap {

	constructor( heightmap, seed = Math.random() * 999999999, waterHeight = 0.2 ) {

		this.heightmap = heightmap;
		this.waterHeight = waterHeight;
		this.singleDirtHeight = 0.01;
		this.maxDirtSlope = 0.1;
		this.mapSize = heightmap.mapSize;
		this.typeMap = new Array( heightmap.heightArray.length );
		this.dirtMap = new Array( heightmap.heightArray.length );

		for ( let i = 0; i < heightmap.heightArray.length; i ++ ) {

			this.typeMap[ i ] = TILE.ROCK;
			this.dirtMap[ i ] = 0;

		}

		this.prng = seedrandom( seed );
		this.listenersTileUpdate = [];

	}

	addTileUpdateListener( callback ) {

		if ( callback in this.listenersTileUpdate ) return;

		this.listenersTileUpdate.push( callback );

		for ( let y = 0; y < this.mapSize; y ++ ) {

			for ( let x = 0; x < this.mapSize; x ++ ) {

				callback( x, y, this.getTileHeight( x, y ), this.getType( x, y ) );

			}

		}


	}

	generate( dirtDrops = 5, singleDirtHeight = 0.01, maxDirtSlope = 0.001, maxDirt = 30 ) {

		this.singleDirtHeight = singleDirtHeight;
		this.maxDirtSlope = maxDirtSlope;

		for ( let d = 0; d < dirtDrops; d ++ ) {

			for ( let y = 0; y < this.mapSize; y ++ ) {

				for ( let x = 0; x < this.mapSize; x ++ ) {

					let index = y * this.mapSize + x;
					let dirt = this.getDirt( x, y );
					if ( dirt >= maxDirt ) continue;
					this.dropDirt( x, y );

				}

			}

		}

		for ( let y = 0; y < this.mapSize; y ++ ) {

			for ( let x = 0; x < this.mapSize; x ++ ) {

				for ( let callback of this.listenersTileUpdate ) callback( x, y, this.getTileHeight( x, y ), this.getType( x, y ) );

			}

		}


	}

	getType( x, y ) {

		const tile = this.typeMap[ y * this.mapSize + x ];
		return tile ? tile : TILE.ROCK;

	}

	setType( x, y, type ) {

		this.typeMap[ y * this.mapSize + x ] = type;

	}

	getDirt( x, y ) {

		return this.dirtMap[ y * this.mapSize + x ];

	}

	setDirt( x, y, amount ) {

		this.setType( x, y, this.getTileHeight( x, y ) >= this.waterHeight ? TILE.GRASS : TILE.DIRT );
		this.dirtMap[ y * this.mapSize + x ] = amount;

	}

	addDirt( x, y, amount ) {

		this.setDirt( x, y, this.getDirt( x, y ) + amount );

	}

	getDirtHeight( x, y ) {

		return this.getDirt( x, y ) * this.singleDirtHeight;

	}

	getTileHeight( x, y ) {

		return this.heightmap.getHeight( x, y ) + this.getDirtHeight( x, y );

	}

	dropDirt( x, y ) {

		let tooSteep = [];
		let currentHeight = this.getTileHeight( x, y );

		for ( let j = y + 1; j >= y - 1; j -- ) {

			for ( let i = x + 1; i >= x - 1; i -- ) {

				if ( i < 0 || j < 0 || i >= this.mapSize || j >= this.mapSize ) continue;

				let thisHeight = this.getTileHeight( i, j );
				if ( thisHeight <= currentHeight - this.maxDirtSlope ) tooSteep.push( { x: i, y: j } );

			}

		}

		if ( tooSteep.length > 0 ) {

			let rand = tooSteep[ Math.floor( this.prng() * tooSteep.length ) ];
			x = rand.x;
			y = rand.y;

		}

		this.addDirt( x, y, 1 );

	}

}


window.addEventListener( "wheel", event => {

	terminal.zoom( event.deltaY > 0 ? 1.01 : 0.99 );

} );

const heightmap = new HeightMap( cols );

heightmap.generateHeights();

const tilemap = new TileMap( heightmap );

tilemap.addTileUpdateListener( ( x, y, height, type ) => {

	let r = height;
	let g = height;
	let b = height;

	if ( type === TILE.WATER ) {

		r = 35 / 255;
		g = 137 / 255;
		b = 218 / 255;

	} else if ( type === TILE.DIRT ) {

		r = 107 / 255;
		g = 84 / 255;
		b = 40 / 255;

	} else if ( type === TILE.GRASS ) {

		r = 80 / 255;
		g = 125 / 255;
		b = 42 / 255;

	}

	terminal.setChar( x, y, 0, "█", [ r * height * 2, g * height * 2, b * height * 2, 1.0 ] );

	terminal.setHeight( x, y, 0, height );

} );

tilemap.generate();




function animate() {

 	requestAnimationFrame( animate );

	terminal.update();

}

animate();


