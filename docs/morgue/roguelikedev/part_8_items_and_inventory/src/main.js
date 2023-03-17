import { rngUniformInt } from './rng'
import { noise } from './noise'

/**
 * Simplified A* algorithm: all edges have a value of 1
 */

const TOPOLOGY = 8

const DIRS = {
    '4': [ { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 } ],
    '8': [ { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 } ],
    '6': [ { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -2, y: 0 } ]
}[ TOPOLOGY ]

const DISTANCE = {
    '4': function( x0, y0, x1, y1 ) {
        return Math.abs( x1 - x0 ) + Math.abs( y1 - y0 )
    },
    '6': function( x0, y0, x1, y1 ) {
        var dy = Math.abs( y1 - y0 )
        return dy + Math.max(  0, ( Math.abs( x1 - x0 ) - dy ) / 2 )
    },
    '8': function( x0, y0, x1, y1 ) {
        return Math.max( Math.abs( x1 - x0), Math.abs( y1 - y0 ) )
    }
}[ TOPOLOGY ]

const CIRCLE_COUNTFACTOR = {
    '4': 1,
    '6': 1,
    '8': 2
}[ TOPOLOGY ]

const CIRCLE_STARTOFFSET = {
    '4': [ 0, 1 ],
    '6': [ -1, 1 ],
    '8': [ -1, 1 ]
}[ TOPOLOGY ]

const CIRCLE_DIRS = {
    '4': [ [-1, -1], [ 1, -1], [ 1,  1], [-1,  1] ],
    '6': [ [-1, -1], [ 1, -1], [ 2,  0], [ 1,  1], [-1,  1], [-2,  0] ],
    '8': [ [ 0, -1], [ 1,  0], [ 0,  1], [-1,  0] ]
}[ TOPOLOGY ]
 



/**
 * Returns the first Tile on an A* path.
 */
function nextTileOnPath( fromX, fromY, toX, toY, passable ) {
    var queue = []
    var id = toX + ',' + toY
    var visited = { id: insert( queue, fromX, fromY, toX, toY, null ) }
    while ( queue.length ) {
        var item = queue.shift()
        if ( item.x === fromX && item.y === fromY ) break
        for ( var i = 0; i < DIRS.length; i++ ) {
            var dir = DIRS[ i ]
            var x = item.x + dir.x
            var y = item.y + dir.y
            if ( ! passable( x, y ) ) continue
            id = x + ',' + y
            if ( id in visited ) continue
            visited[ id ] = insert( queue, fromX, fromY, x, y, item )
        }
    }
    var item = visited[ fromX + ',' + fromY ]
    if ( ! item || ! item.prev ) return
    return item.prev
}

function insert( queue, x0, y0, x1, y1, prev ) {
    var h = DISTANCE( x0, y0, x1, y1 )
    var obj = {
        x: x1,
        y: y1,
        prev: prev,
        g: ( prev ? prev.g + 1 : 0 ),
        h: h
    }
    var f = obj.g + obj.h
    for ( var i = 0; i < queue.length; i++ ) {
        var item = queue[ i ]
        var itemF = item.g + item.h
        if ( f < itemF || ( f === itemF && h < item.h ) ) {
            queue.splice( i, 0, obj )
            return obj
        }
    }
    queue.push( obj )
    return obj
}

/**
 * Calculates visibility.
 * @param {Tile} startTile The starting Tile
 * @param {int} row The row to render
 * @param {float} visSlopeStart The slope to start at
 * @param {float} visSlopeEnd The slope to end at
 * @param {int} radius The radius to reach out to
 * @param {int} xx 
 * @param {int} xy 
 * @param {int} yx 
 * @param {int} yy 
 */
function castVisibility( startTile, row, visSlopeStart, visSlopeEnd, radius, xx, xy, yx, yy ) {

    for( var i = row; i <= radius; i++ ) {

        var dx = -i - 1
        var dy = -i
        var blocked = false
        var newStart = 0

        // 'Row' could be column, names here assume octant 0 and would be flipped for half the octants
        while ( dx <= 0 ) {
            dx += 1

            // Translate from relative coordinates to map coordinates
            var mapX = startTile.x + dx * xx + dy * xy
            var mapY = startTile.y + dx * yx + dy * yy

            var tile = getTile( mapX, mapY )

            // Reaching the edge of the map means we can stop
            if ( ! tile ) return
 
            // Range of the row
            var slopeStart = ( dx - 0.5 ) / ( dy + 0.5 )
            var slopeEnd = ( dx + 0.5 ) / ( dy - 0.5 )
        
            // Ignore if not yet at left edge of Octant
            if ( slopeEnd > visSlopeStart ) continue
            
            // Done if past right edge
            if ( slopeStart < visSlopeEnd ) break
            	
            // If it's in range, it's visible
            if ( (dx * dx + dy * dy ) < ( radius * radius ) ) {
                tile.fov = true
                tile.fow = false
                tile.r = tile.g = tile.b = 1.5
                fovtiles.push( tile )
            }

            var visible = contains( tile, treeglyphs ) ? length( subtract( tile, startTile ) ) <= 0.5 : ! contains( tile, blocksfov )
    
            if ( blocked ) {
            	// Keep narrowing if scanning across a block
            	if( ! visible ) {
            		newStart = slopeEnd
            		continue
            	}
            	// Block has ended
            	blocked = false
            	visSlopeStart = newStart
 
            } else {
            	// If tile is a blocking tile, cast around it
            	if ( ! visible && i < radius ) {
            		blocked = true
                    if ( visSlopeStart >= visSlopeEnd ) {
            		    castVisibility( startTile, i + 1, visSlopeStart, slopeStart, radius, xx, xy, yx, yy )
                    }
            		newStart = slopeEnd
            	}
 
            }
        }
        if ( blocked ) break
    }
}



const sunrise = { r: 282 / 255.0, g: 226 / 255.0, b: 191 / 255.0 }
const noon = { r: 292 / 255.0, g: 291 / 255.0, b: 273 / 255.0 }
const clouds = { r: 289 / 255.0, g: 290 / 255.0, b: 292 / 255.0 }
const overcast = { r: 274 / 255.0, g: 283 / 255.0, b: 290 / 255.0 }

const sun = noon


const map = []
map.width = 200
map.height = 200

const actors = []
const centre = { x: 0, y: 0 }

function Glyph( ch, name, r, g, b ) {
    return {
        ch: ch,
        name: name,
        r: r / 255.0,
        g: g / 255.0,
        b: b / 255.0
    }
}

const glyphs = {
    VOID: Glyph( ' ', 'void', 0, 0, 0 ),
    PC: Glyph( '@', 'you', 245, 3, 255 ),
    CORPSE: Glyph( '☠', 'corpse', 200, 150, 150 ),
    GRASS1: Glyph( ';', 'tall grass', 46, 100, 0 ),
    GRASS2: Glyph( "'", 'short grass', 56, 100, 0 ),
    GRASS3: Glyph( '"', 'thick grass', 60, 100, 0 ),
    PAVING: Glyph( '⬛', 'paving', 40, 40, 40 ),
    WALL: Glyph( '#', 'wall', 164, 164, 164 ),
    WATER: Glyph( "〜", 'water', 120, 154, 235 ),
    TREE1: Glyph( '♠', 'tree', 0, 25, 0 ),
    TREE2: Glyph( '♣', 'tree', 0, 40, 0 ),
    RAT: Glyph( 'r', 'rat', 150, 150, 150 ),
    TIGER: Glyph( 't', 'tiger', 200, 200, 0 ),
    HEALINGPOTION: Glyph( '!', 'healing potion', 255, 60, 60 ),
}

const draw_outof_fov = []
const grassglyphs = [ glyphs.GRASS1, glyphs.GRASS2, glyphs.GRASS3 ]
const treeglyphs = [ glyphs.TREE1, glyphs.TREE2 ]
const blocksfov = [ glyphs.VOID, glyphs.WALL ]
Array.prototype.push.apply( blocksfov, treeglyphs )
Array.prototype.push.apply( draw_outof_fov, treeglyphs )
const monsterglyphs = [ glyphs.RAT, glyphs.TIGER ]
const blocksmove = [ glyphs.VOID, glyphs.WALL ]
const blocksactorpath = []
const blockspcpath = []
Array.prototype.push.apply( blocksactorpath, blocksmove )
Array.prototype.push.apply( blockspcpath, blocksmove )
Array.prototype.push.apply( blockspcpath, monsterglyphs )
Array.prototype.push.apply( blocksmove, monsterglyphs )

const ui = {}

function E( tag, attribs, contents ) {
    var element = document.createElement( tag )
    for ( var name in attribs ) {
        if ( name === 'class' ) {
            element.className = attribs[ name ]
        } else if ( name === 'style' ) {
            element.style = attribs[ name ]
        } else {
            element.setAttribute[ name ] = attribs[ name ]
        }
    }
    if ( typeof contents !== 'undefined' ) {
        if ( contents.constructor !== Array ) contents = [ contents ]
        for ( var i = 0; i < contents.length; i++ ) {
            var content = contents[ i ]
            if ( typeof content === 'undefined' ) continue
            var node = ( content instanceof HTMLElement ) ? content : document.createTextNode( content )
            element.appendChild( node )
        }
    }
    return element
}

const style = document.createElement( 'style' )
document.head.appendChild( style )

function css( text ) {
    style.textContent += text
}

css( '.ui { position: absolute; z-index: 1; overflow: hidden; background: #111; border: 1px solid #464; }' )
css( '.item { font-size: 200%; min-width: 1em; background: #000; }' )
css( '.focuseditem { background: #00f; }' )


ui.log = document.body.appendChild( E( 'div', { class: 'ui', style: 'left: 1%; bottom: 1%; width: 50%; height: 15%;' } ) )

function log( msg, colour ) {
    while( ui.log.childNodes.length > 6 ) ui.log.removeChild( ui.log.childNodes[ 0 ] )
    var opacity = 1
    for ( var i = ui.log.childNodes.length; i--; ) ui.log.childNodes[ i ].style.opacity = '' + ( opacity -= 0.2 )
    var entry = document.createElement( 'div' )
    entry.style.color = colour ? colour: 'white'
    entry.innerHTML = msg
    ui.log.appendChild( entry )
    entry.scrollIntoView()
}

log( 'r/roguelikedev does the complete roguelike tutorial' )
log( 'Week 6 - Part 8: Items and inventory', 'yellow' )

ui.targetinfo = document.body.appendChild( E( 'div', { class: 'ui', style: 'top: 1%; left: 1%; width: 50%; height: 1.5em; color: white;' } ) )
ui.healthlbl = E( 'div', { class: 'ui', style: 'bottom: 0; width: 100%; height: 1em; color: white; font-size: 10pt; z-index: 2;' } )
ui.healthloss = E( 'div', { class: 'ui', style: 'top: 0; width: 100%; height: 10%; color: red;' }, '░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░' )
ui.healthbar = document.body.appendChild( E( 'div', { class: 'ui', style: 'right: 1%; bottom: 1%; width: 1em; height: 15%; color: green; font-size: 80pt; text-align: center;' }, [ '░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░', ui.healthlbl, ui.healthloss ] ) )

function updateui() {
    ui.healthlbl.textContent = health( pc )
    ui.healthloss.style.height = Math.round( 100 * ( pc.fighter.maxhealth - pc.fighter.health ) / pc.fighter.maxhealth ) + '%'
    var tile = getTile( minx + mouse.x, miny + mouse.y )
    if ( ! tile ) return
    var targetmsg = tile.fow ? '' : tile.glyph.name
    if ( ! tile.fow ) {
        var things = tile.things
        for ( var i = things.length; i--; ) targetmsg += ', ' + things[ i ].glyph.name
    }
    ui.targetinfo.textContent = '👁 ' + targetmsg
}

ui.inventory = ( function() {
    var tbody = E( 'tbody' )
    var div = document.body.appendChild( E( 'div', {
            id: 'inventory',
            class: 'ui',
            style: 'right: 0; top: 0; bottom: 0; display: none;'
        },
        [ E( 'table', {}, tbody ) ]
    ) )
    for ( var r = 0; r < 5; r++ ) {
        var row = E( 'tr' )
        for ( var c = 0; c < 10; c++ ) {
            var cell = E( 'td' )
            cell.className = 'item'
            row.appendChild( cell )
        }
        tbody.appendChild( row )
    }
    return div
} )()

function showInventory() {
    ui.inventory.style.display = 'block'
}

function closeInventory() {
    ui.inventory.style.display = 'none'
}

ui.items = document.body.appendChild( E( 'div', {
    id: 'items',
    class: 'ui',
    style: 'left: 0; top: 0; bottom: 0; display: none;'
} ) )

function deposit( inventory, item ) {
    if ( inventory.limit !== -1 & inventory.limit <= inventory.items.length ) return
    inventory.items.push( item )
}

function withdraw( inventory, item ) {
    var i = inventory.items.indexOf( item )
    if ( i > -1 ) inventory.items.splice( i, 1 )
}

const shownItems = []
const shownItemsCols = 10
var shownItemFocus = null
var shownItemFocusDescription = null 

function showItems( items ) {
    var cols = Math.min( shownItemsCols, Math.max( shownItemsCols, Math.sqrt( items.length ) ) )
    var rows = Math.min( 15, Math.max( 15, Math.sqrt( items.length ) ) )
    var index = 0
    shownItems.length = 0
    shownItemFocus = null
    var table = document.createElement( 'table' )
    var tbody = document.createElement( 'tbody' )
    table.appendChild( tbody )
    for ( var row = 0; row < rows; row++ ) {
        var tr = document.createElement( 'tr' )
        for ( var col = 0; col < cols; col++ ) {
            var td = document.createElement( 'td' )
            td.innerHTML = ( index < items.length ) ? items[ index ].glyph.ch : '&nbsp;'
            td.className = 'item'
            tr.appendChild( td )
            shownItems.push( { td: td, item: items[ index ], row: row, col: col } )
            index++
        }
        tbody.appendChild( tr )
    } 
    ui.items.innerHTML = ''
    ui.items.appendChild( table )
    ui.items.style.display = 'block'
    moveItemFocus( 0, 0 )
}

function closeItems() {
    ui.items.style.display = 'none'
    if ( shownItemFocusDescription ) shownItemFocusDescription.style.display = 'none'
}

function moveItemFocus( col, row ) {
    var index = row * shownItemsCols + col
    if ( index < 0 || index >= shownItems.length ) return
    if ( shownItemFocus ) shownItemFocus.td.classList.remove( 'focuseditem' )
    shownItemFocus = shownItems[ index ]
    shownItemFocus.td.classList.add( 'focuseditem' )

    if ( ! shownItemFocusDescription ) {
        shownItemFocusDescription = document.body.appendChild( E( 'div', {
            class: 'ui',
            style: 'background: black; border: 1px solid #666; padding: 3px;'
        } ) )
    }
    if ( ! shownItemFocus.item ) {
        shownItemFocusDescription.style.display = 'none'
    } else {
        var td = shownItemFocus.td
        var style = shownItemFocusDescription.style
        style.left = ( td.offsetLeft + td.offsetWidth ) + 'px'
        style.top = ( td.offsetTop + 6 ) + 'px'
        shownItemFocusDescription.innerHTML = shownItemFocus.item.glyph.name
        style.display = 'block'
    }
}

function moveItemFocusUp() {
    moveItemFocus( shownItemFocus.col, shownItemFocus.row - 1 )
}

function moveItemFocusDown() {
    moveItemFocus( shownItemFocus.col, shownItemFocus.row + 1 )
}

function moveItemFocusLeft() {
    moveItemFocus( shownItemFocus.col - 1, shownItemFocus.row )
}

function moveItemFocusRight() {
    moveItemFocus( shownItemFocus.col + 1, shownItemFocus.row )
}

function Tile( glyph, x, y ) {
    return {
        glyph: glyph,
        r: 0.1,
        g: 0.1,
        b: 0.1,
        x: x,
        y: y,
        things: [],
        fov: false,
        fow: true,
    }
}

function Thing( glyph, x, y, z, components ) {
    var thing = Object.assign( {}, components )
    thing.glyph = glyph
    thing.tile = getTile( x, y )
    thing.z = z
    return thing
}

function Fighter( health, defense, power ) {
    return {
        health: health,
        maxhealth: health,
        defense: defense,
        power: power
    }
}

function Item( weight ) {
    return {
        weight: weight
    }
}

function Actor( glyph, x, y, z, components ) {
    var actor = Thing( glyph, x, y, z, components )
    actors.push( actor )
    return actor
}

function act() {
    var moved = []
    for ( var i = fovtiles.length; i--; ) {
        var tile = fovtiles[ i ]
        var things = tile.things
        for ( var t = things.length; t--; ) {
            var thing = things[ t ]
            if ( moved.indexOf( thing ) > -1 ) continue
            if ( actors.indexOf( thing ) > -1 ) {
                var path = nextTileOnPath( tile.x, tile.y, pc.tile.x, pc.tile.y, actorpathfind )
                if ( path ) moveto( thing, path.x, path.y )
                moved.push( thing )
            }
        }
    }
}

for ( var y = map.height; y--; ) {
    for ( var x = map.width; x--; ) {
        map[ y * map.width + x ] = Tile( glyphs.VOID, x, y )
    }
}

function getTile( x, y ) {
    if ( x < 0 || y < 0 || x >= map.width || y >= map.height ) return null
    return map[ y * map.width + x ]
}

function contains( tile, glyphlist ) {
    if ( ! tile ) return null
    if ( glyphlist.indexOf( tile.glyph ) > -1 ) return tile.glyph
    var things = tile.things
    for ( var i = things.length; i--; ) {
        if ( glyphlist.indexOf( things[ i ].glyph ) > -1 ) return things[ i ].glyph
    }
    return null
}

function push( thing, tile ) {
    pop( thing )
    thing.tile = tile
    var things = tile.things
    var i = things.indexOf( thing )
    if ( i > -1 ) return
    things.splice( sortedIndex( things, thing.z ), 0, thing )
}

function pop( thing ) {
    if ( ! thing.tile ) return null
    var things = thing.tile.things
    var i = things.indexOf( thing )
    if ( i > -1 ) things.splice( i, 1 )
    thing.tile = null
}

function sortedIndex( things, z ) {
    var low = 0
    var high = things.length
    while ( low < high ) {
        var mid = ( low + high ) >>> 1
        if ( things[ mid ].z > z ) low = mid + 1
        else high = mid
    }
    return low
}

function moveto( thing, x, y ) {
    var to = getTile( x, y )
    if ( to ) {
        if ( blocksmove.indexOf( to.glyph ) > -1 ) return
        var things = to.things
        for ( var i = things.length; i--; ) {
        	var to_thing = things[ i ]
        	if ( ( thing === pc && monsterglyphs.indexOf( to_thing.glyph ) > -1 ) || to_thing == pc ) {
        		attack( thing, to_thing )
        		return
        	}
        	if ( blocksmove.indexOf( to_thing.glyph ) > -1 ) return
        }
        push( thing, to )
    }
}

function randomTile( thing /*, ([Glyph,...]|Glyph,Glyph,...)*/ ) {
    var exceptions = []
    for ( var i = 1; i < arguments.length; i++ ) {
        var argument = arguments[ i ]
        if ( typeof argument === 'undefined' ) continue
        if ( argument.constructor === Array ) Array.prototype.push.apply( exceptions, argument )
        else exceptions.push( argument )
    }
    var tile
    do {
        tile = getTile( rngUniformInt( 0, map.width - 1 ), rngUniformInt( 0, map.height - 1 ) )
    } while ( contains( tile, exceptions ) )
    return tile
}

function subtract( xy0, xy1 ) {
    return { x: xy1.x - xy0.x, y: xy1.y - xy0.y }
}

function length( xy ) {
    return Math.sqrt( xy.x * xy.x + xy.y * xy.y )
}

function unit( xy ) {
    var len = length( xy )
    return { x: xy.x / len, y: xy.y / len }
}

function actorpathfind( x, y ) {
    var tile = getTile( x, y )
    if ( ! tile ) return false
    if ( fovtiles.indexOf( tile ) === -1 ) return false
    return ! contains( tile, blocksactorpath )
}

function pcpathfind( x, y ) {
    var tile = getTile( x, y )
    if ( ! tile ) return false
    return ! contains( tile, blockspcpath )
}

function health( thing ) {
    if ( ! thing.fighter ) return 'n/a'
    return '' + thing.fighter.health + '/' + thing.fighter.maxhealth
}

function attack( thing, target ) {
    if ( ! thing.fighter || ! target.fighter ) return
    var damage = thing.fighter.power - target.fighter.defense
    if ( damage > 0 ) {
        log( thing.glyph.name + ' hits ' + target.glyph.name + ' for -' + damage, target === pc ? 'red' : 'white' )
        target.fighter.health -= damage
    } else {
        log( thing.glyph.name + ' attacks ' + target.glyph.name + ' but fails to do damage' )
    }
    if ( target !== pc && target.fighter.health <= 0 ) killed( thing, target )
}

function killed( thing, target ) {
    log( ( thing === pc ? 'you  kill ' : thing.glyph.name + ' kills ' ) + ' a ' + target.glyph.name, thing === pc ? 'green' : 'white' )
    target.glyph = glyphs.CORPSE
    delete target.fighter
    target.item = Item( 0 )
    var i = actors.indexOf( target )
    if ( i > -1 ) actors.splice( i, 1 )
}

const drawinfo = [ 0/*x*/, 1/*y*/, 2/*ch*/, 3/*colour*/ ]

const fovtiles = []

function fov() {
    for ( var i = fovtiles.length; i--; ) fovtiles[ i ].fov = false
    fovtiles.length = 0
    var tile = pc.tile
    tile.fov = true
    tile.fow = false
    tile.r = tile.g = tile.b = 1.5
    fovtiles.push( tile )
    castVisibility( tile, 1, 1.0, 0.0, visibility, -1,  0,  0,  1 )
    castVisibility( tile, 1, 1.0, 0.0, visibility,  0, -1,  1,  0 )
    castVisibility( tile, 1, 1.0, 0.0, visibility,  0, -1, -1,  0 )
    castVisibility( tile, 1, 1.0, 0.0, visibility, -1,  0,  0, -1 )
    castVisibility( tile, 1, 1.0, 0.0, visibility,  1,  0,  0, -1 )
    castVisibility( tile, 1, 1.0, 0.0, visibility,  0,  1, -1,  0 )
    castVisibility( tile, 1, 1.0, 0.0, visibility,  0,  1,  1,  0 )
    castVisibility( tile, 1, 1.0, 0.0, visibility,  1,  0,  0,  1 )
}


var minx
var miny


const display = {
    fontsize: 30,
    spacing: 0.8,
}
display.canvas = document.createElement( 'canvas' ),
display.canvas.style.position = 'absolute'
display.canvas.style.width = display.canvas.style.height = '100%'
document.body.appendChild( display.canvas )

var visibility = 1

function fit() {
    display.canvas.width = window.innerWidth
    display.canvas.height = window.innerHeight
    display.rect = display.canvas.getBoundingClientRect()
    display.ctx = display.canvas.getContext( '2d' )
    display.ctx.font = display.fontsize + 'px monospace'
    display.ctx.textAlign = 'center'
    display.ctx.textBaseline = 'middle'
    display.spacingX = Math.ceil( display.spacing * Math.ceil( display.ctx.measureText( '▔' ).width ) )
    display.spacingY = Math.ceil( display.spacing * display.fontsize )
    display.spacingX = display.spacingY = Math.max( display.spacingX, display.spacingY )
    display.width = Math.ceil( display.canvas.width / display.spacingX )
    display.height = Math.ceil( display.canvas.height / display.spacingY )
    display.centreX = Math.floor( display.width * 0.5 )
    display.centreY = Math.floor( display.height * 0.5 )
    visibility = Math.max( display.centreX, display.centreY )
}

function show( scene ) {
    function ready() {
        fit()
        ;( function ( timeout, blocked ) {
            var handler = function() {
                blocked = timeout
                timeout || ( fit(), render(), timeout = setTimeout( function() {
                	timeout = null
                	blocked && handler()
                }, 500 ) )
            }
            window.addEventListener( 'resize', handler )
        } )()
        if ( scene.ready ) scene.ready( scene )
        document.addEventListener( 'mousemove', mousemove )
        if ( scene.update ) scene.update( scene )
    }
    if ( scene.assets && Object.getOwnPropertyNames( scene.assets ).length > 0 ) {
        var remaining = Object.getOwnPropertyNames( scene.assets ).length
        for ( var name in scene.assets ) {
            ;( function ( name ) {
            	var src = scene.assets[ name ]
            	var image = scene.assets[ name ] = new Image()
            	image.onload = function() { if ( ! --remaining ) ready() }
            	image.src = src
            } )( name )
        }
    } else {
        ready()
    }
}

function render() {
    minx = Math.min( Math.max( pc.tile.x - display.centreX, 0 ), map.width - display.width )
    miny = Math.min( Math.max( pc.tile.y - display.centreY, 0 ), map.height - display.height )

    fov()

    display.ctx.clearRect( 0, 0, window.innerWidth, window.innerHeight )
    var endx = minx + display.width
    var endy = miny + display.height
    var y = miny
    while ( y < endy ) {
        drawinfo[ 1 ] = ( y - miny )
        var ctxy = Math.floor( ( y - miny + 0.5 ) * display.spacingY )
        var x = minx
        while ( x < endx ) {
        	var tile = getTile( x, y )
        	var ctxx = Math.floor( ( x - minx + 0.5 ) * display.spacingX )
       	//if ( ! tile.fow ) {
        		var glyph = tile.glyph
 
        		display.ctx.fillStyle = rgb( glyph.r * tile.r * sun.r * 0.1, glyph.g * tile.g * sun.g * 0.1, glyph.b * tile.b * sun.b * 0.1 )
        		display.ctx.fillRect( Math.floor( ctxx - display.spacingX * 0.5 ), Math.floor( ctxy - display.spacingY * 0.5 ), display.spacingX, display.spacingY )
        		display.ctx.fillStyle = rgb( glyph.r * tile.r * sun.r, glyph.g * tile.g * sun.g, glyph.b * tile.b * sun.b )
                display.ctx.fillText( glyph.ch, ctxx, ctxy )
            if ( ! tile.fow ) {
        			var things = tile.things
        			for ( var i = things.length; i--; ) {
        				var thing = things[ i ]
        				glyph = thing.glyph
                        if ( ! glyph ) console.log( thing )
                        if ( tile.fov || draw_outof_fov.indexOf( glyph ) > -1 ) {
                            display.ctx.fillStyle = rgb( glyph.r * tile.r * sun.r, glyph.g * tile.g * sun.g, glyph.b * tile.b * sun.b )
                            display.ctx.fillText( glyph.ch, ctxx, ctxy )
                        }
        			}
        	}
        	if ( tile.fow || ! tile.fov ) {
        		display.ctx.fillStyle = fowstyle
        		display.ctx.fillRect( Math.floor( ctxx - display.spacingX * 0.5 ), Math.floor( ctxy - display.spacingY * 0.5 ), display.spacingX, display.spacingY )
        	}
        	x++
        }
        y++
    }
}

const perfs = {}

function perf( name, from ) {
    var p = perfs[ name ] = perfs.hasOwnProperty( name ) ? perfs[ name ] : []
    p.push( performance.now() - from )
    if ( p.length === 10 ) {
        var sum = 0
        for ( var i = p.length; i--; ) sum += p[ i ]
        console.log( name + ': ' + sum )
        p.length = 0
    }
}

function lighting() {
    var width = display.canvas.width
    var imagedata = display.ctx.getImageData( 0, 0, width, display.canvas.height )
    var data = imagedata.data
    for ( var i = fovtiles.length; i--; ) {
        var tile = fovtiles[ i ]
        var ctxx = ( tile.x - minx ) * display.spacingX
        var ctxy = ( tile.y - miny ) * display.spacingY
        for ( var y = ctxy + display.spacingY; y >= ctxy; y-- ) {
        	for ( var x = ctxx + display.spacingX; x >= ctxx; x-- ) {
        		var d = ( y * width + x ) * 4
        		data[ d ] = Math.min( 255, Math.max( 0, Math.round( data[ d ] * ( sun.r * tile.r ) ) ) )
        		d++
        		data[ d ] = Math.min( 255, Math.max( 0, Math.round( data[ d ] * ( sun.g * tile.g ) ) ) )
        		d++
        		data[ d ] = Math.min( 255, Math.max( 0, Math.round( data[ d ] * ( sun.b * tile.b ) ) ) )
        	}
        }
    }
    display.ctx.putImageData( imagedata, 0, 0 )
}

function rgb( r, g, b ) {
    return 'rgb( ' + Math.min( 255, Math.max( 0, Math.round( r * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( g * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( b * 255 ) ) ) + ' )'
}

const actions = {
    NONE: 0,
    NORTH: 1,
    SOUTH: 2,
    WEST: 3,
    EAST: 4,
    NORTHWEST: 5,
    NORTHEAST: 6,
    SOUTHWEST: 7,
    SOUTHEAST: 8,
    PATHTO: { x: 0, y: 0 },
    SKIPTURN: 9,
    PICKITEMS: 10,
    SHOWINVENTORY: 11
}

function input( resolve ) {
    input.resolve = function ( action ) {
        var endturn = false
        var x = pc.tile.x
        var y = pc.tile.y
        if ( action === actions.SKIPTURN ) {
            endturn = true
        } else if ( action === actions.PATHTO ) {
            x = action.x
            y = action.y
            endturn = true
        } else if ( action === actions.PICKITEMS ) {
            showItems( itemsAt( x, y ) ) 
        } else if ( action === actions.SHOWINVENTORY ) {
            showInventory() 
        } else {
            if ( action === actions.NORTH || action == actions.NORTHWEST || action === actions.NORTHEAST ) y--
            if ( action === actions.SOUTH || action == actions.SOUTHWEST || action === actions.SOUTHEAST ) y++
            if ( action === actions.WEST || action == actions.NORTHWEST || action === actions.SOUTHWEST ) x--
            if ( action === actions.EAST || action == actions.NORTHEAST || action === actions.SOUTHEAST ) x++
        }
        if ( x !== pc.tile.x || y !== pc.tile.y ) {
            var path = nextTileOnPath( pc.tile.x, pc.tile.y, x, y, pcpathfind )
            if ( path ) moveto( pc, path.x, path.y )
            endturn = true
        }
        if ( endturn ) {
            document.removeEventListener( 'keydown', keydown )
            document.removeEventListener( 'mousedown', mousedown )
        	resolve()
       }
    }
    document.addEventListener( 'keydown', keydown )
    document.addEventListener( 'mousedown', mousedown )
}

const mouse = { x: 0, y: 0, clientX: 0, clientY: 0 }

function mousemove( event ) {
    var x = event.clientX
    var y = event.clientY
    x -= display.rect.left
    y -= display.rect.top
    x *= display.canvas.width / display.canvas.clientWidth
    y *= display.canvas.height / display.canvas.clientHeight
    if ( x < 0 || y < 0 || x >= display.canvas.width || y >= display.canvas.height ) return
    mouse.x = Math.floor( x / display.spacingX  )
    mouse.y = Math.floor( y / display.spacingY )
    updateui()
}



function mousedown( event ) {
    var action = actions.PATHTO
    action.x = minx + mouse.x
    action.y = miny + mouse.y
    input.resolve( action )
}

function keydown( event ) {
    if ( event.altKey || event.metaKey ) return
    var key = event.key

    if ( ui.items.style.display === 'block' || ui.inventory.style.display === 'block' ) {
        if ( key === 'Escape' ) {
            closeItems()
            closeInventory()
        } else if ( [ 'ArrowUp', 'k' ].indexOf( key ) > - 1 ) {
            moveItemFocusUp()
        } else if ( [ 'ArrowDown', 'j' ].indexOf( key ) > - 1 ) {
            moveItemFocusDown()
        } else if ( [ 'ArrowRight', 'l' ].indexOf( key ) > - 1 ) {
            moveItemFocusRight()
        } else if ( [ 'ArrowLeft', 'h' ].indexOf( key ) > - 1 ) {
            moveItemFocusLeft()
        } else if ( key === 'g' ) {
            closeItems()
            if ( shownItemFocus && shownItemFocus.item ) {
                pickup( shownItemFocus.item )
            }
            shownItemFocus = null
        } else if ( key === 'i' ) {
            closeInventory()
        }

        return
    }

    var action = actions.NONE
    if ( key === '.' ) {
        action = actions.SKIPTURN
    } else if ( key === ' ' ) {
        action = actions.PATHTO
        action.x = minx + mouse.x
        action.y = miny + mouse.y
    } else if ( key === 'g' ) {
        action = actions.PICKITEMS
    } else if ( key === 'i' ) {
        action = actions.SHOWINVENTORY
    } else if ( [ 'ArrowUp', 'k' ].indexOf( key ) > - 1) {
        action = event.shiftKey ? actions.NORTHEAST : actions.NORTH
    } else if ( [ 'K' ].indexOf( key ) > - 1) {
        action = actions.NORTHEAST
    } else if ( [ 'ArrowDown', 'j' ].indexOf( key ) > - 1) {
        action = event.shiftKey ? actions.SOUTHWEST : actions.SOUTH
    } else if ( [ 'J' ].indexOf( key ) > - 1) {
        action = actions.NORTHWEST
    } else if ( [ 'ArrowRight', 'l' ].indexOf( key ) > - 1) {
        action = event.shiftKey ? actions.SOUTHEAST: actions.EAST
    } else if ( [ 'L' ].indexOf( key ) > - 1) {
        action = actions.SOUTHEAST
    } else if ( [ 'ArrowLeft', 'h' ].indexOf( key ) > - 1) {
        action = event.shiftKey ? actions.NORTHWEST: actions.WEST
    } else if ( [ 'H' ].indexOf( key ) > - 1) {
        action = actions.SOUTHWEST
    }
    input.resolve( action )
}

function line( x0, y0, x1, y1, callback ) {
    var dx = Math.abs( x1 - x0 ), sx = x0 < x1 ? 1 : -1
    var dy = Math.abs( y1 - y0 ), sy = y0 < y1 ? 1 : -1
    var err = ( dx > dy ? dx : -dy) / 2
    while ( true ) {
        callback( x0, y0 )
        if ( x0 === x1 && y0 === y1 ) break
        var e2 = err
        if ( e2 > -dx ) { err -= dy; x0 += sx; }
        if ( e2 < dy ) { err += dx; y0 += sy; }
    }
}

function area( x0, y0, x1, y1, callback ) {
    var sx = x0 < x1 ? 1 : -1
    var sy = y0 < y1 ? 1 : -1
    var x = x0
    while ( true ) {
        callback( x, y0 )
        if ( x === x1 && y0 === y1 ) break
        if ( x === x1 ) { x = x0; y0 += sy; }
        else { x += sx; }
    }
}

function grass_and_trees( x0, y0, x1, y1 ) {
    area( x0, y0, x1, y1, function( x, y ) {
        var tile = getTile( x, y )
        var high = noise( x, y )
        var low1 = noise( x * 0.05, y * 0.05 )
        var low2 = noise( ( x + 133 ) * 0.07, ( y - 261 ) * 0.07 )
        var n = ( low2 + 1 ) * 0.4 + ( low1 + 1 ) * 0.1
      	tile.glyph = grassglyphs[ Math.floor( n * grassglyphs.length ) ]
       	if ( n * high > 0.3 ) tile.glyph = grassglyphs[ 0 ]
        if ( low1 > - 0.8 && low2 < 0 ) {
            push( Thing( treeglyphs[ Math.floor( ( high + 1 ) * 0.5 * treeglyphs.length ) ], 0, 0, 0 ), tile )
        }
    } )
}

grass_and_trees( 0, 0, map.height - 1, map.width - 1 )

const pc = Thing( glyphs.PC, 0, 0, 0, { fighter: Fighter( 100, 10, 40 ) } )
push( pc, randomTile( blocksmove, blocksfov ) )

for ( var i = 300; i--; ) {
    var glyph = monsterglyphs[ rngUniformInt( 0, monsterglyphs.length - 1 ) ]
    push( Actor( glyph, 0, 0, 0, { fighter: Fighter( glyph === glyphs.RAT ? 50 : 100, 10, glyph === glyphs.RAT ? 12 : 18 ) } ), randomTile( blocksmove ) )
}

for ( var i = 200; i--; ) {
    push( Thing( glyphs.HEALINGPOTION, 1, 1, 1, { item: Item( 0 ) } ), randomTile( blocksmove ) )
}

const inventory = []
inventory.limit = 10

function pickup( thing ) {
    if ( ! thing.item ) {
        log( thing.glyph.name + ' cannot be picked up', 'red' )
        return
    }
    if ( inventory.length >= inventory.limit ) {
        log( 'your inventory is full, cannot pick up ' + thing.glyph.name, 'red' )
    } else {
        pop( thing )
        inventory.push( thing )
        log( 'you picked up a ' + thing.glyph.name, 'green' )
    }
}

function itemsAt( x, y ) {
    var items = []
    var tile = getTile( x, y )
    if ( ! tile.fov ) return items
    var things = tile.things
    for ( var i = things.length; i--; ) {
        var thing = things[ i ]
        if ( thing.item ) items.push( thing )
    }
    return items
}

var fowstyle

function update( scene ) {
    act()
    render()
    updateui()
    input( function() { setTimeout( update, 0 ) } )
}

const scene = {
    assets: {
        fowimg: "assets/fov.png"
    },
    ready: function( scene ) {
        fowstyle = display.ctx.createPattern( scene.assets.fowimg, 'repeat' )
    },
    update: update
}

show( scene )

