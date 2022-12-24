import { ROT } from './rot'
import * as map from './map'
import * as colour from './colour'
import * as pc from './objects/pc'

var display = new ROT.Display( { fontFamily: '"Courier New", Courier, monospace', fontSize: 40, bg: 'transparent' } )
document.body.appendChild( display.getContainer() )

const Z_MID_FOCUS = 140

const BLACK = 'rgb( 0, 0, 0 )'
const GRAY = 'rgb( 30, 30, 200 )'
const SHADOW = 'rgba( 0, 0, 0, 0.1 )'

function init() {
	fit()
}

function update( xy ) {
	var rect = xy ? { minx: xy.x, miny: xy.y, maxx: xy.x, maxy: xy.y } : { minx: - centre.x, miny: - centre.y, maxx: centre.x, maxy: centre.y }
	var world = { x: 0, y: 0 }
	
	rect.minx = Math.max( rect.minx, -map.centre.x )
	rect.miny = Math.max( rect.miny, -map.centre.y )
	rect.maxx = Math.min( rect.maxx, map.centre.x - 1 )
	rect.maxy = Math.min( rect.maxy, map.centre.y - 1 )

	// floor pass
	world.y = rect.miny
	while ( world.y <= rect.maxy ) {
		world.x = rect.minx
		while ( world.x <= rect.maxx ) {
			var tile = map.tile( world )
			world.x++
			var x = tile.x + centre.x
			var y = tile.y + centre.y
			var floor = map.floor( tile )
			var z_focus = ( floor.z - Z_MID_FOCUS ) * 0.05
			display._backend._drawNoCache( [ x, y, null, null, colour.string( colour.scale( floor.fill, 1 + z_focus ) ) ], true )
			floor.glyphs[ 0 ].ch = '∙'
			var north = map.floor( { x: tile.x, y: tile.y - 1 } )
			var east = map.floor( { x: tile.x + 1, y: tile.y } )
			var south = map.floor( { x: tile.x, y: tile.y + 1 } )
			var west = map.floor( { x: tile.x - 1, y: tile.y } )
			if ( south.z > floor.z && ! map.toohigh( pc.instance, floor, south ) && east.z !== floor.z && west.z !== floor.z ) { floor.glyphs[ 0 ].ch = '▵' }
			if ( north.z > floor.z && ! map.toohigh( pc.instance, floor, north ) && east.z !== floor.z && west.z !== floor.z ) { floor.glyphs[ 0 ].ch = '▿' }
			if ( east.z > floor.z && ! map.toohigh( pc.instance, floor, east ) && north.z !== floor.z && south.z !== floor.z ) { floor.glyphs[ 0 ].ch = '◃' }
			if ( west.z > floor.z && ! map.toohigh( pc.instance, floor, west ) && north.z !== floor.z && south.z !== floor.z ) { floor.glyphs[ 0 ].ch = '▹' }
			//if ( south.z > floor.z && ! map.toohigh( pc.instance, floor, south ) && north.z < floor.z && east.z === floor.z && west.z === floor.z ) { floor.glyphs[ 0 ].ch = '▿'; max = south.z }
			//if ( west.z > floor.z && ! map.toohigh( pc.instance, floor, west ) && east.z < floor.z && north.z === floor.z && south.z === floor.z ) { floor.glyphs[ 0 ].ch = '◃'; max = west.z }
			draw( x, y, floor, 1 + z_focus )
			//if ( map.toohigh( pc.instance, object, map.floor( { x: tile.x + 1, y: tile.y } ) ) ) display._backend._drawNoCache( [ x + 0.45, y, '|', GRAY ] )
			//if ( map.toolow( pc.instance, object, map.floor( { x: tile.x, y: tile.y - 1 } ) ) ) fill( x, y, display._backend._spacingX, 3, colour.string( colour.scale( object.fill, 0.2 ) ) )
			//if ( map.toohigh( pc.instance, object, map.floor( { x: tile.x - 1, y: tile.y } ) ) ) display._backend._drawNoCache( [ x - 0.45, y, '|', GRAY ] )
			
		}
		world.y++
	}
	
	// shadow pass
	world.y = rect.miny
	while ( world.y <= rect.maxy ) {
		world.x = rect.minx
		while ( world.x <= rect.maxx ) {
			var tile = map.tile( world )
			world.x++
			var x = tile.x + centre.x
			var y = tile.y + centre.y
			var floor = map.floor( tile )
			var objects = tile.objects
			for ( var object_index = objects.length; object_index--; ) {
				var object = objects[ object_index ]
				var z_focus = ( object.z - Z_MID_FOCUS ) * 0.05
				if ( ! object.fill && object.z < 255 ) {
					var glyphs = object.glyphs
					for ( var glyph_index = glyphs.length; glyph_index--; ) {
						var glyph = glyphs[ glyph_index ]
						display._backend._drawNoCache( [ x, y + object.height * 0.004, glyph.ch, SHADOW ] )
					}
				}
			}
		}
		world.y++
	}
	
	// object pass
	world.y = rect.miny
	while ( world.y <= rect.maxy ) {
		world.x = rect.minx
		while ( world.x <= rect.maxx ) {
			var tile = map.tile( world )
			world.x++
			var x = tile.x + centre.x
			var y = tile.y + centre.y
			var objects = tile.objects
			for ( var object_index = objects.length; object_index--; ) {
				var object = objects[ object_index ]
				var z_focus = ( object.z - Z_MID_FOCUS ) * 0.05
				if ( ! object.fill ) {
					draw( x, y, object, 1 + z_focus )
				}
			}
		}
		world.y++
	}

	// high floor shadow pass
	world.y = rect.miny
	while ( world.y <= rect.maxy ) {
		world.x = rect.minx
		while ( world.x <= rect.maxx ) {
			var tile = map.tile( world )
			world.x++
			var x = tile.x + centre.x
			var y = tile.y + centre.y
			var floor = map.floor( tile )
			var north = map.floor( { x: tile.x, y: tile.y - 1 } )
			var west = map.floor( { x: tile.x - 1, y: tile.y } )
			var northwest = map.floor( { x: tile.x - 1, y: tile.y - 1 } )
			var z_focus = ( floor.z - Z_MID_FOCUS ) * 0.05
			if ( floor.z < north.z ) {
				var h = ( north.z - floor.z ) * 0.5
				var w = display._backend._spacingX
				fill( x, y, display._backend._spacingX, h, SHADOW )
			}
			if ( floor.z < west.z ) {
				var h = ( west.z - floor.z ) * 0.5
				fill( x, y, 2, display._backend._spacingY, SHADOW )
			}
			if ( floor.z < northwest.z && floor.z >= west.z && floor.z >= north.z ) {
				var h = ( northwest.z - floor.z ) * 0.5
				fill( x, y, 2, h, SHADOW )
			}
		}
		world.y++
	}

}

function draw( x, y, object, intensity ) {
	var glyphs = object.glyphs
	for ( var i = glyphs.length; i--; ) {
		var glyph = glyphs[ i ]
		display._backend._drawNoCache( [ x, y, glyph.ch, colour.string( colour.scale( glyph.fg, intensity ) ) ] )
	}
}

function fill( x, y, w, h, bg ) {
	display._backend._context.fillStyle = bg
	display._backend._context.fillRect( x * display._backend._spacingX , y * display._backend._spacingY, w, h )
}

function fit() {
	var options = display.getOptions()
	var size = display.computeSize( window.innerWidth, window.innerHeight )
	options.width = size[ 0 ]
	options.height = size[ 1 ]
	display.setOptions( options )
	centre = { x: Math.floor( options.width * 0.5 ), y: Math.floor( options.height * 0.5 ) }
	update()
}

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

var centre

export { init, update }
