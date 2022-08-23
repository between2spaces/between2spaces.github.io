import * as map from '../map'
import * as display from '../display'
import Glyph from '../glyph'

function Object( object ) {
	return window.Object.assign( {}, {
		glyphs: [ Glyph( '?', 100, 100, 100 ) ],
		height: 1,
	}, object )
}

var actions = []

function action( object, act ) {
	;( function( object, act ) {
		actions.push( function() { act( object ) } )
	} )( object, act )
}

export { Object, actions, action }
