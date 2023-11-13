export default class Terminal {
	constructor(container) {
		this.container = container;
		this.buffer = [bufferSize * bufferSize];
		this.grid = document.createElement('div');
		this.grid.style.position = 'absolute';
		this.grid.style.display = 'grid';
		this.grid.style.height = '100%';
		this.grid.style.fontFamily = 'monospace';
		this.grid.style.whiteSpace = 'pre';
		this.setDisplayLines();
		container.append(this.grid);
		const self = this;
		window.addEventListener('resize', () => self.setDisplayLines());
	}

	setDisplayLines(lines = this.lines || 20) {
		this.grid.style.fontSize = `${100 / fontMetrics.heightRatio / lines}vh`;
		const columns = Math.ceil(
			this.container.clientWidth /
				((this.container.clientHeight / lines) * fontMetrics.widthRatio)
		);
		this.grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
		this.grid.style.gridTemplateRows = `repeat(${lines}, 1fr)`;
		const oldCells = this.cells;
		this.cells = [];

		let line = 0;

		while (line < lines) {
			let column = 0;

			while (column < columns) {
				let cell;

				if (line < this.lines && column < this.columns) {
					/* Reuse existing div for this cell */
					cell = oldCells[column + line * this.columns];
				} else {
					cell = document.createElement('div');
					cell.style.gridColumnStart = column + 1;
					cell.style.gridRowStart = line + 1;
					cell.textContent = this.buffer[column + line * bufferSize] || '';
					this.grid.append(cell);
				}

				this.cells.push(cell);
				column++;
			}

			while (column < this.columns) {
				/* Remove previous div that fall outside view */
				oldCells[column + line * this.columns].remove();
				column++;
			}

			line++;
		}

		while (line < this.lines) {
			/* Remove previous div that fall outside view */
			for (let column = 0; column < this.columns; column++) {
				oldCells[column + line * this.columns].remove();
			}

			line++;
		}

		this.lines = lines;
		this.columns = columns;
	}

	put(column, line, char) {
		this.buffer[column + line * bufferSize] = char;

		if (line < this.lines && column < this.columns) {
			this.cells[column + line * this.columns].textContent = char;
		}
	}
}

const fontMetrics = (() => {
	const div = document.createElement('span');
	div.style.display = 'inline-block';
	div.style.fontSize = '100px';
	div.style.fontFamily = 'monospace';
	div.textContent = '▓';
	document.body.append(div);
	const widthRatio = div.clientWidth / div.clientHeight;
	const heightRatio = div.clientHeight / 100;
	div.remove();
	return { widthRatio, heightRatio };
})();

const bufferSize = 9999;
