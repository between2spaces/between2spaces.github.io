import * as object from './object'
import Glyph from '../glyph'

function NPC( npc ) {
	npc = object.Object( Object.assign( {}, {
		type: 'npc',
		glyphs: [ Glyph( '@', 200, 200, 0 ) ],
		height: 10,
	}, npc ) )
	object.action( npc, act )
	return npc
}

function act( npc ) {
}

export default NPC