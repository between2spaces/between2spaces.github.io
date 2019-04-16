( function () {
    'use strict'
    WORLDJS.zoom( 3 )
    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        let nx = ( cell.x + 50000 ) / 100000
        let ny = ( cell.y + 50000 ) / 100000
        let n10000 = WORLDJS.noise( nx * 10000, ny * 10000 )
        WORLDJS.add( { sprite: { image: n10000 > 0 ? 'water' : 'water1' }, x: cell.x, y: cell.y, width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, opacity: .8, rotation: n10000 * Math.PI, swell_affected: 1 } )
    } )
    let swell = .5
    WORLDJS.start( () => {
    }, node => {
        let sprite = WORLDJS.sprites[ node.sprite.name ]
        if ( 0 < node.swell_affected ) {
            let n = WORLDJS.time * swell * .0001
            node.rotation_delta = WORLDJS.noise( node.x / 900 + n, node.y / 900 + n ) * node.swell_affected * 2
            node.sprite_scale_delta = ( .5 + WORLDJS.noise( node.x / 1200 + n, node.y / 1200 + n ) ) * node.swell_affected * sprite.half_width * .4
        }
    } )
} )()