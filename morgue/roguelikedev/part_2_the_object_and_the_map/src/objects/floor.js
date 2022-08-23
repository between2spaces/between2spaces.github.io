import * as object from './object'
import Glyph from '../glyph'
import * as colour from '../colour'

function Floor( floor ) {
	return object.Object( Object.assign( {}, {
		glyphs: [ Glyph( '∙', 60, 60, 60 ) ],
		fill: colour.Colour( 70, 70, 70 ),
		z: 128,
		height: 0,
	}, floor ) )
}

export { Floor }