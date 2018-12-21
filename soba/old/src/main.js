import app from './app'
import input from './input'
import Display from './display'
import Cells from './cells'
import Vec3 from './vec3'
import Rect3 from './rect3'

/*global PIXI*/

const VIEW = 50
const CELL = 1000

app.task('main-initialise', 'main', (
	/**{object}*/global,
	/**{object}*/memory,
	/**{object}*/storage
) => {
memory.display = memory.display || Display()
	memory.overlay = memory.overlay || Display()
	Display.setResolution(memory.display, VIEW, VIEW)
	Display.setResolution(memory.overlay, VIEW, VIEW)
	Display.setColour(memory.overlay, 255, 0, 0)
	Display.setPixel(memory.overlay, 0, 0)
	memory.cells = memory.cells || Cells(Vec3({x:CELL, y:CELL}))
	memory.view = memory.view || Rect3({min:Vec3({x:0, y:0}), max:Vec3({x:VIEW, y:VIEW})})
})


app.task('main-update-display', 'main', 0, (
	/**{object}*/global,
	/**{object}*/memory,
	/**{object}*/storage
) => {
	let px = 0
	let py = 0
	for (let y = memory.view.min.y; y < memory.view.max.y; ++y) {
		for (let x = memory.view.min.x; x < memory.view.max.x; ++x) {
			let shade = Cells.cell(memory.cells, x, y)
			if (shade === undefined) shade = 255
			Display.setColour(memory.display, shade, shade, shade)
			Display.setPixel(memory.display, px, py)
			++px
			if (px === VIEW) {
				++py
				px = 0
			}
		}
	}
	Display.update(memory.display)
	Display.update(memory.overlay)
})

app.task('main-input', 'main', 60, (
	/**{object}*/global,
	/**{object}*/memory,
	/**{object}*/storage
) => {
	if (input.wasDown(input.K, memory.timestampK)) {
		--memory.view.min.y
		--memory.view.max.y
		memory.timestampK = global.timestamp
	} else if (input.wasDown(input.J, memory.timestampJ)) {
		++memory.view.min.y
		++memory.view.max.y
		memory.timestampJ = global.timestamp
	} else if (input.wasDown(input.L, memory.timestampL)) {
		++memory.view.min.x
		++memory.view.max.x
		memory.timestampL = global.timestamp
	} else if (input.wasDown(input.H, memory.timestampH)) {
		--memory.view.min.x
		--memory.view.max.x
		memory.timestampH = global.timestamp
	}
})
