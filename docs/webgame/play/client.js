//import './websocket.js';
import { TUI } from './tui.js';

export default function main(container) {

	const tui = new TUI(container, {width:15, height: 10});

	const uiBottomFrame = tui.createWindow({top: tui.height - 1, rows:1});
	uiBottomFrame.setColour([0.3, 0.3, 0.3, 1]);
	uiBottomFrame.write('█'.repeat(tui.width));

	const uiBottomFrameTx = tui.createWindow({top: tui.height - 1, rows:1});
	uiBottomFrameTx.setColour([0.24, 0.24, 0.24, 1]);
	uiBottomFrameTx.write('░'.repeat(tui.width));

	tui.update();

	tui.setView(-1, 8, 20, 15);

	tui.update();

	uiBottomFrame.resize(15, 1);

	tui.update();

}



