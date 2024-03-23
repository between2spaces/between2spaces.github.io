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

}



