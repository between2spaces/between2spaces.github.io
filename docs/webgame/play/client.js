//import './websocket.js';
import { TUI } from './tui.js';

export default function main(container) {

	const tui = new TUI(container);
	const tuiWin = tui.createWindow({cols: 6, rows: 3, width: 6, height: 3});
	tuiWin.write('ABCDEFGHIJKLMNOPQRSTUVQXYZ');
	tui.update();

}



