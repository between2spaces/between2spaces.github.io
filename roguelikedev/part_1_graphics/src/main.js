import { ROT } from "./rot"

let display = new ROT.Display( { fontSize: 24, spacing: 1.3 } )
document.body.appendChild( display.getContainer() )

let centre

let pc = { x: 0, y: 0, ch: '@', fg: '#ccc' }

function draw( xy, ch, fg ) {
	display.draw( xy.x + centre.x, xy.y + centre.y, ch, fg )
}

const N = 0
const S = 1
const E = 2
const W = 3

//const DIR_CH = [ '▹', '▵', '◃', '◃', ' ', '▹', '▹', '▿', '▵' ]
const DIR_CH = [ '🚶', '🚶', '🚶', '🚶', ' ', '🚶', '🚶', '🚶', '🚶' ]

let dir = { x: 0, y: 0, ch: DIR_CH[ N ], fg: '#3f3' }

const KEY_STICK_MS = 60

function isDown( keyList ) {
	for ( let i = keyList.length; i--; ) {
		let key = keyList[ i ]
		if ( keys[ key ] && keys[ key ].isDown ) return true
	}
	return false
}

function lastDown( keyList ) {
	let mostRecent = -1
	for ( let i = keyList.length; i--; ) {
		let key = keyList[ i ]
		if (  keys[ key ] && keys[ key ].lastDown > mostRecent ) mostRecent = keys[ key ].lastDown
	}
	return mostRecent
}

function updateDir() {
	if ( dir.timeoutUpdate ) {
		clearTimeout( dir.timeoutUpdate )
	}

	let down = [
		isDown( [ 'ArrowUp', 'w', 'k' ] ),
		isDown( [ 'ArrowDown', 's', 'j' ] ),
		isDown( [ 'ArrowRight', 'd', 'l' ] ),
		isDown( [ 'ArrowLeft', 'a', 'h' ] )
	]
	let last = [
		lastDown( [ 'ArrowUp', 'w', 'k' ] ),
		lastDown( [ 'ArrowDown', 's', 'j' ] ),
		lastDown( [ 'ArrowRight', 'd', 'l' ] ),
		lastDown( [ 'ArrowLeft', 'a', 'h' ] )
	]
	let now = performance.now()
	
	down[ N ] = down[ N ] || ( ! down[ S ] && last[ N ] > last[ S ] && ( now - last[ N ] ) < KEY_STICK_MS )
	down[ S ] = down[ S ] || ( ! down[ N ] && last[ S ] > last[ N ] && ( now - last[ S ] ) < KEY_STICK_MS )
	down[ E ] = down[ E ] || ( ! down[ W ] && last[ E ] > last[ W ] && ( now - last[ E ] ) < KEY_STICK_MS )
	down[ W ] = down[ W ] || ( ! down[ E ] && last[ W ] > last[ E ] && ( now - last[ W ] ) < KEY_STICK_MS )

	let offset = { x: 0, y: 0 }

	if ( down[ N ] ) offset.y--
	if ( down[ S ] ) offset.y++
	if ( down[ E ] ) offset.x++
	if ( down[ W ] ) offset.x--

	dir.ch = DIR_CH[ ( offset.y + 1 ) * 3 + offset.x + 1 ]
	
	if ( offset.x !== 0 || offset.y !== 0 ) {
		offset.x += pc.x
		offset.y += pc.y
		put( dir, offset )
	}

	dir.timeoutUpdate = setTimeout( updateDir, KEY_STICK_MS )
}

function put( xych, xy ) {
	if ( xych === pc || xych.x !== pc.x || xych.y !== pc.y ) {
		draw( xych, null )
	}
	xych.x = xy.x
	xych.y = xy.y
	draw( xych, xych.ch, xych.fg )
}

let keys = {}
let keysDown = 0
 
function getcmd( resolve ) {
	let handler = function( event ) {
		if ( event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ) {
			return
		}
		let key = keys[ event.key ] || ( keys[ event.key ] = {} )
		key.isDown = false
		key.lastDown = performance.now()
		keysDown--
		updateDir()
		if ( keysDown <= 0 ) {
			keysDown = 0
			document.removeEventListener( "keyup", handler )
			if ( dir.updater ) {
				clearTimeout( dir.updater )
			}
			resolve()
		}
	}
	document.addEventListener( "keyup", handler )
}

document.addEventListener( "keydown", function( event ) {
	if ( event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ) {
		return
	}
	let key = keys[ event.key ] || ( keys[ event.key ] = { isDown: false } )
	key.isDown || keysDown++
	key.isDown = true
	key.lastDown = performance.now()
	updateDir()
} )

function fit() {
	let options = display.getOptions()
	let size = display.computeSize( window.innerWidth, window.innerHeight )
	options.width = size[ 0 ]
	options.height = size[ 1 ]
	display.setOptions( options )
	centre = { x: Math.floor( options.width * 0.5 ), y: Math.floor( options.height * 0.5 ) }
	display.clear()
	draw( pc, pc.ch, pc.fg )
}

;( function ( timeout, blocked ) {
	let handler = function() {
		blocked = timeout
		timeout || ( fit(), timeout = setTimeout( function() {
			timeout = null
			blocked && handler()
		}, 500 ) )
	}
	window.addEventListener( "resize", handler )
} )()

function loop() {
	getcmd( function() {
		put( pc, dir )
		setTimeout( loop, 0 )
	 } )
}

fit()
loop()