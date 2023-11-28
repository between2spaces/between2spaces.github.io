import './websocket.js';
import { Terminal, COLOURS } from './terminal.js';

export default function main(container) {
	const term = new Terminal(container, {panes: 2});
	const behind = term.panes[0];
	const chars = '░▒▓█';
	behind.setColour('#333');
	for (let row = 0; row < behind.rows; row++){
		for (let col = 0; col < behind.cols; col++) {
			term.panes[0].put(col, row, chars[Math.floor(Math.random() * chars.length)]);
		}
	}
	term.panes[1].write(0, 0, 'alsztest0123456789');
}
