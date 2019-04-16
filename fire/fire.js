( function () {
    'use strict'
    WORLDJS.zoom( 3 )
    let n = WORLDJS.noise( 0, 0 )
    let campfire = WORLDJS.add( { sprite: { image: 'campfire' }, x: 0, y: 0, rotation: n } )
    WORLDJS.add( { sprite: { image: 'flame' }, x: campfire.x - 2 * n, y: campfire.y - 2 * n, flame_affect: 1, opacity: .5, rotation: .5 * Math.PI + n * Math.PI, layer: 1 } )
    WORLDJS.add( { sprite: { image: 'flame' }, x: campfire.x + 2 * n, y: campfire.y + 2 * n, flame_affect: .5, opacity: .5, rotation: n * Math.PI, layer: 2 } )
    let wind = .5
    WORLDJS.start( () => {
    }, node => {
        let mid_cell = node.cells[ 0 ]
        if ( 0 < node.flame_affect ) {
            let n = WORLDJS.time * wind * .008
            let n1000 = WORLDJS.noise( node.layer * mid_cell.noise_x * 1000 + n, node.layer * mid_cell.noise_y * 1000 + n )
            let n2000 = WORLDJS.noise( node.layer * mid_cell.noise_x * 2000 + n, node.layer * mid_cell.noise_y * 2000 + n )
            node.translate_x_delta = n1000 * node.flame_affect * 2
            node.translate_y_delta = n2000 * node.flame_affect * 2
            node.rotation_delta = n2000 * node.flame_affect * .05
            node.sprite_scale_delta = ( .5 + n1000 ) * node.flame_affect * .04
        }
    } )
} )()