import * as colour from './colour'

function Glyph( ch, r, g, b ) {
	return { ch: ch, fg: colour.Colour( r, g, b ) }
}

export default Glyph