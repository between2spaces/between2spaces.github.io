import mem from './mem.js'
import * as ui from './ui.js'

ui.setid( document.getElementsByTagName( 'head' )[ 0 ], 'head' )
ui.setid( document.getElementsByTagName( 'body' )[ 0 ], 'body' )

ui.content( ui.element( 'head' ), ui.attrib( ui.element( 'icon', 'link' ), {
    rel: 'icon', href: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAAQABADAREAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQYI/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAB0aGihOH/xAAaEAACAgMAAAAAAAAAAAAAAAAEBQEDAhIT/9oACAEBAAEFApNvhsa9p1JGztY8DZX/AP/EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQMBAT8BH//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQIBAT8BH//EACIQAAIBBAEEAwAAAAAAAAAAAAECAwQREiEAEyIxQRShsf/aAAgBAQAGPwKOm6IWBo3bMnuJGP1vkQp5GyeeOMP0zg3eAQGIsdX8cp3GoxFKhYHwTjb8PKGi+EV6EkOcma4WRl2u7+vduf/EAB0QAQEAAQQDAAAAAAAAAAAAAAERQQAhMWFRcfD/2gAIAQEAAT8hYw0Vq8A47d+jO4qtTX3qJYU40eaGZW/R40UiFWppjgqDZcwf/9oADAMBAAIAAwAAABAAT//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQIBAT8QH//EABgQAQEBAQEAAAAAAAAAAAAAAAERITEA/9oACAEBAAE/EBNMkDYuST1UnAH1R+WHXsqvpZ0CH1mQwEWqjUIdSlBBdIGGV2JLLfB//9k='
} ) )

ui.content( ui.element( 'head' ), ui.content( ui.element( 'style', 'style', ui.element( 'head' ) ), '\n' + [
    'body { margin: 0; font-family: monospace; font-size: 2vw; }',
    '* { box-sizing: border-box; overflow: hidden; }',
    'table { width: 100%; border-collapse: collapse; }',
    '.cell { position: absolute; }'
].join( '\n' ) + '\n' ) )

const cells = []
const B = []
const b = []
const H = []
const h = []
const objects = []
const towers = []
const creeps = []

const CHAR = {
    '.': {
        name: 'ground',
        zIndex: 0,
        damage: 0,
        damageReduction: 1,
        memberOf: [ objects ]
    },
    'B': {
        name: 'UPPER base',
        zIndex: 1,
        damage: 0,
        damageReduction: 1,
        memberOf: [ objects, B ]
    },
    'b': {
        name: 'lower base',
        zIndex: 1,
        damage: 0,
        damageReduction: 1,
        memberOf: [ objects, b ]
    },
    'T': {
        name: 'UPPER tower',
        zIndex: 1,
        damage: 0.3,
        damageReduction: 1,
        memberOf: [ objects, towers ]
    },
    't': {
        name: 'lower tower',
        zIndex: 1,
        damage: 0.3,
        damageReduction: 1,
        memberOf: [ objects, towers ]
    },
    'C': {
        name: 'UPPER creep',
        zIndex: 2,
        damage: 0.1,
        damageReduction: 0,
        memberOf: [ objects, creeps ]
    },
    'c': {
        name: 'lower creep',
        zIndex: 2,
        damage: 0.1,
        damageReduction: 0,
        memberOf: [ objects, creeps ]
    },
    'H': {
        name: 'UPPER hero',
        zIndex: 9,
        damage: 0.2,
        damageReduction: 0,
        memberOf: [ objects, H ]
    },
    'h': {
        name: 'lower hero',
        zIndex: 9,
        damage: 0.2,
        damageReduction: 0,
        memberOf: [ objects, h ]
    }
}

function Object( char ) {
    let config = CHAR[ char ]
    let object = {
        char: char,
        cell: null,
        e: ui.element( null, 'span' ),
        health: 1,
        damage: config.damage,
        damageReduction: config.damageReduction
    }
    object.e.className = 'cell'
    ui.style( object.e, { zIndex: config.zIndex } )
    object.e.textContent = char
    for ( let i = 0; i < config.memberOf.length; i++ ) {
        config.memberOf[ i ].push( object )
    }
    return object
}


ui.content( ui.element( 'body' ), ui.layout( 'cells', Array( 79 ), 1 ) )
let results = ui.xpath( '//*[@id="cells"]//td', XPathResult.ORDERED_NODE_SNAPSHOT_TYPE )
for ( let i = 0; i < results.snapshotLength; i++ ) {
    cells[ i ] = {
        index: i,
        e: ui.element( null, 'div' ),
        objects: []
    }
    ui.content( results.snapshotItem( i ), cells[ i ].e )
    ui.style( cells[ i ].e, { position: 'relative', height: '1em' } )
    ; ( ( cell ) => {
        cell.e.addEventListener( 'mouseover', () => { mouseover( cell ) } )
    } )( cells[ i ] )
    add( Object( '.' ), i )
}

const layout = 'b  t              t              t           T              T              T  B'

for ( let i = 0; i < layout.length; i++ ) {
    let char = layout[ i ]
    if ( char === ' ' ) continue
    add( Object( char ), i )
}

add( Object( 'h' ), 0 )
add( Object( 'H' ), layout.length - 1 )

mem[ 'lowerpts' ] = 0
mem[ 'UPPERpts' ] = 0
mem[ 'elapsed' ] = 0

ui.content( ui.element( 'body' ), ui.layout( 'status', [ 33, 33, 33], 1 ) )
results = ui.xpath( '//*[@id="status"]//td', XPathResult.ORDERED_NODE_SNAPSHOT_TYPE )
ui.style( ui.setid( results.snapshotItem( 0 ), 'lowerpts' ), { textAlign: 'left' } )
ui.style( ui.setid( results.snapshotItem( 1 ), 'elapsed' ), { textAlign: 'center' } )
ui.style( ui.setid( results.snapshotItem( 2 ), 'UPPERpts' ), { textAlign: 'right' } )

ui.update()

function add( object, index ) {
    let cell = cells[ clamp( index ) ]
    cell.e.appendChild( object.e )
    object.cell = cell
    let objs = cell.objects
    let i = objs.indexOf( object )
    if ( i === -1 ) objs.push( object )
    objs.sort( compare_objects_by_health )
}


function clamp( index ) {
    if ( index < 0 ) {
        return index = 0
    }
    if ( index >= cells.length ) {
        return cells.length - 1
    }
    return index
}


function compare_objects_by_health( obj1, obj2 ) {
    if ( obj1.health === obj2.health ) return 0
    return ( obj1.health < obj2.health ) ? -1 : 1
}


function remove( object ) {
    if ( !object.cell ) return
    object.cell.e.removeChild( object.e )
    let i = object.cell.objects.indexOf( object )
    if ( i > -1 ) {
        object.cell.objects.splice( i, 1 )
    }
    object.cell = null
}

function move( object, index ) {
    index = clamp( index )
    if ( index === object.cell.index ) return false
    remove( object )
    add( object, index )
    return true
}

function forward( object, distance ) {
    if ( enemyAt( object, object.cell.index ) ) return true
    let index = clamp( object.cell.index + ( /[A-Z]/.test( object.char ) ? -distance : distance ) )
    return move( object, index )
}

function back( object ) {
    let base = /[A-Z]/.test( object.char ) ? B[ 0 ] : b[ 0 ]
    return move( object, base.cell.index )
}

function attack( object, index ) {
    if ( object.damage === 0 ) return
    let target = enemyAt( object, index )
    if ( !target ) return
    if ( target.health === 0 ) return
    let damage = object.damage - ( object.damage * target.damageReduction )
    target.health -= damage
    if ( target.health <= 0 ) {
        target.health = 0
        target.lasthit = object
    }
}

function killed( object ) {
    if ( object.lasthit === h[ 0 ] ) mem[ 'lowerpts' ] += 2
    else if ( object.lasthit === H[ 0 ] ) mem[ 'UPPERpts' ] += 2
    else if ( /[a-z]/.test( object.lasthit.char ) ) mem[ 'lowerpts' ]++
    else if ( /[A-Z]/.test( object.lasthit.char ) ) mem[ 'UPPERpts' ]++
    remove( object )
    let config = CHAR[ object.char ]
    for ( let i = 0; i < config.memberOf.length; i++ ) {
        let t = config.memberOf[ i ].indexOf( object )
        if ( t > -1 ) config.memberOf[ i ].splice( t, 1 )
    }
}

function friendlyAt( object, index ) {
    let cell = cells[ clamp( index ) ]
    let upper = /[A-Z]/.test( object.char )
    let objs = cell.objects
    let i = objs.length
    while ( i-- ) {
        let o = objs[ i ]
        if ( upper && /[A-Z]/.test( o.char ) ) {
            return o
        } else if ( !upper && /[a-z]/.test( o.char ) ) {
            return o
        }
    }
    return false
}

function enemyAt( object, index ) {
    let cell = cells[ clamp( index ) ]
    let upper = /[A-Z]/.test( object.char )
    let objs = cell.objects
    let i = objs.length
    while ( i-- ) {
        let o = objs[ i ]
        if ( upper && /[a-z]/.test( o.char ) ) {
            return o
        } else if ( !upper && /[A-Z]/.test( o.char ) ) {
            return o
        }
    }
    return false
}

function teleport( object, index ) {
    if ( friendlyAt( object, index ) ) {
        return move( object, index )
    }
    return false
}

function cellsWithin( index, distance ) {
    let from = index - distance
    let to = index + distance
    if ( from < 0 ) from = 0
    if ( to >= cells.length ) to = cells.length - 1
    let result = []
    while ( from <= to ) {
        result.push( cells[ from ] )
        from++
    }
    return result
}


const tasks = []

function start( task, interval ) {
    if ( interval ) {
        task.interval = interval
    }
    task.last = -1
    tasks.push( task )
}

function stop( task ) {
    let i = tasks.indexOf( task )
    if ( i > -1 ) tasks.splice( i, 1 )
}


function creepSpawn() {
    if ( mem[ 'elapsed' ] % 15 <= 5 ) {
        let object = Object( 'C' )
        if ( object ) add( object, B[ 0 ].cell.index )
        object = Object( 'c' )
        if ( object ) add( object, b[ 0 ].cell.index )
    }
}

start( creepSpawn, 2 )

function creepUpdate() {
    let i = creeps.length
    while ( i-- ) {
        let object = creeps[ i ]
        forward( object, 1 )
    }
}

start( creepUpdate, 1 )

let mouseindex = 0

function mouseover( cell ) {
    mouseindex = cell.index
    console.log( cell.index )
}

function keydown( event ) {
    if ( h[ 0 ].health === 0 ) return
    let turn = true
    switch ( event.key ) {
        case 'a':
            break
        case 'f':
            turn = forward( h[ 0 ], 1 )
            break
        case 'd':
            turn = forward( h[ 0 ], -1 )
            break
        case 'b':
            turn = back( h[ 0 ] )
            break
        case 't':
            turn = teleport( h[ 0 ], mouseindex )
            break
        default:
            turn = false
    }
    if ( turn ) {
        let i = tasks.length
        while ( i-- ) {
            let task = tasks[ i ]
            if ( mem[ 'elapsed' ] >= task.last + task.interval ) {
                task()
                task.last = mem[ 'elapsed' ]
            }
        }
        // resolve attacks after movement
        i = objects.length
        while ( i-- ) {
            let object = objects[ i ]
            attack( object, object.cell.index )
        }
        // resolve kills after attacks
        i = objects.length
        while ( i-- ) {
            let object = objects[ i ]
            if ( object.health === 0 ) killed( object )
        }
        mem[ 'elapsed' ]++
        ui.update()
    }
}

document.addEventListener( 'keydown', keydown )