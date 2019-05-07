( function () {
    'use strict'
    WORLDJS.zoom( 2 )
    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        let nx = ( cell.x + 50000 ) / 100000
        let ny = ( cell.y + 50000 ) / 100000
        let n10000 = WORLDJS.noise( nx * 10000, ny * 10000 )
        WORLDJS.add( { sprite: { image: n10000 > 0 ? '/r/1/assets/water' : '/r/1/assets/water1' }, x: cell.x, y: cell.y, width: 1, height: 1, opacity: .8, rotation: n10000 * Math.PI, swell_affected: 1 } )
    } )
    let global_noise
    WORLDJS.start( () => {
        global_noise = WORLDJS.noise( WORLDJS.time * .0001, 0 )
    }, node => {
        if ( 0 < node.swell_affected ) {
            // let n = WORLDJS.time * swell * .0001
            // node.rotation_delta = WORLDJS.noise( node.x / 900 + n, node.y / 900 + n ) * node.swell_affected * 2
            // node.sprite_scale_delta = ( .5 + WORLDJS.noise( node.x / 1200 + n, node.y / 1200 + n ) ) * node.swell_affected * sprite.half_width * .4
            let scaled_time = WORLDJS.time * .0001
            let positional_noise = WORLDJS.noise( node.x + scaled_time, node.y + scaled_time )
            let noise_50_50 = positional_noise * .5 + global_noise * .5
            node.rotation_delta = ( positional_noise * .3 + global_noise * .7 ) * .5 * node.swell_affected
            node.sprite_scale_delta = ( 1 + noise_50_50 ) * 10 * node.swell_affected
        }
    } )
} )()