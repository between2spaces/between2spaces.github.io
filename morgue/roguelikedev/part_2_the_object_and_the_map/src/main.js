import './polyfills'
import * as display from './display'
import * as object from './objects/object'
import * as map from './map'
import * as floor from './objects/floor'
import * as pc from './objects/pc'
import NPC from './objects/npc'

function loop() {
	display.update()
	for ( var i = object.actions.length; i--; ) object.actions[ i ]()
	pc.act( function() { setTimeout( loop, 0 ) } )
}

for ( var y = - map.centre.y; y < map.centre.y; y++ ) {
	for ( var x = - map.centre.x; x < map.centre.x; x++ ) {
		map.push( floor.Floor(), { x: x, y: y } )
	}
}

map.raise( { x: -5, y: -1 }, 7 )
map.raise( { x: -4, y: -1 }, 14 )
map.raise( { x: -3, y: -1 }, 20 )
map.raise( { x: -2, y: -1 }, 20 )
map.raise( { x: -1, y: -1 }, 20 )
map.raise( { x: 0, y: -1 }, 20 )
map.raise( { x: 1, y: -1 }, 20 )
map.raise( { x: 2, y: -1 }, 20 )
map.raise( { x: 3, y: -1 }, 20 )
map.raise( { x: 3, y: 0 }, 14 )
map.raise( { x: 3, y: 1 }, 7 )


map.raise( { x: -1, y: -2 }, 50 )
map.raise( { x: 0, y: -2 }, 50 )
map.raise( { x: 0, y: -3 }, 50 )
map.raise( { x: -1, y: -3 }, 50 )
map.raise( { x: -2, y: -2 }, 45 )
map.raise( { x: -2, y: -3 }, 39 )
map.raise( { x: -2, y: -4 }, 35 )
map.raise( { x: -1, y: -4 }, 30 )
map.raise( { x: 0, y: -4 }, 25 )
map.raise( { x: 1, y: -4 }, 20 )
map.raise( { x: 1, y: -3 }, 20 )
map.raise( { x: 1, y: -2 }, 20 )

map.raise( { x: -7, y: 4 }, 50 )
map.raise( { x: 11, y: -4 }, 50 )

var npc = NPC()
map.push( npc, { x: -1, y: 0 } )
map.push( pc.instance, { x: 0, y: 0 } )

display.init()

loop()
