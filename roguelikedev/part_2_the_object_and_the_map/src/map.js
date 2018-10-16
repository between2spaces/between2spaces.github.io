import * as display from './display'

const size = { x: 200, y: 150 }
const centre = { x: Math.floor( size.x * 0.5 ), y: Math.floor( size.y * 0.5 ) }
const tiles = []

function Tile( x, y ) {
	var tile = {
		x: x,
		y: y,
		objects: []
	}
	return tile
}

for ( var y = size.y; y--; ) {
	for ( var x = size.x; x--; ) {
		tiles[ y * size.x + x ] = Tile( x - centre.x, y - centre.y )
	}
}

function tile( xy ) {
	if ( ! xy ) return null
	var y = xy.y + centre.y
	var x = xy.x + centre.x
	if ( y < 0 || y >= size.y || x < 0 || x >= size.x ) {
		return null
	}
	return tiles[ y * size.x + x ]
}

function push( object, xy ) {
	var _tile = tile( xy )
	object.tile = _tile
	var objects = _tile.objects
	var i = objects.indexOf( object )
	if ( i > -1 ) return
	if ( object.z === null || typeof object.z === 'undefined' ) {
		object.z = floor( xy ).z + object.height
	}
	objects.splice( sortedIndex( objects, object.z ), 0, object )
	return _tile
}

function pop( object ) {
	var _tile = object.tile
	if ( ! _tile ) return null
	var objects = _tile.objects
	object.tile = null
	var i = objects.indexOf( object )
	if ( i > -1 ) objects.splice( i, 1 )
	object.z = null
	return _tile
}

function sortedIndex( objects, z ) {
	var low = 0
	var high = objects.length
	while ( low < high ) {
		var mid = ( low + high ) >>> 1
		if ( objects[ mid ].z < z ) low = mid + 1
		else high = mid
	}
	return low
}

function toohigh( object, from, to ) {
	// if either input is null, don't block
	if ( ! from || ! to ) return false
	// block if the delta is too high
	return ( to.z - from.z ) > ( object.height * 0.5 )
}

function toolow( object, from, to ) {
	// if either input is null, don't block
	if ( ! from || ! to ) return false
	// block if the delta is too high
	return ( from.z - to.z ) > ( object.height * 0.5 )
}

function move( object, xy ) {
	if ( ! xy ) {
		display.update( pop( object ) )
		return
	}
	var from = below( object )
	var to = highest( xy )
	if ( toohigh( object, from, to ) || toolow( object, from, to ) ) return
	display.update( pop( object ) )
	object.z = to.z + to.height + object.height
	display.update( push( object, xy ) )
}

function highest( xy ) {
	var objects = tile( xy ).objects
	for ( var i = objects.length; i--; ) {
		if ( objects[ i ].z < 255 ) return objects[ i ]
	}
	return null
}

function below( object ) {
	var _tile = object.tile
	if ( ! _tile ) return null
	var i = _tile.objects.indexOf( object )
	if ( i === 0 ) return null
	return _tile.objects[ i - 1 ]
}

function floor( xy ) {
	var t = tile( xy )
	if ( ! t ) return null
	var objects = t.objects
	for ( var i = objects.length; i--; ) {
		if ( objects[ i ].fill ) return objects[ i ]
	}
	return null
}

function raise( xy, n ) {
	floor( xy ).z += n
}

export { size, centre, tile, push, pop, move, toohigh, toolow, highest, below, floor, raise }