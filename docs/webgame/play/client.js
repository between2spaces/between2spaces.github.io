import './websocket.js';
import { GlyphRenderer, COLOURS } from './glyphrenderer.js';

export default function main(container) {
	const term = new GlyphRenderer(container, { panes: 2 });
	const behind = term.panes[0];
	const chars = '░▒▓█';
	behind.setColour('#333');
	for (let row = 0; row < behind.rows; row++) {
		for (let col = 0; col < behind.cols; col++) {
			term.panes[0].put(col, row, chars[Math.floor(Math.random() * chars.length)]);
		}
	}
	term.panes[1].setColour('#aff');
	term.panes[1].write(0, 0, '');
}
