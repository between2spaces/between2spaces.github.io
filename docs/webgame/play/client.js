import { Terminal, COLOUR } from "./terminal.js";

export default function main(container) {
	const term = new Terminal(container);
	term.setBackground("#172b2c");
	const layer0 = term.getLayer(0);
	layer0.setColour(COLOUR.YELLOW);
	layer0.write(0, 0, "▓▓▓▓alsztest0123456789");//01234");

	//const layer1 = term.getLayer(1);
	//layer1.write(0, 0, "0123456789");//01234");
	//term.write(0, 1, "23");//01234");
	//term.put(term.cols - 1, 0, "╮");
	//term.setColour(Terminal.YELLOW);
	//term.put(0, term.rows - 1, "╰");
	//term.put(term.cols - 1, term.rows - 1, "╯");
	//term.write(Math.floor(term.cols / 2), Math.floor(term.rows / 2), " ░▒▓█");
	//term.write(18, 4, "123456");
	//term.write(18, 7, " ░▓ ▓░ ");
	//term.write(18, 8, " ░▓ ▓░ ");
	//term.write(19, 25, "▓▓▓░▓▓▓");
}
