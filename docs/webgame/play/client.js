//import './websocket.js';
import { TUI } from './tui.js';

export default function main(container) {
	const tui = new TUI(container, { width: 2, height: 2, viewLeft: 0.5, viewTop: 0.5, clear: [1.0, 1.0, 1.0, 1.0] });
	tui.setCharacterSet(
		'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
		'abcdefghijklmnopqrstuvwxyz~!@#$%^&*(' +
		')_+[]{}\\|;\':",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└' +
		'←↑→↓↖↗↘↙↔↕▢╱╲⯭⌂',
		2048,
	);
	const map = tui.createWindow({ cols: 3, rows: 3 });
	map.setColour([0.7, 0.7, 0.7, 1]);
	map.write(
		'⯭ ⯭' +
		' ⌂ ' +
		'⯭ ⯭'
	);


	window.addEventListener('keydown', (event) => {
		if (event.isComposing || event.keyCode === 229) return;
		let translateCols = 0;
		let translateRows = 0;
		if (event.key === 'k') translateRows = -1;
		else if (event.key === 'j') translateRows = 1;
		if (translateRows !== 0 || translateCols !== 0) {
			//uiBottomFrameTx.translate(translateCols, translateRows);
			tui.update();
		}
	});
}
