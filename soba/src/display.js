import app from './app'

/*global PIXI*/

PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST

let Display = (/**{Display}*/display) => {

	  let param = display

    display = {
			renderer: new PIXI.WebGLRenderer(256, 256, {transparent: true}),
			canvas: document.createElement('canvas'),
			context: null,
			container: null,
			pixel: null
		}

    display.renderer.view.style.position = 'absolute'
		display.renderer.view.style.left = '0'
		display.renderer.view.style.top = '0'
    display.renderer.view.style.width = '100%'
		display.renderer.view.style.height = '100%'
		display.renderer.view.style.imageRendering = 'pixelated'
		display.renderer.gl.imageSmoothingEnabled = false

		document.body.appendChild(display.renderer.view)

		display.canvas.width = display.renderer.width
		display.canvas.height = display.renderer.height
		display.canvas.style.width = '100%'
		display.canvas.style.height = '100%'
		display.canvas.style.imageRendering = 'pixelated'

		display.context = display.canvas.getContext('2d', {antialias: false, depth: false})
		display.context.imageSmoothingEnabled = false

		display.container = new PIXI.Sprite(PIXI.Texture.fromCanvas(display.canvas))
		display.container.anchor.x = 0.5
		display.container.anchor.y = 0.5
		display.container.position.x = ~~(0.5 * display.renderer.width)
		display.container.position.y = ~~(0.5 * display.renderer.height)

    display.pixel = Display.createPixel(display)

    app.task(0, () => {
	    display.renderer.render(display.container)
    })

		return display

}

app.task('display-initialise', 'display', (
	/**{object}*/global,
	/**{object}*/memory,
	/**{object}*/storage
) => {
	if (!memory.initialised) {
		memory.initialised = true
		document.body.style.overflow = 'hidden'
		document.body.style.margin = document.body.style.padding = '0'
	}
})

Display.setResolution = (display, width, height) => {
	display.renderer.resize(~~(0.5 * width) * 2, ~~(0.5 * height) * 2)
	display.container.position.x = ~~(0.5 * width)
	display.container.position.y = ~~(0.5 * height)
	display.canvas.width = display.renderer.width
	display.canvas.height = display.renderer.height
}

Display.update = (display) => {
	display.container.texture.baseTexture.update()
}

Display.createPixel = (display, red/*=0*/, green/*=0*/, blue/*=0*/, alpha/*=255*/) => {
	let pixel = display.context.createImageData(1, 1)
	pixel.data[0] = red || 0
	pixel.data[1] = green || 0
	pixel.data[2] = blue || 0
	pixel.data[3] = alpha || 255
	return pixel
}

Display.setColour = (display, red/*=0*/, green/*=0*/, blue/*=0*/, alpha/*=255*/) => {
	display.pixel.data[0] = red || 0
	display.pixel.data[1] = green || 0
	display.pixel.data[2] = blue || 0
	display.pixel.data[3] = alpha || 255
}

Display.setPixel = (display, x, y) => {
	display.context.putImageData(display.pixel, x, y)
}

export default Display
