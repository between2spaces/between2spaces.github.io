import * as display from './display'
import * as object from './objects/object'
import * as map from './map'
import * as pc from './objects/pc'
import * as colour from './colour'

const N = 0
const S = 1
const E = 2
const W = 3

const DIR_CH = [ '▹', '▵', '◃', '◃', ' ', '▹', '▹', '▿', '▵' ]
//const DIR_CH = [ '🚶', '🚶', '🚶', '🚶', ' ', '🚶', '🚶', '🚶', '🚶' ]
const KEY_STICK_MS = 60

const dir = object.Object( { z: 255, height: 255 } )

var keys = {}
var downKeys = []
var _resolve

function getcmd( resolve ) {
	_resolve = resolve
	document.addEventListener( 'keyup', keyUp )
	document.addEventListener( 'keydown', keyDown )
}

function keyUp( event ) {
	if ( event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ) return
	var key = keys[ event.key ] || ( keys[ event.key ] = {} )
	var i = downKeys.indexOf( key )
	if ( i > -1 ) downKeys.splice( i, 1 )
	if ( key.timeout ) key.timeout = clearTimeout( key.timeout )
	if ( downKeys.length === 0 ) {
		document.removeEventListener( 'keydown', keyDown )
		document.removeEventListener( 'keyup', keyUp )
		_resolve( dir.tile )
		map.move( dir )
	}
}

function keyDown( event ) {
	if ( event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ) return
	var key = keys[ event.key ] || ( keys[ event.key ] = {} )
	if ( key.timeout ) clearTimeout( key.timeout )
	if ( ! pc.instance.tile ) return
	if ( downKeys.indexOf( key ) === -1 ) downKeys.push( key )
	key.lastDown = performance.now()
	;( function( event ) {
		key.timeout = setTimeout( function() { keyDown( event ) }, KEY_STICK_MS )
	} )( event )
	updateIntention()
}

function lastDown( keyList ) {
	var mostRecent = -1
	for ( var i = keyList.length; i--; ) {
		var key = keyList[ i ]
		if ( keys[ key ] && keys[ key ].lastDown > mostRecent ) mostRecent = keys[ key ].lastDown
	}
	return mostRecent
}

function updateIntention() {
	if ( downKeys.length === 0 ) return

	var last = [
		lastDown( [ 'ArrowUp', 'w', 'k' ] ),
		lastDown( [ 'ArrowDown', 's', 'j' ] ),
		lastDown( [ 'ArrowRight', 'd', 'l' ] ),
		lastDown( [ 'ArrowLeft', 'a', 'h' ] )
	]
	var now = performance.now()
	
	var offset = { x: 0, y: 0 }

	if ( last[ N ] > last[ S ] ) {
		if ( ( now - last[ N ] ) < KEY_STICK_MS ) offset.y--
	} else {
		if ( ( now - last[ S ] ) < KEY_STICK_MS ) offset.y++
	}
	if ( last[ E ] > last[ W ] ) {
		if ( ( now - last[ E ] ) < KEY_STICK_MS ) offset.x++
	} else {
		if ( ( now - last[ W ] ) < KEY_STICK_MS ) offset.x--
	}
	
	dir.glyphs[ 0 ].ch = DIR_CH[ ( offset.y + 1 ) * 3 + offset.x + 1 ]
	
	offset.x += pc.instance.tile.x
	offset.y += pc.instance.tile.y

	if ( ! dir.tile || dir.tile.x !== offset.x || dir.tile.y !== offset.y ) {
		var from = map.below( pc.instance )
		var to = map.highest( offset )
		if ( map.toohigh( pc.instance, from, to ) ) {
			dir.glyphs[ 0 ].ch = '#'
		} else if ( map.toolow( pc.instance, from , to ) ) {
			dir.glyphs[ 0 ].ch = '#'
		}
		if ( to.type === 'npc' && map.floor( offset ).z >= map.floor( pc.instance.tile ).z ) {
			dir.glyphs[ 0 ].ch = '!'
		}
		map.move( dir, offset )
	}
}

export { getcmd }
