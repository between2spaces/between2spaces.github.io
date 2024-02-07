//import './websocket.js';
import { TUI } from './tui.js';

export default function main(container) {
	const tui = new TUI(container);
	const tuiWin = tui.createWindow({width: 3, height: 3});
	tuiWin.write('ABCDEF');
	tui.update();
}



