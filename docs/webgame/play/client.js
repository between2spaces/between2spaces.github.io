import './websocket.js';
import { GlyphRenderer } from './glyphrenderer.js';

export default function main(container) {
	const term = new GlyphRenderer(container, { panes: 2, cols: 20, rows: 10 });
	const background = term.panes[0];
	const chars = '░▒▓█';
	background.setColour('#33a');
	for (let row = 0; row < background.rows; row++) {
		for (let col = 0; col < background.cols; col++) {
			background.put(col, row, chars[Math.floor(Math.random() * chars.length)]);
		}
	}

	const foreground = term.panes[1];
	foreground.setColour('#f3f');
	foreground.write(0, 0, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
				'abcdefghijklmnopqrstuvwxyz~!@#$%^&*(' +
				')_+[]{}\\|;\':",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└' +
				'←↑→↓↖↗↘↙↔↕');

	foreground.setColour('#000d');
	foreground.write(Math.floor(foreground.cols * 0.5), Math.floor(foreground.rows * 0.5), '██████');
	foreground.write(Math.floor(foreground.cols * 0.5), Math.floor(foreground.rows * 0.5) + 1, '██████');

	function animate(timestamp) {
		requestAnimationFrame(animate);
		term.update();
	}

	animate();

}



