( function () {
    'use strict'
    //From Ashes To Ashes
    //WORLDJS.seed( 'FTg4NCfth3BGzZdR3sWrVDYP' )
    WORLDJS.zoom( 1.5 )
    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        let nx = ( cell.x + 50000 ) / 100000
        let ny = ( cell.y + 50000 ) / 100000
        let n50 = WORLDJS.noise( nx * 50, ny * 50 )
        let n100 = WORLDJS.noise( nx * 100, ny * 100 )
        let n1000 = WORLDJS.noise( nx * 1000, ny * 1000 )
        let n5000 = WORLDJS.noise( nx * 5000, ny * 5000 )
        let n10000 = WORLDJS.noise( nx * 10000, ny * 10000 )
        if ( n50 < -.1 ) {
            WORLDJS.add( { sprite: { image: n10000 > 0 ? 'water' : 'water1' }, x: cell.x, y: cell.y, width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, opacity: .5, swell_affected: 1, rotation: n10000 } )
            return
        }
        let groundcover = Math.max( 0, Math.min( 1, ( ( ( Math.abs( n100 ) * 2 ) - 1 ) * .5 + n50 * .5 ) + .5 ) * 1.5 )
        if ( n50 < .01 )
            n100 > 0 && WORLDJS.add( { sprite: { image: 'sand' }, x: cell.x + n10000 * 16, y: cell.y + n10000 * 16, width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, opacity: .8, layer: -1, rotation: n10000 } )
        else
            WORLDJS.add( { sprite: { image: 'groundgrass' }, x: cell.x + n10000 * 16, y: cell.y + n10000 * 16, width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE, layer: -2, opacity: groundcover, rotation: n10000 } )
        let offset = n5000 * 25
        if ( n50 > 0 ) {
            if ( groundcover > .1 ) {
                n10000 > 0.7 && WORLDJS.add( { sprite: { image: n10000 < .8 ? 'flower0' : n10000 < .9 ? 'flower1' : n10000 < .95 ? 'flower2' : 'flower3', y: -.9 }, x: cell.x + offset, y: cell.y + offset, rotation: n5000 * .5, wind_affected: .2 } )
                if ( groundcover > .2 && n5000 > 0.7 ) {
                    let size = ( groundcover + n1000 + .5 ) * 64
                    WORLDJS.add( { sprite: { image: 'grass0', y: -.2 }, x: cell.x + offset, y: cell.y + offset, width: .6 * size, height: .1 * size, rotation: n10000 * .5, sprite_scale: size / 128, wind_affected: .1 } )
                }
            }
        }
    } )

    WORLDJS.defineSprite( { name: 'object', fill: '#222222', width: 32, height: 32 } )
    WORLDJS.defineSprite( { name: 'debugreachable', fill: '#22ff22', width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE } )

    const player = WORLDJS.add( { sprite: { image: 'human' }, width: 32, height: 32, sprite_scale: 1, speed: 0.06, physical: true, rotationLock: true } )
    WORLDJS.follow( player )
    WORLDJS.addEventListener( player, 'nodecellschanged', () => {
        let cells = WORLDJS.cellsOccupiedBy( player, player, false, 64, 64 )
        for ( let i = 0, l = cells.length; i < l; i++ ) {
            let cell = cells[ i ]
            //cell.debug0 && WORLDJS.setSprite( cell.debug0, { name: 'debugreachable' } )
        }
    } )
    WORLDJS.addEventListener( player, 'ready', () => {
        console.log( player.cells.length )
    } )

    const mousemove = WORLDJS.debounce( 250, () => {
        if ( WORLDJS.mouse.right )
            WORLDJS.move( player, WORLDJS.mouse.world.x - player.x, WORLDJS.mouse.world.y - player.y )
        else {
            let children = WORLDJS.cellXY( WORLDJS.mouse.world.x, WORLDJS.mouse.world.y ).children
            for ( let i = 0, l = children.length; i < l; i++ ) {
                let node = children[ i ]
                node.sprite && console.log( node.sprite.name )
            }
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

    let wind = 0.00001
    let swell = 0.0001
    WORLDJS.start( () => {
    }, node => {
        if ( !node.sprite ) return
        let sprite = WORLDJS.sprites[ node.sprite.name ]
        if ( 0 < node.wind_affected ) {
            let n = WORLDJS.time * wind
            node.rotation_delta = WORLDJS.noise( node.x / 900 + n, node.y / 900 + n ) * node.wind_affected
            node.sprite_scale_delta = ( .5 + WORLDJS.noise( node.x / 500 + n, node.y / 500 + n ) ) * node.wind_affected * sprite.half_width * .3
        }
        if ( 0 < node.swell_affected ) {
            let n = WORLDJS.time * swell
            node.rotation_delta = WORLDJS.noise( node.x / 900 + n, node.y / 900 + n ) * node.swell_affected
            node.sprite_scale_delta = ( .5 + WORLDJS.noise( node.x / 500 + n, node.y / 500 + n ) ) * node.swell_affected * sprite.half_width * .5
        }
    } )
} )()