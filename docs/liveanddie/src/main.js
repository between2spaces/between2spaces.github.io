import './continuous'
import config from './config'
import vec3 from './vec3'
import rect3 from './rect3'
import display from './display'
import cells from './cells'
import ui from './ui'
import input from './input'
import math from './math'


// Entities
import blankcell from './entities/cell/blank'
import grass from './entities/flora/grass'
import person from './entities/animal/person'

// Effects
import movefindpath from './effects/movefindpath'


let global = val('global')
let my = val('liveanddie')


const BLANK_CELL = blankcell()
const GRASS = grass()


/**
 * Updates the display and view dimensions based on the current window.
 */
let updateDisplayViewDraw = () => {

    my.displayWidth = Math.max(1, window.innerWidth)
    my.displayHeight = Math.max(1, window.innerHeight)

    my.apertureWidth = ~~(config.aperture * (my.displayWidth / my.displayHeight))

    if (!global.pixels_per_cell) global.pixels_per_cell = vec3.zero()
    global.pixels_per_cell.x = my.displayWidth / my.apertureWidth
    global.pixels_per_cell.y = my.displayHeight / config.aperture

    global.view_centre = my.view ? rect3.centre(my.view) : vec3({x: config.cells * 0.5, y: config.cells * 0.5})
    vec3.round(global.view_centre)

    if (!my.view) my.view = rect3.zero()
    my.view.min.x = global.view_centre.x - ~~(0.5 * my.apertureWidth)
    my.view.max.x = my.view.min.x + my.apertureWidth - 1
    my.view.min.y = global.view_centre.y - ~~(0.5 * config.aperture)
    my.view.max.y = my.view.min.y + config.aperture - 1

    // Calculate the draw view based on overdraw numbers
    if (!my.draw) my.draw = rect3.zero()
    my.draw.min.x = Math.max(my.view.min.x - config.overdraw_west, 0)
    my.draw.max.x = Math.min(my.view.max.x + config.overdraw_east, config.cells)
    my.draw.min.y = Math.max(my.view.min.y - config.overdraw_north, 0)
    my.draw.max.y = Math.min(my.view.max.y + config.overdraw_south, config.cells)


    // Log view dimension changes
    if (my.updateDisplayViewDraw_timer) clearTimeout(my.updateDisplayViewDraw_timer)

    my.updateDisplayViewDraw_timer = setTimeout(() => {

        let viewable = my.apertureWidth * config.aperture
        let drawWidth = (my.apertureWidth + config.overdraw_west + config.overdraw_east)
        let drawHeight = (config.aperture + config.overdraw_north + config.overdraw_south)
        let drawable = drawWidth * drawHeight

        ui.terminal.print('view ' + my.apertureWidth + 'x' + config.aperture + ' (' + viewable + ')')
        ui.terminal.print('draw ' + drawWidth + 'x' + drawHeight + ' (' + drawable + ')')
        let ppcx = ~~(global.pixels_per_cell.x * 100) / 100
        let ppcy = ~~(global.pixels_per_cell.y * 100) / 100

        ui.terminal.print('px/cell ' + ppcx + 'x' + ppcy)

    }, 1000)

}



// Initialisation of state. Only run on first load (i.e. don't run on reloads from livecoding updates)
once('liveanddie', () => {

    updateDisplayViewDraw()
    my.cells = cells({size: {x: config.cells, y: config.cells}, regionSize: config.regions})
    my.timestamps = {}
    my.mouse = {x: -1, y: -1, cell: null}

    listen(window, 'resize', 100, () => {

        my.window_resized = true

    })

    my.hero = person({cell: cells.getCell(my.cells, global.view_centre.x, global.view_centre.y)})
    movefindpath({entity: my.hero, destination: cells.getCell(my.cells, global.view_centre.x + 5, global.view_centre.y + 5)})
    ui.terminal.say('help')

})



repeat('liveanddie_3_Hz', 333, () => {

    // Update the display and view dimensions if the window_resize flag is set
    if (my.window_resized || my.previous_aperture !== config.aperture) {

        my.window_resized = false
        updateDisplayViewDraw()

    }
    my.previous_aperture = config.aperture

    // Terminal focus / blur
    if (input.wasDown(input.ENTER, my.timestamps)) ui.terminal.focus()

    // Check for mouse move and new cell focus
    if (my.mouse.x != input.MOUSE_OFFSET.x || my.mouse.y != input.MOUSE_OFFSET.y) {

        my.mouse.x = input.MOUSE_OFFSET.x
        my.mouse.y = input.MOUSE_OFFSET.y

        let cll = cells.getCell(
                my.cells,
                my.view.min.x + ~~(my.mouse.x / global.pixels_per_cell.x),
                my.view.min.y + ~~(my.mouse.y / global.pixels_per_cell.y)
            )

        if (cll !== my.mouse.cell) {

            my.mouse.cell = cll
            ui.cell(cll)

        }

    }

    // Check for right mouse button for a move to cell command
    if (input.wasDown(input.MOUSE_RBUTTON, my.timestamps)) {

        movefindpath({entity: my.hero, destination: my.mouse.cell})

    }

})



repeat('liveanddie_15_Hz', 66, () => {

    // Check for horizontal keyboard pan
    if (my.view.min.x > 0 && input.wasDown(input['A'], my.timestamps)) {

        --my.view.min.x
        --my.view.max.x
        --my.draw.min.x
        --my.draw.max.x

    } else if (my.view.max.x < config.cells && input.wasDown(input['D'], my.timestamps)) {

        ++my.view.min.x
        ++my.view.max.x
        ++my.draw.min.x
        ++my.draw.max.x

    }

    // Check for veritcal keyboard pan
    if (my.view.min.y > 0 && input.wasDown(input['W'], my.timestamps)) {

        --my.view.min.y
        --my.view.max.y
        --my.draw.min.y
        --my.draw.max.y

    } else if (my.view.max.y < config.cells && input.wasDown(input['S'], my.timestamps)) {

        ++my.view.min.y
        ++my.view.max.y
        ++my.draw.min.y
        ++my.draw.max.y

    }

})



repeat('liveanddie_60_Hz', 15, () => {

    let left = (0.5 - config.overdraw_west) * global.pixels_per_cell.x
    let pos = {x: left, y: (0.5 - config.overdraw_north) * global.pixels_per_cell.y, z: 0}
    let tint


    // Draw a grid like underlay to show the cells
    /*for (let y = my.draw.min.y; y <= my.draw.max.y; ++y) {

        for (let x = my.draw.min.x; x <= my.draw.max.x; ++x) {

            let noise = math.noise(x * config.ground_frequency, y * config.ground_frequency)

            if (noise >= config.highland_altitude) {

                tint = 0xddddff

            } else if (noise <= config.water_altitude) {

                tint = 0x5555ff

            } else {

                tint = 0x005500

            }
            display.sprite(BLANK_CELL, pos, config.underlay_opacity, tint)
            pos.x += global.pixels_per_cell.x

        }
        pos.y += global.pixels_per_cell.y
        pos.x = left

    }*/

    // Reset pos opacity for entities in scene
    pos.y = (0.5 - config.overdraw_north) * global.pixels_per_cell.y

    // Draw clutter
    for (let y = my.draw.min.y; y <= my.draw.max.y; ++y) {

        for (let x = my.draw.min.x; x <= my.draw.max.x; ++x) {

            let cll = cells.getCell(my.cells, x, y)

            if (cll) {

                /*let noise = math.noise(x * config.ground_frequency, y * config.ground_frequency)

                if (noise >= config.grass_altitude_min && noise <= config.grass_altitude_max) {

                    if (((math.noise(x, y) + 1) * 0.5) < config.grass_density) {

                        let offset = 0.5 * math.noise(x, y)

                        GRASS.size.x = GRASS.size.y = (1 + noise * 2)
                        GRASS.offset.x = offset
                        GRASS.offset.y = offset
                        display.sprite(GRASS, pos, config.scene_opacity)

                    }

                }*/
				
                for (let ent in cll.entities) {

                    ent = cll.entities[ent]
                    display.sprite(ent, pos, config.scene_opacity)

                }

            }
            pos.x += global.pixels_per_cell.x

        }
        pos.y += global.pixels_per_cell.y
        pos.x = left

    }

    display.update()

})
