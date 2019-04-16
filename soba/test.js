( function () {
    'use strict'
    //WORLDJS.seed( 'FTg4NCfth3BGzZdR3sWrVDYP' )

    WORLDJS.zoom( 2 )

    const player = WORLDJS.add( { sprite: { image: 'frame' }, width: 5, height: 5, speed: 0.06, physical: true, rotationLock: true } )
    WORLDJS.add( player, { sprite: { image: 'male' } } ) //, sprite_scale: .3 } )

    let playerspawn = null
    let campfire = null

    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        let nx = ( cell.x + 50000 ) / 100000
        let ny = ( cell.y + 50000 ) / 100000
        let n50 = WORLDJS.noise( nx * 50, ny * 50 )
        let n100 = WORLDJS.noise( nx * 100, ny * 100 )
        let n5000 = WORLDJS.noise( nx * 5000, ny * 5000 )
        let n10000 = WORLDJS.noise( nx * 10000, ny * 10000 )
        let n30000 = WORLDJS.noise( nx * 30000, ny * 30000 )
        if ( n50 < -.1 ) {
            WORLDJS.add( { sprite: { image: n10000 > 0 ? 'water' : 'water1' }, x: cell.x, y: cell.y, width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, opacity: .8, rotation: n10000 * Math.PI, swell_affected: 1 } )
            return
        }
        let groundcover = Math.max( 0, Math.min( 1, ( ( ( Math.abs( n100 ) * 2 ) - 1 ) * .5 + n50 * .5 ) + .5 ) * 1.5 )
        let nodetype = 'water'
        if ( n50 > .01 ) {
            WORLDJS.add( { sprite: { image: 'groundgrass' }, x: cell.x + n10000 * 16, y: cell.y + n10000 * 16, width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, layer: -2, opacity: groundcover, rotation: n10000 * Math.PI } )
            nodetype = 'groundgrass'
        } else if ( n100 > 0 ) {
            WORLDJS.add( { sprite: { image: 'sand' }, x: cell.x + n10000 * 16, y: cell.y + n10000 * 16, width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, opacity: .8, layer: -1, rotation: n10000 } )
            nodetype = 'sand'
        }
        let offset = n5000 * 25
        if ( n50 > .01 ) {
            if ( groundcover > .1 ) {
                if ( n10000 > 0.7 ) {
                    WORLDJS.add( { sprite: { image: n10000 < .8 ? 'flower0' : n10000 < .9 ? 'flower1' : n10000 < .95 ? 'flower2' : 'flower3', y: -.9 }, x: cell.x + offset, y: cell.y + offset, rotation: n30000 * Math.PI, wind_affected: 1 } )
                    nodetype = 'flower'
                }
                if ( groundcover > .2 && n5000 > 0.7 ) {
                    let size = ( groundcover + ( n30000 + 1 ) * .5 ) * 64
                    WORLDJS.add( { sprite: { image: 'grass0', y: -.2 }, x: cell.x + offset, y: cell.y + offset, width: .6 * size, height: .1 * size, rotation: n30000 * .3, sprite_scale: size / 128, wind_affected: 1 } )
                    nodetype = 'grass'
                }
            }
        }
        if ( !playerspawn && n50 > .1 && groundcover > .8 ) {
            playerspawn = cell
        }
    } )

    WORLDJS.defineSprite( { name: 'object', fill: '#222222', width: 5, height: 5 } )
    WORLDJS.defineSprite( { name: 'debugreachable', fill: '#22ff22', width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE } )

    WORLDJS.addEventListener( player, 'nodecellschanged', () => {
        // let cells = WORLDJS.cellsOccupiedBy( player, player, false, 64, 64 )
        // for ( let i = 0, l = cells.length; i < l; i++ ) {
        //     let cell = cells[ i ]
        //     // cell.debug0 && WORLDJS.setSprite( cell.debug0, { name: 'debugreachable' } )
        // }
    } )

    const mousemove = WORLDJS.debounce( 250, () => {
        if ( WORLDJS.mouse.right )
            WORLDJS.move( player, WORLDJS.mouse.world.x - player.x, WORLDJS.mouse.world.y - player.y )
        else {
            // let nodes = WORLDJS.nodesXY( WORLDJS.mouse.world.x, WORLDJS.mouse.world.y )
            // for ( let i = 0, l = nodes.length; i < l; i++ )
            //     console.log( nodes[ i ].sprite.name )
        }
    } )

    WORLDJS.addEventListener( WORLDJS, 'mousemove', mousemove )

    const mousedown = WORLDJS.debounce( 90, () => {
        if ( WORLDJS.mouse.left )
            WORLDJS.move( player, WORLDJS.mouse.world.x - player.x, WORLDJS.mouse.world.y - player.y )
        else if ( WORLDJS.mouse.right )
            WORLDJS.add( { sprite: { name: 'object' }, x: WORLDJS.mouse.world.x, y: WORLDJS.mouse.world.y, physical: true } )
    } )

    WORLDJS.addEventListener( WORLDJS, 'mousedown', mousedown )

    let wind = .5
    let swell = .5
    WORLDJS.start( () => {
        if ( !playerspawn ) {
            let x = Math.round( WORLDJS.noise( WORLDJS.time * .0001, 0 ) * 100000 )
            let y = Math.round( WORLDJS.noise( 0, WORLDJS.time * .0001 ) * 100000 )
            WORLDJS.view( x, y )
        } else if ( !campfire ) {
            let nx = ( playerspawn.x + 50000 ) / 100000
            let ny = ( playerspawn.y + 50000 ) / 100000
            let n = WORLDJS.noise( nx * 30000, ny * 30000 )
            campfire = WORLDJS.add( { sprite: { image: 'campfire' }, x: playerspawn.x - 45, y: playerspawn.y + 32, layer: -1, width: 1.5 * WORLDJS.CELLSIZE, height: 1.5 * WORLDJS.CELLSIZE, physical: true, rotation: n } )
            WORLDJS.add( { sprite: { image: 'flame' }, x: campfire.x - 2 * n, y: campfire.y - 2 * n, flame_affect: 1, opacity: 1, rotation: .5 * Math.PI + n * Math.PI, layer: 1 } )
            WORLDJS.add( { sprite: { image: 'flame' }, x: campfire.x + 2 * n, y: campfire.y + 2 * n, flame_affect: .5, opacity: 1, rotation: n * Math.PI, layer: 2 } )
            WORLDJS.translate( player, playerspawn.x, playerspawn.y )
            WORLDJS.follow( player )
        }
    }, node => {
        if ( !campfire || !node.sprite ) return

        // keep the campfire area clear of grass, flowers, groundgrass
        let distance_from_camp = WORLDJS.distance( campfire, node )
        if ( distance_from_camp <= 128 ) {
            if ( node.name === 'groundgrass' || node.name.startsWith( 'sand' ) ) {
                node.opacity = Math.max( 0, ( distance_from_camp - 98 ) / 128 )
            } else if ( node.name === 'grass0' || node.name.startsWith( 'flower' ) )
                WORLDJS.remove( node )
            else if ( node === player ) {
                //console.log( 'under the healing affect of the fire' )
            }
        }


        let mid_cell = node.cells[ 0 ]

        if ( 0 < node.flame_affect ) {
            let n = WORLDJS.time * wind * .0015
            let n1000 = WORLDJS.noise( node.layer * mid_cell.noise_x * 1000 + n, node.layer * mid_cell.noise_y * 1000 + n )
            let n2000 = WORLDJS.noise( node.layer * mid_cell.noise_x * 2000 + n, node.layer * mid_cell.noise_y * 2000 + n )
            node.translate_x_delta = n1000 * node.flame_affect * 2
            node.translate_y_delta = n2000 * node.flame_affect * 2
            node.rotation_delta = n2000 * node.flame_affect * .05
            node.sprite_scale_delta = ( .5 + n1000 ) * node.flame_affect * .04
        } else if ( 0 < node.wind_affected ) {
            let n = WORLDJS.time * wind * .0008
            node.rotation_delta = WORLDJS.noise( node.x * .0009 + n, node.y * .0009 + n ) * node.wind_affected * .02
            node.sprite_scale_delta = ( .5 + WORLDJS.noise( node.x * .005 + n, node.y * .005 + n ) ) * node.wind_affected
        } else if ( 0 < node.swell_affected ) {
            let n = WORLDJS.time * swell * .0001
            node.translate_x_delta = n * node.swell_affected * 5
            node.translate_y_delta = n * node.swell_affected * 5
            node.rotation_delta = WORLDJS.noise( node.x / 900 + n, node.y / 900 + n ) * node.swell_affected * 1.5
            node.sprite_scale_delta = ( .5 + WORLDJS.noise( node.x / 1200 + n, node.y / 1200 + n ) ) * node.swell_affected * 20
        }

    } )
} )()