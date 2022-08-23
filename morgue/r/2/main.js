( function () {
    'use strict'
    //WORLDJS.seed( 'FTg4NCfth3BGzZdR3sWrVDYP' )
    const UPDATE_INTERVAL_MS = 100
    let playerspawn
    let playercampfire
    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        let nx = ( cell.x + 50000 ) / 100000
        let ny = ( cell.y + 50000 ) / 100000
        let n50 = WORLDJS.noise( nx * 50, ny * 50 )
        if ( n50 < -.5 )
            return createWater( cell )
        let n100 = WORLDJS.noise( nx * 100, ny * 100 )
        if ( n50 < -.42 && n100 > -.5 )
            return WORLDJS.add( { name: 'sand', sprite: { image: '../2/assets/sand' }, x: cell.x + n100 * 16, y: cell.y + n100 * 16, width: 1, height: 1, opacity: ( 1.4 + 2 * n50 ), layer: -1, rotation: n100 } )
        let n500 = WORLDJS.noise( nx * 500, ny * 500 )
        let n5000 = WORLDJS.noise( nx * 5000, ny * 5000 )
        let n10000 = WORLDJS.noise( nx * 10000, ny * 10000 )
        let n30000 = WORLDJS.noise( nx * 30000, ny * 30000 )
        if ( !playerspawn && n50 > .5 ) {
            playerspawn = cell
            playercampfire = createCampfire( playerspawn.x, playerspawn.y )
            player = createCharacter( { type: 'ranged', x: playerspawn.x, y: playerspawn.y } )
            WORLDJS.follow( player )
            WORLDJS.setOverdraw( 128 )
        }
        if ( n50 > -.4 ) {
            let groundcover = Math.max( 0, Math.min( 1, ( ( ( Math.abs( n100 ) * 1.5 ) - .5 ) * .8 + n500 * .2 ) + .5 ) * 1 )
            if ( groundcover > .2 && cell.x % 32 === 0 && cell.y % 32 === 0 ) {
                let groundgrass = WORLDJS.add( { sprite: { image: '/r/1/assets/groundgrass' }, x: cell.x + n10000 * 16, y: cell.y + n10000 * 16, width: 1, height: 1, layer: -2, opacity: groundcover * groundcover, rotation: n10000 * Math.PI } )
                if ( playercampfire && WORLDJS.distance( playercampfire, groundgrass ) < 128 ) {
                    groundgrass.opacity = .2 * ( WORLDJS.distance( playercampfire, groundgrass ) / 128 )
                    //groundgrass.opacity *= groundgrass.opacity
                }
            }
            if ( groundcover > .1 ) {
                if ( n30000 > .8 && ( !playercampfire || WORLDJS.distance( playercampfire, cell ) > 128 ) )
                    WORLDJS.add( { name: 'flower', sprite: { image: n30000 < .87 ? '../2/assets/flower0' : n30000 < .92 ? '../2/assets/flower1' : n30000 < .97 ? '../2/assets/flower2' : '../2/assets/flower3', y: -.9 }, x: cell.x, y: cell.y, rotation: n10000 * Math.PI * 2, inViewUpdate: windInViewUpdate } )
                if ( groundcover > .2 && n5000 > 0.8 && ( !playercampfire || WORLDJS.distance( playercampfire, cell ) > 128 ) ) {
                    let size = ( groundcover + ( n30000 + 1 ) * .5 ) * 64
                    WORLDJS.add( { name: 'shrub', sprite: { image: '../1/assets/grass0', y: -.2 }, x: cell.x, y: cell.y, width: .6 * size, height: .1 * size, rotation: n30000 * .3, sprite_scale_x: size / 128, sprite_scale_y: size / 128, layer: 2, opacity: .6, inViewUpdate: windInViewUpdate } )
                }
                if ( n10000 > 0.9 )
                    createCharacter( { x: cell.x + n5000 * 10, y: cell.y + n500 * 10 } )
            }
        }
    } )
    function createFlame( origin_node, dx, dy ) {
        let x = origin_node.x + ( dx || 0 )
        let y = origin_node.y + ( dy || 0 )
        WORLDJS.add( origin_node, { name: 'flame', sprite: { image: '../1/assets/flame' }, x: 0, y: 0, inViewUpdate: flameInViewUpdate, opacity: .5, rotation: Math.random() * 2 * Math.PI, layer: origin_node.layer + 1 } )
    }
    function flameInViewUpdate( node ) {
        let x_frequency = ( ( node.id + node.x ) * 9999 + node.translate_x_delta + WORLDJS.time ) * .0005
        let y_frequency = ( ( node.id + node.y ) * 9999 + node.translate_y_delta + WORLDJS.time ) * .0005
        node.translate_x_delta = ( WORLDJS.noise( x_frequency, 0 ) ) * 2
        node.translate_y_delta = ( WORLDJS.noise( 0, y_frequency ) ) * 2
        node.rotation_delta = WORLDJS.noise( x_frequency, y_frequency ) * .25 + global_noise * .25
        let rand = Math.random()
        if ( rand > .97 ) createEmber( node, 20 * ( Math.random() - .5 ), 20 * ( Math.random() - .5 ) )
        if ( rand > .995 ) createSmoke( node )
    }
    function createEmber( origin_node, dx, dy ) {
        let pos = WORLDJS.absolutePosition( origin_node )
        pos.x += ( dx || 0 )
        pos.y += ( dy || 0 )
        WORLDJS.add( { name: 'ember', sprite: { image: Math.random() > .5 ? '../1/assets/ember' : '../1/assets/ember1' }, x: pos.x, y: pos.y, inViewUpdate: emberInViewUpdate, layer: origin_node.layer + 1 } )
    }
    function emberInViewUpdate( node ) {
        if ( node.opacity < 0.2 ) {
            WORLDJS.remove( node )
        } else {
            let time = WORLDJS.time * .0001
            let noise = WORLDJS.noise( node.x + time, node.y + time ) * .5 + global_noise * .5
            node.translate_x_delta += noise * .5
            node.translate_y_delta += ( ( noise + 1 ) * .5 ) * -.3 - ( .7 - node.opacity )
            node.opacity -= Math.random() * .02
        }
    }
    function createSmoke( origin_node, dx, dy ) {
        let pos = WORLDJS.absolutePosition( origin_node )
        pos.x += ( dx || 0 )
        pos.y += ( dy || 0 )
        return WORLDJS.add( { name: 'smoke', sprite: { image: '../1/assets/smoke' }, x: pos.x, y: pos.y, inViewUpdate: smokeInViewUpdate, layer: origin_node.layer + 1, rotation: Math.random() * Math.PI * 2, rotationLock: true, opacity: .15 - Math.random() * .13 } )
    }
    function smokeInViewUpdate( node ) {
        let age = WORLDJS.time - node.createdTime
        node.opacity -= age * .00000001
        if ( node.opacity <= 0 || age > 20000 ) {
            WORLDJS.remove( node )
        } else {
            node.sprite_scale_x = node.sprite_scale_y = .5 + age * .001
            let time = WORLDJS.time * .0001
            WORLDJS.translate( node, node.x + WORLDJS.noise( time, 0 ) * .2 * ( 2 - node.opacity ), node.y + WORLDJS.noise( 0, time ) * .2 * ( 2 - node.opacity ) )
        }
    }
    function windInViewUpdate( node ) {
        let time = WORLDJS.time * .0001
        let positional_noise = WORLDJS.noise( node.x + time, node.y + time )
        let noise = positional_noise * .5 + global_noise * .5
        node.rotation_delta = noise * .1
        node.sprite_scale_x_delta = node.sprite_scale_y_delta = ( 1 + noise ) * 2
    }
    function createWater( cell ) {
        WORLDJS.add( { sprite: { image: WORLDJS.noise( cell.x, cell.y ) > 0 ? '../1/assets/water' : '../1/assets/water1' }, x: cell.x, y: cell.y, width: 1, height: 1, opacity: .5, rotation: WORLDJS.noise( cell.x * .0001, cell.y * .0001 ) * Math.PI * 2, layer: 1, inViewUpdate: swellInViewUpdate } )
    }
    function swellInViewUpdate( node ) {
        let time = WORLDJS.time * .0001
        let positional_noise = WORLDJS.noise( node.x + time, node.y + time )
        node.rotation_delta = ( positional_noise * .3 + global_noise * .7 ) * .5
        node.sprite_scale_x_delta = node.sprite_scale_y_delta = ( 1 + positional_noise * .5 + global_noise * .5 ) * 10
    }
    function createCampfire( x, y ) {
        let campfire = WORLDJS.add( {
            name: 'campfire',
            sprite: { image: '../1/assets/campfire' },
            x: x,
            y: y,
            width: 1.5 * WORLDJS.CELLSIZE,
            height: 1.5 * WORLDJS.CELLSIZE,
            physical: true
        } )
        createFlame( campfire )
        createFlame( campfire, 3 * ( Math.random() - .5 ), 3 * ( Math.random() - .5 ) )
        // create a clearing around the campfire
        let nodes = WORLDJS.nodesWithinRadius( campfire, 128 )
        for ( let i = 0, l = nodes.length; i < l; i++ ) {
            let node = nodes[ i ]
            let distance = WORLDJS.distance( campfire, node )
            if ( distance > 128 ) continue
            if ( node.name === 'groundgrass' || node.name === 'sand' ) {
                node.opacity = ( distance / 128 )
                node.opacity *= node.opacity
                node.opacity *= node.opacity
                continue
            }
            if ( node.name === 'shrub' || node.name === 'flower' )
                WORLDJS.remove( node )
        }
        return campfire
    }
    function createCharacter( options ) {
        options = options || {}
        let types = Object.keys( characterTypeInfo )
        let type = options.type ? options.type : types[ Math.floor( Math.random() * types.length ) ]
        let info = characterTypeInfo[ type ]
        let character = WORLDJS.add( Object.assign( {
            name: 'character',
            width: WORLDJS.CELLSIZE,
            height: WORLDJS.CELLSIZE,
            physical: true,
            rotationLock: true,
            layer: 1,
            speed: info.base_speed
        }, options ), null, 'nearest' )
        if ( !character ) return
        character.character = character
        WORLDJS.add( character, { name: 'helmet', x: 0, sprite: { image: '../2/assets/helmet' }, layer: character.layer + 1 } )
        if ( 'ranged' === type ) {
            WORLDJS.add( character, { name: 'bow', x: -14, sprite: { image: '../2/assets/bow' }, layer: character.layer + 1 } )
        } else if ( 'melee' === type ) {
            WORLDJS.add( character, { name: 'sword', x: -15, sprite: { image: '../2/assets/sword' }, layer: character.layer + 1 } )
        } else if ( 'tank' === type ) {
            WORLDJS.add( character, { name: 'shield', x: -11, sprite: { image: '../2/assets/shield' }, layer: character.layer + 1 } )
        }
        //WORLDJS.add( character.node, { name: 'shield', x: 10, sprite: { image: '../2/assets/shield' }, layer: character.layer + 1 } )
        setHealth( character, 100, -16 )
        return character
    }
    const characterTypeInfo = {
        'tank': { image: '../2/assets/tank', base_speed: .02 },
        'melee': { image: '../2/assets/melee', base_speed: .03 },
        'ranged': { image: '../2/assets/ranged', base_speed: .04 },
    }
    function setHealth( node, health, healthbarYOffset ) {
        node.health = health
        node.healthbar = {}
        node.healthbar.black = WORLDJS.add( node, { y: healthbarYOffset, sprite: { image: '../2/assets/line' }, sprite_scale_x: .8, sprite_scale_y: 2, layer: node.layer + 1 } )
        node.healthbar.green = WORLDJS.add( node.healthbar.black, { sprite: { image: '../2/assets/line', colour: '#00aa00' }, sprite_scale_x: node.healthbar.black.sprite_scale_x, sprite_scale_y: 2, layer: node.healthbar.black.layer + 1 } )
    }
    function loseHealth( node, amount ) {
        node.health = Math.max( 0, node.health - amount )
        node.healthbar.green.sprite_scale_x = ( node.health / 100 ) * node.healthbar.black.sprite_scale_x
        let pos = WORLDJS.absolutePosition( node.healthbar.green )
        WORLDJS.add( { text: { text: '-' + amount, colour: '#aa0000', textAlign: 'center' }, x: pos.x, y: pos.y, layer: node.healthbar.green.layer + 1, rotationLock: true, inViewUpdate: lostHealthInViewUpdate } )
    }
    function lostHealthInViewUpdate( node ) {
        node.opacity -= WORLDJS.elapsed * .0001
        WORLDJS.translate( node, node.x, node.y - WORLDJS.elapsed * .02 )
        if ( node.opacity <= 0 ) WORLDJS.remove( node )
    }
    function shootArrow( source, x, y ) {
        let speed = .5
        let arrow = WORLDJS.add( {
            name: 'arrow',
            sprite: { image: '../2/assets/arrow' },
            x: player.x,
            y: player.y,
            width: 1,
            height: 1,
            layer: 1,
            speed: speed,
            physical: true,
            inViewUpdate: arrowInViewUpdate,
            attackdamage: 15,
            source: source
        } )
        WORLDJS.translate( arrow, x, y, speed, () => {
            arrow.timed_removed = WORLDJS.time
        } )
        WORLDJS.addEventListener( arrow, 'nodecellschanged', () => {
            let nodes = WORLDJS.nodesAtCell( arrow.cells[ 0 ] )
            for ( let i = 0, l = nodes.length; i < l; i++ ) {
                let node = nodes[ i ]
                if ( node === source )
                    continue
                if ( !arrow.onfire && node.name === 'flame' && node.parent !== arrow ) {
                    createFlame( arrow )
                    arrow.onfire = true
                }
                if ( node.health )
                    createDamageContact( arrow, node, { attackDamage: 15 } )
            }
        } )
    }
    function arrowInViewUpdate( arrow ) {
        if ( arrow.timed_removed ) {
            arrow.opacity = 1 - ( WORLDJS.time - arrow.timed_removed ) * .0001
            if ( arrow.opacity <= .1 )
                WORLDJS.remove( arrow )
            return
        }
        if ( !arrow.arrow_InViewUpdate_last_x ) arrow.arrow_InViewUpdate_last_x = arrow.x
        if ( !arrow.arrow_InViewUpdate_last_y ) arrow.arrow_InViewUpdate_last_y = arrow.y
        let dx = Math.abs( arrow.x - arrow.arrow_InViewUpdate_last_x )
        let dy = Math.abs( arrow.y - arrow.arrow_InViewUpdate_last_y )
        if ( dx < 1 && dy < 1 ) return
        arrow.arrow_InViewUpdate_last_x = arrow.x
        arrow.arrow_InViewUpdate_last_y = arrow.y
        let nodes = WORLDJS.nodesAtCell( arrow.cells[ 0 ] )
        for ( let i = 0, l = nodes.length; i < l; i++ ) {
            let node = nodes[ i ]
            if ( node.name === 'character' ) {
                let character = node

            }
        }
        WORLDJS.add( { name: 'arrowtrail', sprite: { image: '../2/assets/line' }, x: arrow.x, y: arrow.y, inViewUpdate: arrowTrailInViewUpdate, opacity: .3, rotation: arrow.rotation, layer: arrow.layer + 1 } )
    }
    function arrowTrailInViewUpdate( node ) {
        node.opacity -= WORLDJS.elapsed * .0004
        if ( node.opacity <= 0.001 ) WORLDJS.remove( node )
    }
    const attackable = [ 'character' ]
    let move_or_attack_check_last = { x: null, y: null }
    function move_or_attack_check() {
        let x = WORLDJS.mouse.world.x
        let y = WORLDJS.mouse.world.y
        if ( x === move_or_attack_check_last.x && y === move_or_attack_check_last.y ) return
        move_or_attack_check_last.x = x
        move_or_attack_check_last.y = y
        let dx = x - player.x
        let dy = y - player.y
        if ( ( WORLDJS.mouse.left || WORLDJS.mouse.right ) && ( WORLDJS.scaled( 32 ) < Math.abs( dx ) || WORLDJS.scaled( 32 ) < Math.abs( dy ) ) ) {
            WORLDJS.move( player, dx, dy, move_or_attack_check )
        }
    }
    let player
    let global_noise
    const activeDamageContacts = {}
    const activeDamageContactKeys = []
    function createDamageContact( sourceNode, targetNode, options ) {
        let key = sourceNode.id + ',' + targetNode.id
        if ( -1 < activeDamageContactKeys.indexOf( key ) ) return
        activeDamageContacts[ key ] = Object.assign( {
            key: key,
            sourceNode: sourceNode,
            targetNode: targetNode,
            attackDamage: 0,
            start: WORLDJS.time,
            duration: 0
        }, options )
        activeDamageContactKeys.push( key )
    }
    let lastUpdateTime = 0
    const actions = []
    const resolveDamagedNodes = []
    WORLDJS.start( () => {
        let time = WORLDJS.time * .0001
        global_noise = WORLDJS.noise( time, 0 )
        if ( !playerspawn )
            // move the view until a suitable playerspawn is found
            return WORLDJS.view( Math.round( global_noise * 100000 ), Math.round( WORLDJS.noise( 0, time ) * 100000 ) )
        if ( WORLDJS.time - lastUpdateTime >= UPDATE_INTERVAL_MS ) {
            lastUpdateTime = WORLDJS.time
            for ( let i = 0; i < actions.length; i++ )
                actions[ i ]()
            actions.length = 0
            for ( let i = 0; i < activeDamageContactKeys.length; i++ ) {
                let key = activeDamageContactKeys[ i ]
                let damageContact = activeDamageContacts[ key ]
                let targetNode = damageContact.targetNode
                if ( -1 === resolveDamagedNodes.indexOf( damageContact.target_node ) ) {
                    targetNode.incomingDamage = 0
                    resolveDamagedNodes.push( targetNode )
                }
                targetNode.incomingDamage += damageContact.attackDamage
                if ( WORLDJS.time - damageContact.start >= damageContact.duration ) {
                    activeDamageContactKeys.splice( i--, 1 )
                    delete activeDamageContacts[ key ]
                }
            }
            for ( let i = 0, l = resolveDamagedNodes.length; i < l; i++ ) {
                let node = resolveDamagedNodes[ i ]
                loseHealth( node, node.incomingDamage )
            }
            resolveDamagedNodes.length = 0
        }
    } )
    const mousemove = WORLDJS.debounce( 90, () => {
        if ( WORLDJS.mouse.left ) {
            let x = WORLDJS.mouse.world.x
            let y = WORLDJS.mouse.world.y
            let nodes = WORLDJS.nodesXY( x, y )
            for ( let i = 0, l = nodes.length; i < l; i++ ) {
                let node = nodes[ i ]
                if ( -1 < attackable.indexOf( node.name ) ) {
                    shootArrow( player, x, y )
                }
            }
        }
        if ( WORLDJS.mouse.left || WORLDJS.mouse.right ) {
            move_or_attack_check()
        } else {
        }
    } )
    const mousedown = WORLDJS.debounce( 90, () => {
        //if ( WORLDJS.mouse.left )
        WORLDJS.move( player, WORLDJS.mouse.world.x - player.x, WORLDJS.mouse.world.y - player.y )
        // else if ( WORLDJS.mouse.right )
        //     WORLDJS.add( { sprite: { name: 'object' }, x: WORLDJS.mouse.world.x, y: WORLDJS.mouse.world.y, physical: true } )
    } )
    WORLDJS.addEventListener( WORLDJS, 'mousemove', mousemove )
    WORLDJS.addEventListener( WORLDJS, 'mousedown', mousedown )
    window.addEventListener( 'keydown', event => {
        if ( event.key === 'q' ) {
            shootArrow( player, WORLDJS.mouse.world.x, WORLDJS.mouse.world.y )
        }
    } )
} )()