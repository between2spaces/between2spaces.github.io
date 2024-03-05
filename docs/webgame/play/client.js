//import './websocket.js';
import { TUI } from './tui.js';

export default function main(container) {
	const tui = new TUI(container);
	const tuiWin = tui.createWindow({cols: 6, rows: 3, width: 7, height: 3});
	tuiWin.write('ABCDEF');
	tui.update();
}



