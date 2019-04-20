( function () {
    'use strict'
    WORLDJS.zoom( 5 )
    function createCampfire( x, y ) {
        let campfire = WORLDJS.add( { sprite: { image: '/r/1/assets/campfire' }, x: x, y: y, rotation: Math.random() } )
        WORLDJS.add( campfire, { sprite: { image: '/r/1/assets/flame' }, x: x, y: y, flame_affect: 1, opacity: .5, rotation: Math.random() * 2 * Math.PI } )
        WORLDJS.add( campfire, { sprite: { image: '/r/1/assets/flame' }, x: x + 2 * ( Math.random() - .5 ), y: y + 2 * ( Math.random() - .5 ), flame_affect: 1, opacity: .5, rotation: Math.random() * 2 * Math.PI } )
        //WORLDJS.add( campfire, { sprite: { image: '/r/1/assets/flame' }, x: x + 2 * ( Math.random() - .5 ), y: y + 2 * ( Math.random() - .5 ), flame_affect: 1, opacity: .5, rotation: Math.random() * 2 * Math.PI } )
    }
    createCampfire( 0, 0 )
    WORLDJS.start( () => {
    }, node => {
        if ( 0 < node.flame_affect ) {
            let n = WORLDJS.noise( ( node.x * 33333 + WORLDJS.time ) * 20, ( node.y * 33333 + WORLDJS.time ) * 20, 120000 )
            node.rotation_delta = n * 2 * node.flame_affect
            node.sprite_scale_delta = ( .5 + WORLDJS.noise( ( node.x + WORLDJS.time ) * 10, ( node.y + WORLDJS.time ) * 10, 10000 ) ) * 10 * node.flame_affect
            if ( Math.random() > .98 ) {
                WORLDJS.add( { sprite: { image: Math.random() > .5 ? '/r/1/assets/ember' : '/r/1/assets/ember1' }, x: node.x + 20 * ( Math.random() - .5 ), y: node.y + 20 * ( Math.random() - .5 ), ember_affect: 1, layer: node.layer + 1 } )
            }
            if ( Math.random() > .995 ) {
                WORLDJS.add( { sprite: { image: '/r/1/assets/smoke' }, x: node.x, y: node.y, smoke_affect: 1, layer: node.layer + 1, rotation: Math.random() * Math.PI, opacity: .5 - Math.random() * .25, created: WORLDJS.time } )
            }
        } else if ( 0 < node.ember_affect ) {
            if ( node.opacity < 0.2 ) {
                WORLDJS.remove( node )
            } else {
                let n = WORLDJS.noise( node.x * 3333 + WORLDJS.time, node.y * 3333 + WORLDJS.time, 60000 )
                node.translate_x_delta += n * .5
                node.translate_y_delta += ( ( n + 1 ) * .5 ) * -.3 * node.ember_affect - ( .7 - node.opacity )
                node.opacity -= Math.random() * node.ember_affect * .02
            }
        } else if ( 0 < node.smoke_affect ) {
            if ( node.opacity < 0.1 ) {
                WORLDJS.remove( node )
            } else {
                let n = WORLDJS.noise( node.x * 3333 + WORLDJS.time, node.y * 3333 + WORLDJS.time, 60000 ) * .2
                node.sprite_scale = .5 + ( WORLDJS.time - node.created ) * .0005
                node.opacity -= ( WORLDJS.time - node.created ) * .00000005
                node.translate_x_delta += n
                node.translate_y_delta += ( ( n + 1 ) * .5 ) * -.1 * node.smoke_affect
            }
        }
    } )
} )()