import { ROT } from './rot'

var options = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 30,
    spacing: 1.2,
}

const sunrise = { r: 182 / 255.0, g: 126 / 255.0, b: 91 / 255.0 }
const noon = { r: 192 / 255.0, g: 191 / 255.0, b: 173 / 255.0 }
const clouds = { r: 189 / 255.0, g: 190 / 255.0, b: 192 / 255.0 }
const overcast = { r: 174 / 255.0, g: 183 / 255.0, b: 190 / 255.0 }

const sun = noon

const num_monsters = 400

const map = []
map.width = 200
map.height = 200
map.centre = { x: map.width * 0.5 , y: map.height * 0.5 }

const actors = []
const centre = { x: 0, y: 0 }
const spacing = { x: 0, y: 0 }
const noise = new ROT.Noise.Simplex()

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
    PC: Glyph( '👤', 'player', 245, 3, 255 ),
    VOID: Glyph( ' ', 'void', 0, 0, 0 ),
    GRASS1: Glyph( ';', 'tall grass', 36, 100, 0 ),
    GRASS2: Glyph( "'", 'short grass', 36, 80, 0 ),
    GRASS3: Glyph( '"', 'thick grass', 60, 100, 0 ),
    PAVING: Glyph( '⬛', 'paving', 40, 40, 40 ),
    WALL: Glyph( '⏹', 'wall', 164, 164, 164 ),
    WATER: Glyph( "〜", 'water', 120, 154, 235 ),
    TREE: Glyph( '🌳', 'tree', 36, 120, 0 ),
    RAT: Glyph( '🐀', 'rat', 56, 100, 0 ),
    TIGER: Glyph( '🐅', 'tiger', 36, 80, 0 ),
}

const grassglyphs = [ glyphs.GRASS1, glyphs.GRASS2, glyphs.GRASS3 ]

const blocksfov = [ glyphs.VOID, glyphs.WALL, glyphs.TREE ]

const monsterglyphs = [ glyphs.RAT, glyphs.TIGER ]

const blocksmove = [ glyphs.PC, glyphs.NPC, glyphs.VOID, glyphs.WALL, glyphs.TREE ]

Array.prototype.push.apply( blocksmove, monsterglyphs )

const logdiv = document.getElementById( 'log' )

function log( msg ) {
    while( logdiv.childNodes.length > 6 ) {
        logdiv.removeChild( logdiv.childNodes[ 0 ] )
    }
    for ( var i = 0; i < logdiv.childNodes.length; i++ ) {
        logdiv.childNodes[ i ].style.opacity = ( ( i + 1 ) / logdiv.childNodes.length ) - 0.4
    }
    var entry = document.createElement( 'div' )
    entry.innerHTML = msg
    logdiv.appendChild( entry )
    entry.scrollIntoView()
}

log( 'r/roguelikedev does the complete roguelike tutorial' )
log( '&nbsp;' )
log( 'Week 4 - Part 5: Preparing for combat' )
log( '&nbsp;' )


function Tile( glyph, x, y ) {
    return {
    	glyph: glyph,
    	r: 0,
    	g: 0,
    	b: 0,
    	x: x,
    	y: y,
    	things: [],
        fov: false,
        fow: true,
    }
}

function Thing( type, glyph, x, y, z ) {
    return {
    	type: type,
    	glyph: glyph,
    	tile: gettile( x, y ),
    	z: z
    }
}

function Actor( glyph, x, y, z ) {
    var actor = Thing( Actor, glyph, x, y, z )
    actors.push( actor )
    return actor
}

function act( actor ) {
}

for ( var y = map.height; y--; ) {
    for ( var x = map.width; x--; ) {
    	map[ y * map.width + x ] = Tile( glyphs.VOID, x, y )
    }
}

function gettile( x, y ) {
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

function resort( tile ) {
    var things = tile.things
    var sorted = []
    for ( var i = things.length; i--; ) {
    	var thing = things[ i ]
    	sorted.splice( sortedIndex( sorted, thing.z ), 0, thing )
    }
    tile.things = sorted
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

const drawinfo = [ 0/*x*/, 1/*y*/, 2/*ch*/, 3/*colour*/ ]

function next() {
    for ( var i = actors.length; i--; ) act( actors[ i ] )
    render()
    input( function() { setTimeout( next, 0 ) } )
}

const fovtiles = []

const fov = new ROT.FOV.PreciseShadowcasting( function( x, y ) {
    return ! contains( gettile( x, y ), blocksfov )
} )

function render() {
    var focus = pc.tile

    for ( var i = fovtiles.length; i--; ) fovtiles[ i ].fov = false
    fovtiles.length = 0
    fov.compute( focus.x, focus.y, Math.max( centre.x, centre.y ), function( x, y ) {
        var tile = gettile( x, y )
        if ( ! tile ) return
        tile.fov = true
        tile.fow = false
        fovtiles.push( tile )
    } )
  
    display._backend._context.clearRect( 0, 0, window.innerWidth, window.innerHeight )

    var minx = Math.min( Math.max( focus.x - centre.x, 0 ), map.width - options.width )
    var miny = Math.min( Math.max( focus.y - centre.y, 0 ), map.height - options.height )
    var endx = minx + options.width
    var endy = miny + options.height

    var y = miny
    while ( y < endy ) {
    	drawinfo[ 1 ] = ( y - miny )
    	var x = minx
    	while ( x < endx ) {
    		drawinfo[ 0 ] = ( x - minx )
    		var tile = gettile( x, y )
            if ( ! tile.fow ) {
                var lit = { r: sun.r, g: sun.g, b: sun.b }
        		var glyph = tile.glyph
        		drawinfo[ 2 ] = glyph.ch
        		drawinfo[ 3 ] = rgb( glyph.r, glyph.g, glyph.b )
        		display._backend._drawNoCache( drawinfo )

                if ( tile.fov ) {
        		    var things = tile.things
        		    for ( var i = things.length; i--; ) {
        		    	var thing = things[ i ]
        		    	glyph = thing.glyph
        		    	drawinfo[ 2 ] = glyph.ch
        		    	drawinfo[ 3 ] = rgb( glyph.r, glyph.g, glyph.b )
        		    	display._backend._drawNoCache( drawinfo )
        		    }
                    lit.r += tile.r
                    lit.g += tile.g
                    lit.b += tile.b
                } else {
                    lit.r *= 0.3
                    lit.g *= 0.3
                    lit.b *= 0.3
                }
                var imageData = display._backend._context.getImageData( ( x - minx ) * spacing.x, ( y - miny ) * spacing.y, spacing.x, spacing.y )
                var data = imageData.data
                for ( var i = 0; i < data.length; i += 4 ) {
                    data[ i ]     = Math.min( 255, Math.max( 0, Math.round( data[ i ] * lit.r ) ) )
                    data[ i + 1 ] = Math.min( 255, Math.max( 0, Math.round( data[ i + 1 ] * lit.g ) ) )
                    data[ i + 2 ] = Math.min( 255, Math.max( 0, Math.round( data[ i + 2 ] * lit.b ) ) )
                }
                display._backend._context.putImageData( imageData, ( x - minx ) * spacing.x, ( y - miny ) * spacing.y )
            }
            if ( tile.fow || ! tile.fov ) {
                display._backend._context.fillStyle = fov_fillstyle
                display._backend._context.fillRect( ( x - minx ) * spacing.x, ( y - miny ) * spacing.y, spacing.x, spacing.y )
            } 
    		x++
    	}
    	y++
    }
}

function rgb( r, g, b ) {
    return 'rgb( ' + Math.min( 255, Math.max( 0, Math.round( r * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( g * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( b * 255 ) ) ) + ' )'
}

function rgba( r, g, b, a ) {
    return 'rgba( ' + Math.min( 255, Math.max( 0, Math.round( r * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( g * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( b * 255 ) ) ) + ', ' + Math.min( 1, Math.max( 0, a ) ) + ' )'
}

function fit() {
    options = display.getOptions()
    var size = display.computeSize( window.innerWidth, window.innerHeight )
    options.width = size[ 0 ]
    options.height = size[ 1 ]
    display.setOptions( options )
    display._dirty = false
    centre.x = Math.floor( options.width * 0.5 )
    centre.y = Math.floor( options.height * 0.5 )
    spacing.x = display._backend._spacingX
    spacing.y = display._backend._spacingY
    render()
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
    SOUTHEAST: 8
}

function input( resolve ) {
    input.resolve = function ( action ) {
    	var x = pc.tile.x
    	var y = pc.tile.y
    	if ( action === actions.NORTH || action == actions.NORTHWEST || action === actions.NORTHEAST ) y--
    	if ( action === actions.SOUTH || action == actions.SOUTHWEST || action === actions.SOUTHEAST ) y++
    	if ( action === actions.WEST || action == actions.NORTHWEST || action === actions.SOUTHWEST ) x--
    	if ( action === actions.EAST || action == actions.NORTHEAST || action === actions.SOUTHEAST ) x++
    	if ( x !== pc.tile.x || y !== pc.tile.y ) {
    		var to = gettile( x, y )
            if ( to ) {
                var target = contains( to, monsterglyphs )
                if ( target ) {
                    log( [
                        'The ' + target.name + ' growls at you',
                        'The ' + target.name + ' laughs at your puny efforts to attack him'
                    ][ ROT.RNG.getUniformInt( 0, 1 ) ] ) 
        			resolve()
        			return
                } else if ( ! contains( to, blocksmove ) ) {
        			push( pc, to )
        			resolve()
        			return
        		}
            }
    	}
    	document.addEventListener( 'keydown', keydown )
    }
    document.addEventListener( 'keydown', keydown )
}

function keydown( event ) {
    if ( event.altKey || event.metaKey ) return
    var key = event.key
    var action = actions.NONE
    if ( [ 'ArrowUp', 'k' ].indexOf( key ) > - 1) {
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
    document.removeEventListener( 'keydown', keydown )
    input.resolve( action )
}

const display = new ROT.Display( options )
document.body.appendChild( display.getContainer() )

var fov_fillstyle = 'rgba( 0, 0, 0, 0.5 )'
var fov_image = new Image()
fov_image.onload = function() {
    fov_fillstyle = display._backend._context.createPattern( fov_image, 'repeat' )
}
fov_image.src = "assets/fov.png"

const pc = Actor( glyphs.PC, 0, 0, 0 )

fit()

;( function ( timeout, blocked ) {
    var handler = function() {
    	blocked = timeout
    	timeout || ( fit(), timeout = setTimeout( function() {
    		timeout = null
    		blocked && handler()
    	}, 500 ) )
    }
    window.addEventListener( 'resize', handler )
} )()

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

function wall( x0, y0, x1, y1 ) {
    line( x0, y0, x1, y1, function( x, y ) {
        var tile = gettile( x, y )
        tile.glyph = glyphs.WALL
        tile.r = tile.g = tile.b = 1
    } )
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
        var tile = gettile( x, y )
        var high = noise.get( x, y )
        var low1 = noise.get( x * 0.05, y * 0.05 )
        var low2 = noise.get( ( x + 133 ) * 0.07, ( y - 261 ) * 0.07 )
        if ( low1 > - 0.8 && low2 < 0 ) {
            tile.glyph = glyphs.TREE
        } else {
            var n = ( low2 + 1 ) * 0.4 + ( low1 + 1 ) * 0.1
            tile.glyph = grassglyphs[ Math.floor( n * grassglyphs.length ) ]
            if ( n * high > 0.3 ) tile.glyph = grassglyphs[ 0 ]
        }
    } )
}

grass_and_trees( 0, 0, map.height - 1, map.width - 1 )

function findunblockedtile() {
    var tile
    do {
        tile = gettile( ROT.RNG.getUniformInt( 0, map.width - 1 ), ROT.RNG.getUniformInt( 0, map.width - 1 ) )
    } while ( contains( tile, blocksmove ) )
    return tile
}

push( pc, findunblockedtile() )

for ( var i = num_monsters; i--; ) { 
    var monster = Actor( monsterglyphs[ ROT.RNG.getUniformInt( 0, monsterglyphs.length - 1 ) ], 0, 0, 0 )
    push( monster, findunblockedtile() )
}

next()

