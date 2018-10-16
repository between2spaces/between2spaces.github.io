import * as input from '../input'
import * as object from './object'
import * as map from '../map'
import Glyph from '../glyph'

var instance = object.Object( {
	glyphs: [ Glyph( '@', 200, 200, 200 ) ],
	height: 20,
} )

function act( resolve ) {
	input.getcmd( function( intention ) {
		// alt+tab away from browser and back again can cause getcmd to resolve with a null intention
		if ( intention ) {
			var to = map.highest( intention )
			if ( to.type === 'npc' && map.floor( intention ).z >= map.floor( instance.tile ).z ) {
				// chat to npc
			} else {
				map.move( instance, intention )
			}
			resolve()
		} else {
			// if this happens we try getcmd once more before resolving player input
			input.getcmd( function( intention ) {
				if( intention ) map.move( instance, intention )
				resolve()
			} )
		}
	} )
}

export { instance, act }