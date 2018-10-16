import { ROT } from './rot'

var options = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 30,
    spacing: 0.9,
}

const sun = 1
const light_in_fov = 1.3
const light_out_fov = 0.5

const map = []
map.width = 100
map.height = 100
map.centre = { x: map.width * 0.5 , y: map.height * 0.5 }

const actors = []
const centre = { x: 0, y: 0 }
const spacing = { x: 0, y: 0 }
const noise = new ROT.Noise.Simplex()

function Glyph( ch, r, g, b ) {
    return {
    	ch: ch,
    	r: r,
    	g: g,
    	b: b
    }
}

const glyphs = {
    PC: Glyph( '👤', 245, 3, 255 ),
    VOID: Glyph( ' ', 0, 0, 0 ),
    GRASS1: Glyph( "'", 36, 120, 0 ),
    GRASS2: Glyph( '"', 36, 120, 0 ),
    GRASS3: Glyph( ';', 36, 120, 0 ),
    PAVING: Glyph( '⬛', 40, 40, 40 ),
    WALL: Glyph( '⏹', 164, 164, 164 ),
    WATER: Glyph( "〜", 120, 154, 235 ),
    TREE: Glyph( '🌳', 36, 120, 0 ),
}

const grassglyphs = [ glyphs.GRASS1, glyphs.GRASS2, glyphs.GRASS3 ]

const blocksmove = [ glyphs.PC, glyphs.NPC, glyphs.VOID, glyphs.WALL, glyphs.TREE ]

const blocksfov = [ glyphs.VOID, glyphs.WALL, glyphs.TREE ]


function Tile( glyph, x, y ) {
    return {
    	glyph: glyph,
    	r: 1,
    	g: 1,
    	b: 1,
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
    	tile: tileAt( x, y ),
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

function tileAt( x, y ) {
    if ( x < 0 || y < 0 || x >= map.width || y >= map.height ) return null
    return map[ y * map.width + x ]
}

function contains( tile, glyphlist ) {
    if ( ! tile ) return false
    if ( glyphlist.indexOf( tile.glyph ) > -1 ) return true
    var things = tile.things
    for ( var i = things.length; i--; ) {
    	if ( glyphlist.indexOf( things[ i ].glyph ) > -1 ) return true
    }
    return false
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
    return ! contains( tileAt( x, y ), blocksfov )
} )

function render() {
    var focus = pc.tile

    for ( var i = fovtiles.length; i--; ) fovtiles[ i ].fov = false
    fovtiles.length = 0
    fov.compute( focus.x, focus.y, Math.max( centre.x, centre.y ), function( x, y ) {
        var tile = tileAt( x, y )
        if ( ! tile ) return
        tile.fov = true
        tile.fow = false
        fovtiles.push( tile )
    } )
  
    display._backend._context.fillStyle = 'black'
    display._backend._context.fillRect( 0, 0, window.innerWidth, window.innerHeight )

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
    		var tile = tileAt( x, y )
            if ( tile.fow ) {
                display._backend._context.fillStyle = 'black'
		        display._backend._context.fillRect( ( x - minx ) * spacing.x, ( y - miny ) * spacing.y, spacing.x, spacing.y )
            } else {
                var lit = sun * ( tile.fov ? light_in_fov : light_out_fov )
        		var glyph = tile.glyph
        		drawinfo[ 2 ] = glyph.ch
        		drawinfo[ 3 ] = rgb( glyph.r * tile.r, glyph.g * tile.g, glyph.b * tile.b, lit )
        		display._backend._drawNoCache( drawinfo )
                if ( tile.fov ) {
        		    var things = tile.things
        		    for ( var i = things.length; i--; ) {
        		    	var thing = things[ i ]
        		    	glyph = thing.glyph
        		    	drawinfo[ 2 ] = glyph.ch
        		    	drawinfo[ 3 ] = rgb( glyph.r, glyph.g, glyph.b, lit )
        		    	display._backend._drawNoCache( drawinfo )
        		    }
                } else {
                    display._backend._context.fillStyle = fov_fillstyle
                    display._backend._context.fillRect( ( x - minx ) * spacing.x, ( y - miny ) * spacing.y, spacing.x, spacing.y )
                }
            }
    		x++
    	}
    	y++
    }
}

function rgb( r, g, b, n ) {
    return 'rgb( ' + Math.round( r * n ) + ', ' + Math.round( g * n ) + ', ' + Math.round( b * n ) + ' )'
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
    		var to = tileAt( x, y )
    		if ( to && ! contains( to, blocksmove ) ) {
    			push( pc, to )
    			resolve()
    			return
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
        var tile = tileAt( x, y )
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

function grass( x0, y0, x1, y1 ) {
    area( x0, y0, x1, y1, function( x, y ) {
        var tile = tileAt( x, y )
        var n = noise.get( x, y )
        tile.glyph = grassglyphs[ Math.round( ( noise.get( ( x - 50 ) * 0.5, ( y + 100 ) * 0.5 ) + 1 ) * 0.5 * ( grassglyphs.length - 1 ) ) ]
        if ( noise.get( x * 0.04, y * 0.04 ) > 0 && noise.get( ( x + 100 ) * 0.07, ( y + 360 ) * 0.07 ) < 0 ) {
            tile.glyph = glyphs.TREE
        }
        tile.g = noise.get( x * 0.05, y * 0.05 ) < 0 ? 0.3 : 0.6
        tile.g += n * 0.2 
        tile.b = ( noise.get( x * 0.005, y * 0.005 ) + 1 ) * 0.2 
        tile.r = ( noise.get( x * 0.04, y * 0.04 ) + 1 ) * 0.1 
    } )
}

function tree( x0, y0, x1, y1 ) {
    area( x0, y0, x1, y1, function( x, y ) {
        var tile = tileAt( x, y )
        var n = noise.get( x, y )
        tile.glyph = glyphs.TREE
        tile.r = tile.g = tile.b = 1
    } )
}


grass( 0, 0, map.height - 1, map.width - 1 )


var start = tileAt( ROT.RNG.getUniformInt( 0, map.width - 1 ), ROT.RNG.getUniformInt( 0, map.width - 1 ) )
while ( start.glyph === glyphs.TREE ) {
    start = tileAt( ROT.RNG.getUniformInt( 0, map.width - 1 ), ROT.RNG.getUniformInt( 0, map.width - 1 ) )
}

push( pc, start )

next()

