( function () {
    'use strict'
    WORLDJS.seed( '8HV6vOdd1n7DwJmr' )
    const noise = ( x, y, frequency ) => { return WORLDJS.noise( ( ( x + 50000 ) / 100000 ) * frequency, ( ( y + 50000 ) / 100000 ) * frequency ) }
    const gridalign = ( cell, size ) => { return cell.x % size === 0 && cell.y % size === 0 }
    let global_noise = noise( 0, 0, 1 )
    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        let n50 = noise( cell.x, cell.y, 50 )
        let n20000 = noise( cell.x, cell.y, 20000 )
        let n30000 = noise( cell.x, cell.y, 30000 )
        let n60000 = noise( cell.x, cell.y, 60000 )
        if ( gridalign( cell, 256 ) ) WORLDJS.add( { sprite: { image: '../3/assets/dirt' }, x: cell.x, y: cell.y, layer: -3 } )
        let rotation = ( n30000 + 1 ) * Math.PI
        if ( gridalign( cell, 32 ) ) {
            if ( n50 < -.45 ) return WORLDJS.add( { sprite: { image: n30000 > 0 ? '../1/assets/water' : '../1/assets/water1' }, x: cell.x, y: cell.y, opacity: .6, rotation: rotation, layer: 1, inViewUpdates: [ inViewUpdates.swell ] } )
            if ( n50 < -.35 ) return WORLDJS.add( { sprite: { image: '../2/assets/sand' }, x: cell.x, y: cell.y, rotation: rotation, layer: -2 } )
            if ( n20000 > 0.85 ) {
                if ( n60000 < 0 ) WORLDJS.add( { sprite: { image: '../3/assets/largerock1' }, x: cell.x, y: cell.y, sprite_scale_x: 1 + ( n30000 + 1 ) * 1, sprite_scale_y: 1 + ( n30000 + 1 ) * 1, rotation: rotation, physical: true, width: 100, height: 100, layer: -1 } )
                WORLDJS.add( { sprite: { image: '../3/assets/largerock2' }, x: cell.x, y: cell.y, sprite_scale_x: 1 + ( n30000 + 1 ) * 1, sprite_scale_y: 1 + ( n30000 + 1 ) * 1, rotation: rotation, physical: true, width: 70, height: 65, layer: -1 } )
                return
            }
        }
        if ( n20000 < -.8 ) {
            if ( n20000 > -.84 ) return WORLDJS.add( { sprite: { image: '../3/assets/plant' }, x: cell.x, y: cell.y, sprite_scale_x: .3 + ( n30000 + 1 ) * 1, sprite_scale_y: .3 + ( n30000 + 1 ) * 1, opacity: 1, rotation: rotation, layer: 1, inViewUpdates: [ inViewUpdates.wind ] } )
            //if ( n20000 > .7 ) return WORLDJS.add( { sprite: { image: '../3/assets/brush' }, x: cell.x, y: cell.y, sprite_scale_x: .2 + ( n30000 + 1 ) * .6, sprite_scale_y: .2 + ( n30000 + 1 ) * .6, opacity: .8, rotation: rotation, layer: 1, inViewUpdates: [ inViewUpdates.wind ] } )
            return WORLDJS.add( { sprite: { image: n30000 < -.35 ? '../3/assets/stone' : n30000 < .35 ? '../3/assets/stone1' : '../3/assets/stone2' }, x: cell.x, y: cell.y, rotation: rotation, layer: -1 } )
        }
    } )
    const inViewUpdates = {
        swell: node => {
            let positional_noise = noise( node.x + WORLDJS.time, node.y + WORLDJS.time, 1 )
            node.rotation_delta = ( positional_noise * .7 + global_noise * .3 ) * 2
            node.sprite_scale_x_delta = node.sprite_scale_y_delta = ( 1 + positional_noise * .5 + global_noise * .5 ) * 20
        },
        wind: node => {
            let positional_noise = noise( node.x + WORLDJS.time, node.y + WORLDJS.time, 2 )
            let n = positional_noise * .5 + global_noise * .5
            node.rotation_delta = n * .2
            node.sprite_scale_x_delta = node.sprite_scale_y_delta = ( 1 + n ) * 3
        },
        flame: node => {
            let x = ( node.id + node.x ) * 9999 + node.translate_x_delta + WORLDJS.time
            let y = ( node.id + node.y ) * 9999 + node.translate_y_delta + WORLDJS.time
            let x_noise = noise( x, 0, 100 )
            let y_noise = noise( 0, y, 100 )
            let xy_noise = noise( x, y, 100 )
            node.translate_x_delta = x_noise * 2
            node.translate_y_delta = y_noise * 2
            node.rotation_delta = xy_noise * .25 + global_noise * .25
            if ( xy_noise > .8 ) createEmber( node, 10 * ( noise( x, y, 1000 ) * .5 + global_noise * .5 ), 10 * y_noise )
            if ( xy_noise > .9 ) createSmoke( node )
        },
        ember: node => {
            if ( node.opacity < 0.2 ) return WORLDJS.remove( node )
            let n = noise( node.x * 9999 + WORLDJS.time, node.y * 9999 + WORLDJS.time, 1 ) * .5 + global_noise * .5
            node.translate_x_delta += n * .5
            node.translate_y_delta += ( ( n + 1 ) * .5 ) * -.3 - ( .7 - node.opacity )
            node.opacity -= Math.random() * .02
        },
        smoke: node => {
            let age = WORLDJS.time - node.createdTime
            node.opacity -= age * .00000001
            if ( node.opacity <= 0 || age > 20000 ) return WORLDJS.remove( node )
            node.sprite_scale_x = node.sprite_scale_y = .5 + age * .001
            WORLDJS.translate( node, node.x + noise( WORLDJS.time, 0, 1 ) * .2 * ( 2 - node.opacity ), node.y + noise( 0, WORLDJS.time, 1 ) * .2 * ( 2 - node.opacity ) )
        }
    }
    function createSmoke( origin_node, dx, dy ) {
        let pos = WORLDJS.absolutePosition( origin_node )
        pos.x += ( dx || 0 )
        pos.y += ( dy || 0 )
        return WORLDJS.add( { sprite: { image: '../1/assets/smoke' }, x: pos.x, y: pos.y, inViewUpdates: [ inViewUpdates.smoke ], layer: 3, rotation: Math.random() * Math.PI * 2, rotationLock: true, opacity: .15 - Math.random() * .13 } )
    }
    function createEmber( origin_node, dx, dy ) {
        let pos = WORLDJS.absolutePosition( origin_node )
        pos.x += ( dx || 0 )
        pos.y += ( dy || 0 )
        WORLDJS.add( { sprite: { image: Math.random() > .5 ? '../1/assets/ember' : '../1/assets/ember1' }, x: pos.x, y: pos.y, inViewUpdates: [ inViewUpdates.ember ], layer: origin_node.layer + 1 } )
    }
    const characterTypeInfo = {
        'tank': { image: '../2/assets/tank', base_speed: .02 },
        'melee': { image: '../2/assets/melee', base_speed: .03 },
        'ranged': { image: '../2/assets/ranged', base_speed: .04 },
    }
    function createCharacter( options ) {
        options = options || {}
        let types = Object.keys( characterTypeInfo )
        let type = options.type ? options.type : types[ Math.floor( Math.random() * types.length ) ]
        let info = characterTypeInfo[ type ]
        let character = WORLDJS.addNearestUnblocked( Object.assign( {
            name: 'character',
            width: 16,
            height: 16,
            physical: true,
            rotationLock: true,
            speed: info.base_speed,
            range: 128,
            attackspeed: .5,
            autoAttack: {
                target: null,
                cooldown: 1000,
                lastAttack: 0
            }
        }, options ) )
        if ( !character ) return
        WORLDJS.add( character, { sprite: { image: '../2/assets/helmet' } } )
        if ( 'ranged' === type ) {
            WORLDJS.add( character, { x: -14, sprite: { image: '../2/assets/bow' } } )
        } else if ( 'melee' === type ) {
            WORLDJS.add( character, { x: -15, sprite: { image: '../2/assets/sword' } } )
        } else if ( 'tank' === type ) {
            WORLDJS.add( character, { x: -11, sprite: { image: '../2/assets/shield' } } )
        }
        setHealth( character, 100, -16 )
        return character
    }
    function setHealth( node, health, healthbarYOffset ) {
        node.health = health
        node.healthbar = {}
        node.healthbar.black = WORLDJS.add( node, { y: healthbarYOffset, sprite: { image: '../2/assets/line' }, sprite_scale_x: .8, sprite_scale_y: 2 } )
        node.healthbar.green = WORLDJS.add( node.healthbar.black, { sprite: { image: '../2/assets/line', colour: '#00aa00' }, sprite_scale_x: node.healthbar.black.sprite_scale_x, sprite_scale_y: 2 } )
    }
    function createCampfire( x, y ) {
        let campfire = WORLDJS.addNearestUnblocked( {
            sprite: { image: '../1/assets/campfire' },
            x: x,
            y: y,
            width: 24,
            height: 24,
            physical: true,
            layer: -1
        } )
        createFlame( campfire )
        createFlame( campfire, 3 * ( Math.random() - .5 ), 3 * ( Math.random() - .5 ) )
        return campfire
    }
    function createFlame( origin_node, dx, dy ) {
        let x = origin_node.x + ( dx || 0 )
        let y = origin_node.y + ( dy || 0 )
        WORLDJS.add( origin_node, { sprite: { image: '../3/assets/flame' }, x: 0, y: 0, inViewUpdates: [ inViewUpdates.flame ], opacity: .5, rotation: Math.random() * 2 * Math.PI } )
    }
    let playerspawn
    let playerspawncounter = 0
    let player
    WORLDJS.start( () => {
        global_noise = noise( WORLDJS.time * 10, 0, 1 )
        if ( !playerspawn ) {
            playerspawncounter += 1
            let nodes = WORLDJS.nodesWithinRadius( WORLDJS.viewport, 128 )
            for ( let i = 0, l = nodes.length; i < l; i++ ) {
                let node = nodes[ i ]
                if ( WORLDJS.distance( WORLDJS.viewport, node ) > 128 ) continue
                if ( node.name === 'sand' || node.name === 'water' || node.name === 'water1' ) return WORLDJS.view( noise( playerspawncounter, 0, 10 ) * 100000, Math.round( noise( 0, playerspawncounter, 10 ) * 100000 ) )
                if ( node.name === 'plant' || node.name === 'brush' ) {
                    WORLDJS.remove( node )
                    continue
                }
            }
            createCampfire( WORLDJS.viewport.x, WORLDJS.viewport.y )
            player = createCharacter( { type: 'ranged', x: WORLDJS.viewport.x, y: WORLDJS.viewport.y } )
            WORLDJS.follow( player )
            playerspawn = true
        }
    } )
    const attackable = [ 'character' ]
    const mousemove = () => {
        if ( WORLDJS.mouse.left || WORLDJS.mouse.right ) mousedown()
    }
    const mousedown = () => {
        let mouse = WORLDJS.mouse
        let nodes = WORLDJS.nodesXY( mouse.world.x, mouse.world.y )
        for ( let i = 0, l = nodes.length; i < l; i++ ) {
            let node = nodes[ i ]
            if ( node !== player && -1 < attackable.indexOf( node.name ) ) return autoAttack( player, node )
        }
        let dx = mouse.world.x - player.x
        let dy = mouse.world.y - player.y
        let min = WORLDJS.scaled( 16 )
        if ( min < Math.abs( dx ) || min < Math.abs( dy ) ) {
            player.autoAttack.target = null
            WORLDJS.move( player, mouse.world )
        }
    }
    WORLDJS.addEventListener( WORLDJS, 'mousemove', mousemove )
    WORLDJS.addEventListener( WORLDJS, 'mousedown', mousemove )
    window.addEventListener( 'keydown', event => {
        if ( event.key === 'q' ) {
            //shootArrow( player, WORLDJS.mouse.world )
        }
    } )
    // const UPDATE_INTERVAL_MS = 100
    // let playerspawn
    // let playercampfire
    // WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
    //     let nx = ( cell.x + 50000 ) / 100000
    //     let ny = ( cell.y + 50000 ) / 100000
    //     let n50 = WORLDJS.noise( nx * 50, ny * 50 )
    //     if ( n50 < -.55 ) return createWater( cell )
    //     let n30000 = WORLDJS.noise( nx * 30000, ny * 30000 )
    //     if ( n50 < -.45 && n50 > -.57 ) return WORLDJS.add( { sprite: { image: '../2/assets/sand' }, x: cell.x, y: cell.y, width: 1, height: 1, opacity: ( 1.4 + 2 * n30000 ), layer: 0, rotation: n30000 * Math.PI * 2 } )
    //     if ( !playerspawn && n50 > .5 ) {
    //         playerspawn = cell
    //         playercampfire = createCampfire( playerspawn.x, playerspawn.y )
    //         player = createCharacter( { type: 'ranged', x: playerspawn.x, y: playerspawn.y } )
    //         WORLDJS.follow( player )
    //         WORLDJS.setOverdraw( 64 )
    //     }
    //     if ( n50 < -.5 ) return
    //     WORLDJS.add( { sprite: { image: '../3/assets/dirt' }, x: cell.x, y: cell.y, rotation: n30000 * Math.PI * 2, layer: -1 } )
    //     let n10000 = WORLDJS.noise( nx * 10000, ny * 10000 )
    //     if ( n30000 * n10000 > .5 ) WORLDJS.add( { sprite: { image: n30000 < -.35 ? '../3/assets/stone' : n30000 < .35 ? '../3/assets/stone1' : '../3/assets/stone2' }, x: cell.x, y: cell.y, rotation: n30000 * Math.PI * 2, layer: 1 } )
    //     if ( playercampfire && WORLDJS.distance( playercampfire, cell ) < 256 ) return
    //     let n100 = WORLDJS.noise( nx * 100, ny * 100 )
    //     let n500 = WORLDJS.noise( nx * 500, ny * 500 )
    //     let groundcover = Math.max( 0, Math.min( 1, ( ( ( Math.abs( n100 ) * 1.5 ) - .5 ) * .8 + n500 * .2 ) + .5 ) * 1 )
    //     if ( groundcover < .3 ) return
    //     let n5000 = WORLDJS.noise( nx * 5000, ny * 5000 )
    //     if ( n5000 > 0.9 ) {
    //         if ( n30000 < 0 ) WORLDJS.add( { sprite: { image: '../3/assets/largerock' }, x: cell.x, y: cell.y, rotation: 0, physical: true, width: 90, height: 90, rotation: n10000 * 2 * Math.PI, layer: 1 } )
    //         else WORLDJS.add( { sprite: { image: '../3/assets/rock' }, x: cell.x, y: cell.y, rotation: 0, physical: true, width: 80, height: 85, rotation: n10000 * 2 * Math.PI, layer: 1 } )
    //     }
    //     if ( n5000 > .5 ) return
    //     if ( n30000 > .8 )
    //         WORLDJS.add( { sprite: { image: n30000 < .87 ? '../2/assets/flower0' : n30000 < .92 ? '../2/assets/flower1' : n30000 < .97 ? '../2/assets/flower2' : '../2/assets/flower3', y: -.9 }, x: cell.x, y: cell.y, rotation: n10000 * Math.PI * 2, layer: 1, inViewUpdates: [ windInViewUpdate ] } )
    //     if ( n10000 > 0.8 ) {
    //         let size = ( groundcover + ( n30000 + 1 ) * .5 ) * 64
    //         WORLDJS.add( { sprite: { image: '../3/assets/brush', y: -.2 }, x: cell.x, y: cell.y, width: .6 * size, height: .1 * size, rotation: n30000 * .3, sprite_scale_x: size / 128, sprite_scale_y: size / 128, layer: 2, opacity: .6, inViewUpdates: [ windInViewUpdate ] } )
    //     } else if ( n30000 > 0.9 )
    //         createCharacter( { x: cell.x + n5000 * 10, y: cell.y + n500 * 10 } )
    // } )
    // function createFlame( origin_node, dx, dy ) {
    //     let x = origin_node.x + ( dx || 0 )
    //     let y = origin_node.y + ( dy || 0 )
    //     WORLDJS.add( origin_node, { sprite: { image: '../1/assets/flame' }, x: 0, y: 0, inViewUpdates: [ flameInViewUpdate ], opacity: .5, rotation: Math.random() * 2 * Math.PI, layer: origin_node.layer + 1 } )
    // }
    // function flameInViewUpdate( node ) {
    //     let x_frequency = ( ( node.id + node.x ) * 9999 + node.translate_x_delta + WORLDJS.time ) * .0005
    //     let y_frequency = ( ( node.id + node.y ) * 9999 + node.translate_y_delta + WORLDJS.time ) * .0005
    //     node.translate_x_delta = ( WORLDJS.noise( x_frequency, 0 ) ) * 2
    //     node.translate_y_delta = ( WORLDJS.noise( 0, y_frequency ) ) * 2
    //     node.rotation_delta = WORLDJS.noise( x_frequency, y_frequency ) * .25 + global_noise * .25
    //     let rand = Math.random()
    //     if ( rand > .97 ) createEmber( node, 20 * ( Math.random() - .5 ), 20 * ( Math.random() - .5 ) )
    //     if ( rand > .995 ) createSmoke( node )
    // }
    // function createEmber( origin_node, dx, dy ) {
    //     let pos = WORLDJS.absolutePosition( origin_node )
    //     pos.x += ( dx || 0 )
    //     pos.y += ( dy || 0 )
    //     WORLDJS.add( { sprite: { image: Math.random() > .5 ? '../1/assets/ember' : '../1/assets/ember1' }, x: pos.x, y: pos.y, inViewUpdates: [ emberInViewUpdate ], layer: origin_node.layer + 1 } )
    // }
    // function emberInViewUpdate( node ) {
    //     if ( node.opacity < 0.2 ) {
    //         WORLDJS.remove( node )
    //     } else {
    //         let time = WORLDJS.time * .0001
    //         let noise = WORLDJS.noise( node.x + time, node.y + time ) * .5 + global_noise * .5
    //         node.translate_x_delta += noise * .5
    //         node.translate_y_delta += ( ( noise + 1 ) * .5 ) * -.3 - ( .7 - node.opacity )
    //         node.opacity -= Math.random() * .02
    //     }
    // }
    // function createSmoke( origin_node, dx, dy ) {
    //     let pos = WORLDJS.absolutePosition( origin_node )
    //     pos.x += ( dx || 0 )
    //     pos.y += ( dy || 0 )
    //     return WORLDJS.add( { sprite: { image: '../1/assets/smoke' }, x: pos.x, y: pos.y, inViewUpdates: [ smokeInViewUpdate ], layer: origin_node.layer + 1, rotation: Math.random() * Math.PI * 2, rotationLock: true, opacity: .15 - Math.random() * .13 } )
    // }
    // function smokeInViewUpdate( node ) {
    //     let age = WORLDJS.time - node.createdTime
    //     node.opacity -= age * .00000001
    //     if ( node.opacity <= 0 || age > 20000 ) {
    //         WORLDJS.remove( node )
    //     } else {
    //         node.sprite_scale_x = node.sprite_scale_y = .5 + age * .001
    //         let time = WORLDJS.time * .0001
    //         WORLDJS.translate( node, node.x + WORLDJS.noise( time, 0 ) * .2 * ( 2 - node.opacity ), node.y + WORLDJS.noise( 0, time ) * .2 * ( 2 - node.opacity ) )
    //     }
    // }
    // function windInViewUpdate( node ) {
    //     let time = WORLDJS.time * .0001
    //     let positional_noise = WORLDJS.noise( node.x + time, node.y + time )
    //     let noise = positional_noise * .5 + global_noise * .5
    //     node.rotation_delta = noise * .1
    //     node.sprite_scale_x_delta = node.sprite_scale_y_delta = ( 1 + noise ) * 2
    // }
    // function createWater( cell ) {
    //     WORLDJS.add( { sprite: { image: WORLDJS.noise( cell.x, cell.y ) > 0 ? '../1/assets/water' : '../1/assets/water1' }, x: cell.x, y: cell.y, width: 1, height: 1, opacity: .5, rotation: WORLDJS.noise( cell.x * .0001, cell.y * .0001 ) * Math.PI * 2, layer: 1, inViewUpdates: [ swellInViewUpdate ], opacity: .1 } )
    // }
    // function swellInViewUpdate( node ) {
    //     let time = WORLDJS.time * .0001
    //     let positional_noise = WORLDJS.noise( node.x + time, node.y + time )
    //     node.rotation_delta = ( positional_noise * .3 + global_noise * .7 ) * 1
    //     node.sprite_scale_x_delta = node.sprite_scale_y_delta = ( 1 + positional_noise * .5 + global_noise * .5 ) * 20
    // }
    // function createCampfire( x, y ) {
    //     let campfire = WORLDJS.addNearestUnblocked( {
    //         sprite: { image: '../1/assets/campfire' },
    //         x: x,
    //         y: y,
    //         width: 1.5 * WORLDJS.CELLSIZE,
    //         height: 1.5 * WORLDJS.CELLSIZE,
    //         physical: true,
    //         layer: 1
    //     } )
    //     createFlame( campfire )
    //     createFlame( campfire, 3 * ( Math.random() - .5 ), 3 * ( Math.random() - .5 ) )
    //     // create a clearing around the campfire
    //     let nodes = WORLDJS.nodesWithinRadius( campfire, 256 )
    //     for ( let i = 0, l = nodes.length; i < l; i++ ) {
    //         let node = nodes[ i ]
    //         let distance = WORLDJS.distance( campfire, node )
    //         if ( distance > 128 ) continue
    //         if ( node.name === 'groundgrass' || node.name === 'sand' ) {
    //             node.opacity = ( distance / 256 )
    //             node.opacity *= node.opacity
    //             node.opacity *= node.opacity
    //             continue
    //         }
    //         if ( node.name === 'shrub' || node.name === 'flower' )
    //             WORLDJS.remove( node )
    //     }
    //     return campfire
    // }
    // function createCharacter( options ) {
    //     options = options || {}
    //     let types = Object.keys( characterTypeInfo )
    //     let type = options.type ? options.type : types[ Math.floor( Math.random() * types.length ) ]
    //     let info = characterTypeInfo[ type ]
    //     let character = WORLDJS.addNearestUnblocked( Object.assign( {
    //         name: 'character',
    //         width: WORLDJS.CELLSIZE,
    //         height: WORLDJS.CELLSIZE,
    //         physical: true,
    //         rotationLock: true,
    //         layer: 2,
    //         speed: info.base_speed,
    //         range: 128,
    //         attackspeed: .5,
    //         autoAttack: {
    //             target: null,
    //             cooldown: 1000,
    //             lastAttack: 0
    //         }
    //     }, options ) )
    //     if ( !character ) return
    //     character.character = character
    //     WORLDJS.add( character, { x: 0, sprite: { image: '../2/assets/helmet' }, layer: character.layer + 1 } )
    //     if ( 'ranged' === type ) {
    //         WORLDJS.add( character, { x: -14, sprite: { image: '../2/assets/bow' }, layer: character.layer + 1 } )
    //     } else if ( 'melee' === type ) {
    //         WORLDJS.add( character, { x: -15, sprite: { image: '../2/assets/sword' }, layer: character.layer + 1 } )
    //     } else if ( 'tank' === type ) {
    //         WORLDJS.add( character, { x: -11, sprite: { image: '../2/assets/shield' }, layer: character.layer + 1 } )
    //     }
    //     setHealth( character, 100, -16 )
    //     return character
    // }
    // const characterTypeInfo = {
    //     'tank': { image: '../2/assets/tank', base_speed: .02 },
    //     'melee': { image: '../2/assets/melee', base_speed: .03 },
    //     'ranged': { image: '../2/assets/ranged', base_speed: .04 },
    // }
    // function setHealth( node, health, healthbarYOffset ) {
    //     node.health = health
    //     node.healthbar = {}
    //     node.healthbar.black = WORLDJS.add( node, { y: healthbarYOffset, sprite: { image: '../2/assets/line' }, sprite_scale_x: .8, sprite_scale_y: 2, layer: node.layer + 1 } )
    //     node.healthbar.green = WORLDJS.add( node.healthbar.black, { sprite: { image: '../2/assets/line', colour: '#00aa00' }, sprite_scale_x: node.healthbar.black.sprite_scale_x, sprite_scale_y: 2, layer: node.healthbar.black.layer + 1 } )
    // }
    // function loseHealth( node, amount ) {
    //     node.health = Math.max( 0, node.health - amount )
    //     node.healthbar.green.sprite_scale_x = ( node.health / 100 ) * node.healthbar.black.sprite_scale_x
    //     let pos = WORLDJS.absolutePosition( node.healthbar.green )
    //     //WORLDJS.add( { sprite: { text: '-' + amount, colour: '#aa0000', textAlign: 'center' }, x: pos.x, y: pos.y, layer: node.healthbar.green.layer + 1, rotationLock: true, inViewUpdates: [ lostHealthInViewUpdate ] } )
    //     if ( node.health === 0 ) {
    //         node.physical = false
    //         applyFadeAndRemove( node, 5000 )
    //         createItem( { x: node.x, y: node.y } )
    //     }
    // }
    // function applyFadeAndRemove( node, duration ) {
    //     if ( duration ) {
    //         node.fadeAndRemoveDuration = duration
    //         node.fadeAndRemoveStartTime = WORLDJS.time
    //         node.fadeAndRemoveStartOpacity = node.opacity
    //         node.inViewUpdates.push( applyFadeAndRemove )
    //     }
    //     node.opacity = ( 1 - ( ( WORLDJS.time - node.fadeAndRemoveStartTime ) / node.fadeAndRemoveDuration ) ) * node.fadeAndRemoveStartOpacity
    //     if ( node.opacity <= 0 ) WORLDJS.remove( node )
    // }
    // function lostHealthInViewUpdate( node ) {
    //     node.opacity -= WORLDJS.elapsed * .0001
    //     WORLDJS.translate( node, node.x, node.y - WORLDJS.elapsed * .02 )
    //     if ( node.opacity <= 0 ) WORLDJS.remove( node )
    // }
    // function shootArrow( character, target ) {
    //     let distance = WORLDJS.distance( character, target )
    //     if ( distance > character.range )
    //         target = { x: character.x + ( ( target.x - character.x ) / distance ) * character.range, y: character.y + ( ( target.y - character.y ) / distance ) * character.range }
    //     let speed = character.attackspeed
    //     let arrow = WORLDJS.add( {
    //         sprite: { image: '../2/assets/arrow' },
    //         x: player.x,
    //         y: player.y,
    //         width: 1,
    //         height: 1,
    //         layer: 2,
    //         speed: speed,
    //         inViewUpdates: [ arrowInViewUpdate ],
    //         attackdamage: 15,
    //         source: character
    //     } )
    //     WORLDJS.translate( arrow, target.x, target.y, speed, () => {
    //         let i = arrow.inViewUpdates.indexOf( arrowInViewUpdate )
    //         if ( -1 < i ) arrow.inViewUpdates.splice( i, 1 )
    //         applyFadeAndRemove( arrow, 5000 )
    //     } )
    //     WORLDJS.addEventListener( arrow, 'nodecellschanged', () => {
    //         let nodes = WORLDJS.nodesAtCell( arrow.cells[ 0 ] )
    //         for ( let i = 0, l = nodes.length; i < l; i++ ) {
    //             let node = nodes[ i ]
    //             if ( node === arrow || node === character )
    //                 continue
    //             if ( !arrow.onfire && node.name === 'flame' && node.parent !== arrow ) {
    //                 createFlame( arrow )
    //                 arrow.onfire = true
    //             }
    //             if ( node.health )
    //                 createDamageContact( arrow, node, { attackDamage: 15 } )
    //             if ( node.physical && node.name !== 'campfire' ) {
    //                 WORLDJS.stop( arrow )
    //                 let i = arrow.inViewUpdates.indexOf( arrowInViewUpdate )
    //                 if ( -1 < i ) arrow.inViewUpdates.splice( i, 1 )
    //                 applyFadeAndRemove( arrow, 5000 )
    //                 return
    //             }
    //         }
    //     } )
    // }
    // function arrowInViewUpdate( arrow ) {
    //     let arrowtrail = WORLDJS.add( { sprite: { image: '../2/assets/line' }, x: arrow.x, y: arrow.y, opacity: .3, rotation: arrow.rotation, layer: arrow.layer + 1 } )
    //     applyFadeAndRemove( arrowtrail, 2000 )
    // }
    // //WORLDJS.defineSprite( { name: 'item', fill: '#000000', width: 16, height: 16 } )
    // const itemTypeInfo = {
    //     'item': {
    //     }
    // }
    // function createItem( options ) {
    //     options = options || {}
    //     let types = Object.keys( itemTypeInfo )
    //     let type = options.type ? options.type : types[ Math.floor( Math.random() * types.length ) ]
    //     let info = itemTypeInfo[ type ]
    //     // let item = WORLDJS.addNearestUnblocked( Object.assign( {
    //     //     name: 'item',
    //     //     width: 1,
    //     //     height: 1,
    //     //     rotationLock: true,
    //     //     layer: 2
    //     // }, options ) )
    //     // if ( !item ) return
    //     // //WORLDJS.add( item, { sprite: { name: 'item' } } )
    //     // WORLDJS.add( item, { sprite: { text: 'item', colour: '#aaaaaa', textAlign: 'left', fill: '#000000' }, x: 16 } )
    //     //return item
    // }
    // let player
    // let global_noise
    // const activeDamageContacts = {}
    // const activeDamageContactKeys = []
    // function createDamageContact( sourceNode, targetNode, options ) {
    //     let key = sourceNode.id + ',' + targetNode.id
    //     if ( -1 < activeDamageContactKeys.indexOf( key ) ) return
    //     activeDamageContacts[ key ] = Object.assign( {
    //         key: key,
    //         sourceNode: sourceNode,
    //         targetNode: targetNode,
    //         attackDamage: 0,
    //         start: WORLDJS.time,
    //         duration: 0
    //     }, options )
    //     activeDamageContactKeys.push( key )
    // }
    // let lastUpdateTime = 0
    // const actions = []
    // const resolveDamagedNodes = []
    // WORLDJS.start( () => {
    //     let time = WORLDJS.time * .0001
    //     global_noise = WORLDJS.noise( time, 0 )
    //     if ( !playerspawn )
    //         // move the view until a suitable playerspawn is found
    //         return WORLDJS.view( Math.round( global_noise * 100000 ), Math.round( WORLDJS.noise( 0, time ) * 100000 ) )
    //     if ( WORLDJS.time - lastUpdateTime >= UPDATE_INTERVAL_MS ) {
    //         lastUpdateTime = WORLDJS.time
    //         let length = actions.length
    //         if ( length > 0 ) {
    //             for ( let i = 0; i < length; i++ ) actions[ i ]()
    //             actions.splice( 0, length )
    //         }
    //         for ( let i = 0; i < activeDamageContactKeys.length; i++ ) {
    //             let key = activeDamageContactKeys[ i ]
    //             let damageContact = activeDamageContacts[ key ]
    //             let targetNode = damageContact.targetNode
    //             if ( -1 === resolveDamagedNodes.indexOf( damageContact.target_node ) ) {
    //                 targetNode.incomingDamage = 0
    //                 resolveDamagedNodes.push( targetNode )
    //             }
    //             targetNode.incomingDamage += damageContact.attackDamage
    //             if ( WORLDJS.time - damageContact.start >= damageContact.duration ) {
    //                 activeDamageContactKeys.splice( i--, 1 )
    //                 delete activeDamageContacts[ key ]
    //             }
    //         }
    //         length = resolveDamagedNodes.length
    //         for ( let i = 0; i < length; i++ ) {
    //             let node = resolveDamagedNodes[ i ]
    //             loseHealth( node, node.incomingDamage )
    //         }
    //         resolveDamagedNodes.length = 0
    //     }
    // } )
    // const attackable = [ 'character' ]
    // function autoAttack( character, target ) {
    //     if ( target ) {
    //         character.autoAttack.target = target
    //     }
    //     if ( !character.autoAttack.target || character.autoAttack.target.health === 0 ) {
    //         character.autoAttack.target = null
    //         return
    //     }
    //     let cells = WORLDJS.ray( character, character.autoAttack.target, character )
    //     if ( WORLDJS.distance( character, character.autoAttack.target ) < character.range && cells.length > 0 && cells[ cells.length - 1 ].physical === character.autoAttack.target ) {
    //         WORLDJS.stop( character )
    //         if ( WORLDJS.time - character.autoAttack.lastAttack > character.autoAttack.cooldown ) {
    //             shootArrow( character, character.autoAttack.target )
    //             character.autoAttack.lastAttack = WORLDJS.time
    //         }
    //     } else if ( target ) {
    //         WORLDJS.move( character, character.autoAttack.target )
    //     }
    //     actions.push( () => { autoAttack( character ) } )
    // }
    // const mousemove = () => {
    //     if ( WORLDJS.mouse.left || WORLDJS.mouse.right ) mousedown()
    // }
    // const mousedown = () => {
    //     let mouse = WORLDJS.mouse
    //     let nodes = WORLDJS.nodesXY( mouse.world.x, mouse.world.y )
    //     for ( let i = 0, l = nodes.length; i < l; i++ ) {
    //         let node = nodes[ i ]
    //         if ( node !== player && -1 < attackable.indexOf( node.name ) ) return autoAttack( player, node )
    //     }
    //     let dx = mouse.world.x - player.x
    //     let dy = mouse.world.y - player.y
    //     let min = WORLDJS.scaled( WORLDJS.CELLSIZE )
    //     if ( min < Math.abs( dx ) || min < Math.abs( dy ) ) {
    //         player.autoAttack.target = null
    //         WORLDJS.move( player, mouse.world )
    //     }
    // }
    // WORLDJS.addEventListener( WORLDJS, 'mousemove', mousemove )
    // WORLDJS.addEventListener( WORLDJS, 'mousedown', mousemove )
    // window.addEventListener( 'keydown', event => {
    //     if ( event.key === 'q' ) {
    //         shootArrow( player, WORLDJS.mouse.world )
    //     }
    // } )
} )()