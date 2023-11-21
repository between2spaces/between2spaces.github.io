import Terminal from "./terminal.js";

export default function main(container) {
	const term = new Terminal([{ cols: 20, rows: 25 }], container);
	term.setBackground("#172b2c");

	term.put(0, 0, "╭");
	term.put(term.cols - 1, 0, "╮");
	term.setColour(Terminal.YELLOW);
	term.put(0, term.rows - 1, "╰");
	term.put(term.cols - 1, term.rows - 1, "╯");
	term.write(Math.floor(term.cols / 2), Math.floor(term.rows / 2), " ░▒▓█");
	term.write(18, 4, "123456");
	term.write(18, 7, " ░▓ ▓░ ");
	term.write(18, 8, " ░▓ ▓░ ");
	term.write(19, 25, "▓▓▓░▓▓▓");
}
