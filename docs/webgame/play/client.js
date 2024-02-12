//import './websocket.js';
import { TUI } from './tui.js';

export default function main(container) {
	const tui = new TUI(container);
	const tuiWin = tui.createWindow({cols: 6, rows: 1, width: 4, height: 1});
	tuiWin.write('ABCDEF');
	tui.update();
}



