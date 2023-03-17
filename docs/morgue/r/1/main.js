( function () {
    'use strict'
    //WORLDJS.seed( 'FTg4NCfth3BGzZdR3sWrVDYP' )

    const player = WORLDJS.add( { sprite: { image: '/r/1/assets/frame' }, width: .5 * WORLDJS.CELLSIZE, height: .5 * WORLDJS.CELLSIZE, speed: 0.06, physical: true, rotationLock: true, layer: 1 } )
    WORLDJS.add( player, { sprite: { image: '/r/1/assets/female' }, wind_affected: 1 } ) //, sprite_scale: .3 } )

    let playerspawn = null
    let campfire = null

    function createCampfire( x, y ) {
        campfire = WORLDJS.add( { sprite: { image: '/r/1/assets/campfire' }, x: x, y: y, width: .5 * WORLDJS.CELLSIZE, height: .5 * WORLDJS.CELLSIZE, physical: true } )
        WORLDJS.add( { sprite: { image: '/r/1/assets/flame' }, x: campfire.x, y: campfire.y, flame_affect: 1, opacity: .5, rotation: Math.random() * 2 * Math.PI } )
        WORLDJS.add( { sprite: { image: '/r/1/assets/flame' }, x: campfire.x + 3 * ( Math.random() - .5 ), y: campfire.y + 3 * ( Math.random() - .5 ), flame_affect: 1, opacity: .5, rotation: Math.random() * 2 * Math.PI, layer: campfire.layer + 1 } )
        WORLDJS.add( { sprite: { image: Math.random() > .5 ? '/r/1/assets/ember' : '/r/1/assets/ember1' }, x: x + 20 * ( Math.random() - .5 ), y: y + 20 * ( Math.random() - .5 ), ember_affect: 1, layer: 2 } )
    }

    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        let nx = ( cell.x + 50000 ) / 100000
        let ny = ( cell.y + 50000 ) / 100000
        let n50 = WORLDJS.noise( nx * 50, ny * 50 )
        let n100 = WORLDJS.noise( nx * 100, ny * 100 )
        let n500 = WORLDJS.noise( nx * 500, ny * 500 )
        let n5000 = WORLDJS.noise( nx * 5000, ny * 5000 )
        let n10000 = WORLDJS.noise( nx * 10000, ny * 10000 )
        let n30000 = WORLDJS.noise( nx * 30000, ny * 30000 )
        if ( n50 < -.1 ) {
            WORLDJS.add( { sprite: { image: n10000 > 0 ? '/r/1/assets/water' : '/r/1/assets/water1' }, x: cell.x, y: cell.y, width: 1, height: 1, opacity: .5, rotation: n10000 * Math.PI, layer: 1, swell_affected: 1 } )
            return
        }
        let groundcover = Math.max( 0, Math.min( 1, ( ( ( Math.abs( n100 ) * 1.5 ) - .5 ) * .8 + n500 * .2 ) + .5 ) * 1 )
        let nodetype = 'water'
        if ( n50 > .03 ) {
            WORLDJS.add( { sprite: { image: '/r/1/assets/groundgrass' }, x: cell.x + n10000 * 16, y: cell.y + n10000 * 16, width: 1, height: 1, layer: -2, opacity: groundcover * groundcover, rotation: n10000 * Math.PI } )
            nodetype = 'groundgrass'
        } else if ( n100 > 0 ) {
            WORLDJS.add( { sprite: { image: '/r/1/assets/sand' }, x: cell.x + n10000 * 16, y: cell.y + n10000 * 16, width: 1, height: 1, opacity: .8, layer: -1, rotation: n10000 } )
            nodetype = 'sand'
        }
        let offset = n5000 * 25
        if ( n50 > .3 ) {
            if ( groundcover > .1 ) {
                if ( n10000 > 0.8 ) {
                    WORLDJS.add( { sprite: { image: n10000 < .8 ? '/r/1/assets/flower0' : n10000 < .9 ? '/r/1/assets/flower1' : n10000 < .95 ? '/r/1/assets/flower2' : '/r/1/assets/flower3', y: -.9 }, x: cell.x + offset, y: cell.y + offset, rotation: n30000 * Math.PI, wind_affected: 1 } )
                    nodetype = 'flower'
                }
                if ( groundcover > .2 && n5000 > 0.8 ) {
                    let size = ( groundcover + ( n30000 + 1 ) * .5 ) * 64
                    WORLDJS.add( { sprite: { image: '/r/1/assets/grass0', y: -.2 }, x: cell.x + offset, y: cell.y + offset, width: .6 * size, height: .1 * size, rotation: n30000 * .3, sprite_scale: size / 128, layer: 1, wind_affected: 1, opacity: .6 } )
                    nodetype = 'grass'
                } else if ( n30000 > 0.9 ) {
                    let rat = WORLDJS.add( { sprite: { image: '/r/1/assets/frame' }, sprite_scale: .5, x: cell.x + offset, y: cell.y + offset, width: 1, height: 1, speed: 0.06, physical: true, rotationLock: true, layer: 1 } )
                    WORLDJS.add( rat, { sprite: { image: '/r/1/assets/rat' }, sprite_scale: .5, wind_affected: 1 } )
                }
            }
        }
        if ( !playerspawn && n50 > .5 && groundcover > .8 ) {
            playerspawn = cell
        }
    } )

    WORLDJS.defineSprite( { name: 'object', fill: '#222222', width: 5, height: 5 } )
    WORLDJS.defineSprite( { name: 'debugreachable', fill: '#22ff22', width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE } )

    // WORLDJS.addEventListener( player, 'nodecellschanged', () => {
    // } )

    const mousemove = WORLDJS.debounce( 250, () => {
        if ( WORLDJS.mouse.left || WORLDJS.mouse.right )
            WORLDJS.move( player, WORLDJS.mouse.world.x - player.x, WORLDJS.mouse.world.y - player.y )
        else {
            // let nodes = WORLDJS.nodesXY( WORLDJS.mouse.world.x, WORLDJS.mouse.world.y )
            // for ( let i = 0, l = nodes.length; i < l; i++ )
            //     console.log( nodes[ i ].sprite.name )
        }
    } )

    WORLDJS.addEventListener( WORLDJS, 'mousemove', mousemove )

    const mousedown = WORLDJS.debounce( 90, () => {
        //if ( WORLDJS.mouse.left )
        WORLDJS.move( player, WORLDJS.mouse.world.x - player.x, WORLDJS.mouse.world.y - player.y )
        // else if ( WORLDJS.mouse.right )
        //     WORLDJS.add( { sprite: { name: 'object' }, x: WORLDJS.mouse.world.x, y: WORLDJS.mouse.world.y, physical: true } )
    } )

    WORLDJS.addEventListener( WORLDJS, 'mousedown', mousedown )

    let global_noise

    WORLDJS.start( () => {
        global_noise = WORLDJS.noise( WORLDJS.time * .0001, 0 )
        if ( !playerspawn ) {
            let x = Math.round( WORLDJS.noise( WORLDJS.time * .0001, 0 ) * 100000 )
            let y = Math.round( WORLDJS.noise( 0, WORLDJS.time * .0001 ) * 100000 )
            WORLDJS.view( x, y )
        } else if ( !campfire ) {
            createCampfire( playerspawn.x - 2 * WORLDJS.CELLSIZE, playerspawn.y + 2 * WORLDJS.CELLSIZE )
            WORLDJS.translate( player, playerspawn.x, playerspawn.y )
            WORLDJS.follow( player )
        }

    }, node => {

        if ( !campfire || !node.sprite ) return

        // keep the campfire area clear of grass, flowers, groundgrass
        let distance_from_camp = WORLDJS.distance( campfire, node )
        if ( distance_from_camp <= 128 ) {
            if ( node.name === '/r/1/assets/groundgrass' || node.name.startsWith( '/r/1/assets/sand' ) ) {
                node.opacity = Math.max( 0, ( distance_from_camp - 98 ) / 128 )
            } else if ( node.name === '/r/1/assets/grass0' || node.name.startsWith( '/r/1/assets/flower' ) )
                WORLDJS.remove( node )
            else if ( node === player ) {
                //console.log( 'under the healing affect of the fire' )
            }
        }

        if ( 0 < node.flame_affect ) {
            let scaled_time = WORLDJS.time * .0001
            let positional_noise = WORLDJS.noise( node.x + scaled_time, node.y + scaled_time )
            let noise_50_50 = positional_noise * .5 + global_noise * .5
            node.rotation_delta = noise_50_50 * 2 * node.flame_affect
            node.sprite_scale_delta = ( .5 + noise_50_50 ) * 10 * node.flame_affect
            let rand = Math.random()
            if ( rand > .98 )
                WORLDJS.add( { sprite: { image: Math.random() > .5 ? '/r/1/assets/ember' : '/r/1/assets/ember1' }, x: node.x + 20 * ( Math.random() - .5 ), y: node.y + 20 * ( Math.random() - .5 ), ember_affect: 1, layer: node.layer + 1 } )
            if ( rand > .99 )
                WORLDJS.add( { sprite: { image: '/r/1/assets/smoke' }, x: node.x, y: node.y, smoke_affect: 1, layer: node.layer + 1, rotation: Math.random() * Math.PI, opacity: .25 - Math.random() * .2, created: WORLDJS.time } )
        } else if ( 0 < node.ember_affect ) {
            if ( node.opacity < 0.2 ) {
                WORLDJS.remove( node )
            } else {
                let scaled_time = WORLDJS.time * .0001
                let positional_noise = WORLDJS.noise( node.x + scaled_time, node.y + scaled_time )
                let noise_50_50 = positional_noise * .5 + global_noise * .5
                node.translate_x_delta += noise_50_50 * .5
                node.translate_y_delta += ( ( noise_50_50 + 1 ) * .5 ) * -.3 * node.ember_affect - ( .7 - node.opacity )
                node.opacity -= Math.random() * node.ember_affect * .02
            }
        } else if ( 0 < node.smoke_affect ) {
            let age = WORLDJS.time - node.created
            node.opacity -= age * .00000001
            if ( node.opacity <= 0 || age > 20000 ) {
                WORLDJS.remove( node )
            } else {
                node.sprite_scale = .5 + age * .001
                node.x += WORLDJS.noise( WORLDJS.time * .0001, 0 ) * .2 * ( 2 - node.opacity )
                node.y -= WORLDJS.noise( 0, WORLDJS.time * .0001 ) * .2 * ( 2 - node.opacity )
            }
        } else if ( 0 < node.wind_affected ) {
            let scaled_time = WORLDJS.time * .0001
            let positional_noise = WORLDJS.noise( node.x + scaled_time, node.y + scaled_time )
            let noise_50_50 = positional_noise * .5 + global_noise * .5
            node.rotation_delta = noise_50_50 * .1 * node.wind_affected
            node.sprite_scale_delta = ( 1 + noise_50_50 ) * node.wind_affected * 2
        } else if ( 0 < node.swell_affected ) {
            let scaled_time = WORLDJS.time * .0001
            let positional_noise = WORLDJS.noise( node.x + scaled_time, node.y + scaled_time )
            let noise_50_50 = positional_noise * .5 + global_noise * .5
            node.rotation_delta = ( positional_noise * .3 + global_noise * .7 ) * .5 * node.swell_affected
            node.sprite_scale_delta = ( 1 + noise_50_50 ) * 10 * node.swell_affected
        }

    } )
} )()