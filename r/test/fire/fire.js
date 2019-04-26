( function () {
    'use strict'
    WORLDJS.zoom( 5 )

    function createCampfire( x, y ) {
        let campfire = WORLDJS.add( { sprite: { image: '/r/1/assets/campfire' }, x: x, y: y, rotation: Math.random(), width: 1.5 * WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, physical: true } )
        WORLDJS.add( { sprite: { image: '/r/1/assets/flame' }, x: campfire.x, y: campfire.y, flame_affect: 1, opacity: .5, rotation: Math.random() * 2 * Math.PI } )
        WORLDJS.add( { sprite: { image: '/r/1/assets/flame' }, x: campfire.x + 3 * ( Math.random() - .5 ), y: campfire.y + 3 * ( Math.random() - .5 ), flame_affect: 1, opacity: .5, rotation: Math.random() * 2 * Math.PI, layer: campfire.layer + 1 } )
        WORLDJS.add( { sprite: { image: Math.random() > .5 ? '/r/1/assets/ember' : '/r/1/assets/ember1' }, x: x + 20 * ( Math.random() - .5 ), y: y + 20 * ( Math.random() - .5 ), ember_affect: 1, layer: 2 } )
        WORLDJS.add( { sprite: { image: '/r/1/assets/smoke' }, x: x, y: y, smoke_affect: 1, layer: 2, rotation: Math.random() * Math.PI, opacity: .5, created: WORLDJS.time } )
    }
    createCampfire( 0, 0 )
    let global_noise
    WORLDJS.start( () => {
        global_noise = WORLDJS.noise( WORLDJS.time * .0001, 0 )
    }, node => {

        let scaled_time = WORLDJS.time * .0001
        let positional_noise = WORLDJS.noise( node.x + scaled_time, node.y + scaled_time )
        let noise_50_50 = positional_noise * .5 + global_noise * .5
        if ( 0 < node.flame_affect ) {
            node.rotation_delta = noise_50_50 * 2 * node.flame_affect
            node.sprite_scale_delta = ( .5 + noise_50_50 ) * 10 * node.flame_affect
            let rand = Math.random()
            if ( rand > .98 )
                WORLDJS.add( { sprite: { image: Math.random() > .5 ? '/r/1/assets/ember' : '/r/1/assets/ember1' }, x: node.x + 20 * ( Math.random() - .5 ), y: node.y + 20 * ( Math.random() - .5 ), ember_affect: 1, layer: node.layer + 1 } )
            if ( rand > .998 )
                WORLDJS.add( { sprite: { image: '/r/1/assets/smoke' }, x: node.x, y: node.y, smoke_affect: 1, layer: node.layer + 1, rotation: Math.random() * Math.PI, opacity: .5 - Math.random() * .25, created: WORLDJS.time } )
        } else if ( 0 < node.ember_affect ) {
            if ( node.opacity < 0.2 ) {
                WORLDJS.remove( node )
            } else {
                node.translate_x_delta += noise_50_50 * .5
                node.translate_y_delta += ( ( noise_50_50 + 1 ) * .5 ) * -.3 * node.ember_affect - ( .7 - node.opacity )
                node.opacity -= Math.random() * node.ember_affect * .02
            }
        } else if ( 0 < node.smoke_affect ) {
            if ( node.opacity < 0.1 ) {
                WORLDJS.remove( node )
            } else {
                node.sprite_scale = .5 + ( WORLDJS.time - node.created ) * .0001
                node.opacity -= ( WORLDJS.time - node.created ) * .00000001
                let n = positional_noise * .7 + global_noise * .3
                node.x += n * .5
                node.y += ( ( n * .5 + 1 ) * .5 ) * -.1 * node.smoke_affect
            }
        }
    } )
} )()