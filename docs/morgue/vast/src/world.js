import { Cell, generation } from "./cell"

const world = {

	size: 50,
	cells: [],

	init: () => {

		world.cells = new Array( world.size * world.size )

		const CELL_SIZE = ( ( 1.0 / world.size ) * 100 ) + "%"

		for ( let y = 0; y < world.size; y++ ) {
			for ( let x = 0; x < world.size; x++ ) {
				let cell = Cell( x, y )
				world.cells[ y * world.size + x ] = cell
				cell.div.style.width = CELL_SIZE
				cell.div.style.height = CELL_SIZE
				cell.div.style.cssFloat = "left"
			}
		}

	},

	update: () => {

		let i = world.size * world.size
		let cells = world.cells
		let nextGeneration = []
		
		generationInfo.iteration += 1

		while ( i-- ) {
			nextGeneration[ i ] = generation( cells[ i ], generationInfo )
		}

		world.cells = nextGeneration

	},

	destroy: () => {

	}

}

const generationInfo = {
	iteration: 0,
	elapsed: 0
}

export { world }
