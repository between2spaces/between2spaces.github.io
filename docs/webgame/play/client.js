//import './websocket.js';
import { TUI } from './tui.js';

export default function main(container) {
	const tui = new TUI(container, { width: 10, height: 10 });

	const map = tui.createWindow();
	map.write(
		'          ' +
		'        ▢ ' +
		'       ╱  ' +
		'      ╱   ' +
		'     ▢    ' +
		'          ' +
		'          ' +
		'          ' +
		'          ' +
		'          '
	);

	const chatinput = tui.createWindow({wrap: false});
	chatinput.write('abcdefghijklmnopqrstuvwxyz');
	

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
