import { ROT } from './rot'

var options = {
	fontFamily: '"Courier New", Courier, monospace',
	fontSize: 30,
	spacing: 1.2,
}

const sunrise = { r: 182 / 255.0, g: 126 / 255.0, b: 91 / 255.0 }
const noon = { r: 292 / 255.0, g: 291 / 255.0, b: 273 / 255.0 }
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
	VOID: Glyph( ' ', 'void', 0, 0, 0 ),
	PC: Glyph( '👤', 'player', 245, 3, 255 ),
	CORPSE: Glyph( '☠', 'corpse', 200, 150, 150 ),
	GRASS1: Glyph( ';', 'tall grass', 36, 100, 0 ),
	GRASS2: Glyph( "'", 'short grass', 36, 80, 0 ),
	GRASS3: Glyph( '"', 'thick grass', 60, 100, 0 ),
	PAVING: Glyph( '⬛', 'paving', 40, 40, 40 ),
	WALL: Glyph( '#', 'wall', 164, 164, 164 ),
	WATER: Glyph( "〜", 'water', 120, 154, 235 ),
	TREE: Glyph( '🌳', 'tree', 36, 120, 0 ),
	RAT: Glyph( '🐀', 'rat', 200, 150, 0 ),
	TIGER: Glyph( '🐅', 'tiger', 200, 200, 0 ),
}

const grassglyphs = [ glyphs.GRASS1, glyphs.GRASS2, glyphs.GRASS3 ]
const blocksfov = [ glyphs.VOID, glyphs.WALL, glyphs.TREE ]
const monsterglyphs = [ glyphs.RAT, glyphs.TIGER ]
const blocksmove = [ glyphs.VOID, glyphs.WALL ]
Array.prototype.push.apply( blocksmove, monsterglyphs )

const logdiv = document.getElementById( 'log' )

function log( msg ) {
	while( logdiv.childNodes.length > 6 ) {
		logdiv.removeChild( logdiv.childNodes[ 0 ] )
	}
	var opacity = 1
	for ( var i = logdiv.childNodes.length; i--; ) {
		logdiv.childNodes[ i ].style.opacity = '' + opacity
		opacity -= 0.2
	}
	var entry = document.createElement( 'div' )
	entry.innerHTML = msg
	logdiv.appendChild( entry )
	entry.scrollIntoView()
}

log( 'r/roguelikedev does the complete roguelike tutorial' )
log( 'Week 5 - Part 6: Go berserk!' )


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

function Thing( type, glyph, x, y, z, defense, power ) {
	return {
		type: type,
		glyph: glyph,
		tile: getTile( x, y ),
		z: z,
		health: 1,
		defense: defense,
		power: power
	}
}

function Actor( glyph, x, y, z, defense, power ) {
	var actor = Thing( Actor, glyph, x, y, z, defense, power )
	actors.push( actor )
	return actor
}

function act( actor ) {
	for ( var i = fovtiles.length; i--; ) {
		var tile = fovtiles[ i ]
		var things = tile.things
		if ( things.indexOf( actor ) > -1 ) {
			movetowards( actor, pc.tile )
			return
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

function movetowards( thing, tile ) {
    var xy = thing.tile
	if ( xy === tile ) return
    xy = subtract( xy, tile )
    var delta = unit( xy )
	moveto( thing, thing.tile.x + Math.round( delta.x ), thing.tile.y + Math.round( delta.y ) )
}

function health( thing ) {
	return '♥' + Math.round( thing.health * 100 ) + '%'
}
function attack( thing, target ) {
	var damage = thing.power - target.defense
	if ( damage > 0 ) {
		log( thing.glyph.name + health( thing ) + ' hits ' + target.glyph.name + health( target ) + ' for ' + Math.round( damage * 100 ) + '%' )
		target.health -= damage
	} else {
		log( thing.glyph.name + health( thing ) + ' attacks ' + target.glyph.name + health( target ) + ' but fails to do damage' )
	}
	if ( target !== pc && target.health <= 0 ) killed( thing, target )
}

function killed( thing, target ) {
	log( thing.glyph.name + health( thing ) + ' kills ' + target.glyph.name )
	target.glyph = glyphs.CORPSE
	var i = actors.indexOf( target )
	if ( i > -1 ) actors.splice( i, 1 )
}

const drawinfo = [ 0/*x*/, 1/*y*/, 2/*ch*/, 3/*colour*/ ]

const fovtiles = []

const preciseshadowcasting = new ROT.FOV.PreciseShadowcasting( function( x, y ) {
    var tile = getTile( x, y )
    if ( ! tile ) return false
    if ( tile.glyph === glyphs.TREE ) {
        var dist = length( subtract( tile, pc.tile ) )
        if ( dist <= 0.5 ) return true
    }
	return ! contains( tile, blocksfov )
} )

function fov() {
	for ( var i = fovtiles.length; i--; ) fovtiles[ i ].fov = false
	fovtiles.length = 0
	preciseshadowcasting.compute( pc.tile.x, pc.tile.y, Math.min( centre.x, centre.y ), function( x, y ) {
		var tile = getTile( x, y )
		if ( ! tile ) return
		tile.fov = true
		tile.fow = false
		fovtiles.push( tile )
	} )
}

function render() {
	fov()
	ctx.clearRect( 0, 0, window.innerWidth, window.innerHeight )
	var minx = Math.min( Math.max( pc.tile.x - centre.x, 0 ), map.width - options.width )
	var miny = Math.min( Math.max( pc.tile.y - centre.y, 0 ), map.height - options.height )
	var endx = minx + options.width
	var endy = miny + options.height
	var y = miny
	while ( y < endy ) {
		drawinfo[ 1 ] = ( y - miny )
		var ctxy = ( y - miny ) * spacing.y
		var x = minx
		while ( x < endx ) {
			drawinfo[ 0 ] = ( x - minx )
			var tile = getTile( x, y )
			var ctxx = ( x - minx ) * spacing.x
			if ( ! tile.fow ) {
				var glyph = tile.glyph
				drawinfo[ 2 ] = glyph.ch
				drawinfo[ 3 ] = rgb( glyph.r, glyph.g, glyph.b )
				bck._drawNoCache( drawinfo )
				if ( tile.fov ) {
					var things = tile.things
					for ( var i = things.length; i--; ) {
						var thing = things[ i ]
						glyph = thing.glyph
						drawinfo[ 2 ] = glyph.ch
						drawinfo[ 3 ] = rgb( glyph.r, glyph.g, glyph.b )
						bck._drawNoCache( drawinfo )
					}
				}
			}
			if ( tile.fow || ! tile.fov ) {
				ctx.fillStyle = fowstyle
				ctx.fillRect( ctxx, ctxy, spacing.x, spacing.y )
			} 
			x++
		}
		y++
	}
	lighting()
}

function lighting() {
	var width = options.width * spacing.x
	var imagedata = ctx.getImageData( 0, 0, width, options.height * spacing.y )
	var data = imagedata.data
	var minx = Math.min( Math.max( pc.tile.x - centre.x, 0 ), map.width - options.width )
	var miny = Math.min( Math.max( pc.tile.y - centre.y, 0 ), map.height - options.height )
	for ( var i = fovtiles.length; i--; ) {
		var tile = fovtiles[ i ]
		var ctxx = ( tile.x - minx ) * spacing.x
		var ctxy = ( tile.y - miny ) * spacing.y
		for ( var y = ctxy + spacing.y; y >= ctxy; y-- ) {
			for ( var x = ctxx + spacing.x; x >= ctxx; x-- ) {
				var d = ( y * width + x ) * 4
				data[ d ] = Math.min( 255, Math.max( 0, Math.round( data[ d ] * ( sun.r + tile.r ) ) ) )
				d++
				data[ d ] = Math.min( 255, Math.max( 0, Math.round( data[ d ] * ( sun.g + tile.g ) ) ) )
				d++
				data[ d ] = Math.min( 255, Math.max( 0, Math.round( data[ d ] * ( sun.b + tile.b ) ) ) )
			}
		}
	}
	ctx.putImageData( imagedata, 0, 0 )
}

function rgb( r, g, b ) {
	return 'rgb( ' + Math.min( 255, Math.max( 0, Math.round( r * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( g * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( b * 255 ) ) ) + ' )'
}

function rgba( r, g, b, a ) {
	return 'rgba( ' + Math.min( 255, Math.max( 0, Math.round( r * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( g * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( b * 255 ) ) ) + ', ' + Math.min( 1, Math.max( 0, a ) ) + ' )'
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
			moveto( pc, x, y )
			var to = getTile( x, y )
			resolve()
			return
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

var fowstyle = 'rgba( 0, 0, 0, 0.5 )'

const assets = {
	fowimg: "assets/fov.png"
}

;( function ( resolve ) {
	var remaining = Object.getOwnPropertyNames( assets ).length
	for ( var name in assets ) {
		;( function ( name ) {
			var src = assets[ name ]
			var image = assets[ name ] = new Image()
			image.onload = function() { if ( ! --remaining ) resolve() }
			image.src = src
		} )( name )
	}
} )( function() {
	fowstyle = ctx.createPattern( assets.fowimg, 'repeat' )
	render()
} )

const pc = Thing( Thing, glyphs.PC, 0, 0, 0, 0.1, 0.5 )

const display = new ROT.Display( options )
document.body.appendChild( display.getContainer() )
const bck = display._backend
const ctx = bck._context

function fit() {
	options = display.getOptions()
	var size = display.computeSize( window.innerWidth, window.innerHeight )
	options.width = size[ 0 ]
	options.height = size[ 1 ]
	display.setOptions( options )
	display._dirty = false
	centre.x = Math.floor( options.width * 0.5 )
	centre.y = Math.floor( options.height * 0.5 )
	spacing.x = bck._spacingX
	spacing.y = bck._spacingY
	render()
}

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

function buildWall( x0, y0, x1, y1 ) {
	line( x0, y0, x1, y1, function( x, y ) {
		var tile = getTile( x, y )
        var wall = Thing( Thing, glyphs.WALL, 0, 0, 0, 0.1, 0 )
        push( wall, tile )
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
		var tile = getTile( x, y )
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

var tile
do { tile = getTile( ROT.RNG.getUniformInt( 0, map.width - 1 ), ROT.RNG.getUniformInt( 0, map.width - 1 ) ) } while ( contains( tile, blocksmove ) || contains( tile, blocksfov ) )
push( pc, tile )

while ( contains( pc.tile, blocksmove ) ) {
    tile = getTile( pc.tile.x + ROT.RNG.getUniformInt( -1, 1 ), pc.tile.y + ROT.RNG.getUniformInt( -1, 1 ) )
    push( pc, tile )
}

for ( var i = num_monsters; i--; ) {
	var glyph = monsterglyphs[ ROT.RNG.getUniformInt( 0, monsterglyphs.length - 1 ) ]
	var monster = Actor( glyph, 0, 0, 0, 0.1, glyph === glyphs.RAT ? 0.13 : 0.2 )
	do { tile = getTile( ROT.RNG.getUniformInt( 0, map.width - 1 ), ROT.RNG.getUniformInt( 0, map.width - 1 ) ) } while ( contains( tile, blocksmove ) )
	push( monster, tile )
}

;( function next() {
	for ( var i = actors.length; i--; ) act( actors[ i ] )
	render()
	input( function() { setTimeout( next, 0 ) } )
} )()


