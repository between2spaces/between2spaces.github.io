import * as gl_utils from './gl_utils.js';

export class TUI {
	constructor(container = document.body, defaults = {}) {
		this.viewLeft = 0;
		this.viewTop = 0;
		this.width = 5;
		this.height = 10;

		Object.assign(this, defaults);

		this.container = container;
		this.context = gl_utils.createContext(container);

		const gl = (this.gl = this.context.gl);
		const shader = (this.shader = gl_utils.createShader(
			gl,
			`#version 300 es
			precision highp float;
			in vec2 aPosition;
			uniform mat4 uProjectionMatrix;
			uniform mat4 uPaneMatrix;
			uniform sampler2D uFontTexture;
			uniform ivec2 uFontColsRows;
			uniform ivec2 uFontUsedSize;
			uniform sampler2D uGlyphColour;
			uniform sampler2D uGlyphColRow;
			uniform ivec2 uPaneColsRows;
			out vec2 vUV;
			out vec4 vColour;
			void main() {
				float fPerRow = float(uPaneColsRows.x * 4 + 2);
				float fVertex = float(gl_VertexID);
				float fCol = floor((fVertex - floor((fVertex + 0.5) / fPerRow) * fPerRow) + 0.5) / 4.0;
				float fRow = floor((fVertex + 1.0) / fPerRow);

				vColour = texelFetch(uGlyphColour, ivec2(fCol, fRow), 0);

				vec4 vTexel = texelFetch(uGlyphColRow, ivec2(fCol, fRow), 0);
				vec2 vGlyph = vec2(vTexel) * 255.0;
				ivec2 fontSize = textureSize(uFontTexture, 0);
				vec2 usedSize = vec2(uFontUsedSize) / vec2(fontSize);

				vec2 uvUnit = vec2(usedSize.x / float(uFontColsRows.x), usedSize.y / float(uFontColsRows.y)); 

				vUV = usedSize * (vGlyph / vec2(uFontColsRows));

				int corner = (gl_VertexID - int(fRow) * 2) % 4;

				if (corner == 0 || corner == 2) vUV.y = vUV.y + uvUnit.y;
				if (corner == 2 || corner == 3) vUV.x = vUV.x + uvUnit.x;

				gl_Position = uProjectionMatrix * uPaneMatrix * vec4(aPosition.x, aPosition.y, 0.0, 1.0);
			}
		`,
			`#version 300 es
			precision highp float;
			in vec4 vColour;
			in vec2 vUV;
			uniform sampler2D uFontTexture;
			out vec4 outColor;
			void main() {
				outColor = texture(uFontTexture, vUV) * vColour;
			}
		`,
		));

		gl.useProgram(shader.program);

		shader.aPosition = gl.getAttribLocation(shader.program, 'aPosition');
		shader.uProjectionMatrix = gl.getUniformLocation(
			shader.program,
			'uProjectionMatrix',
		);
		shader.uPaneMatrix = gl.getUniformLocation(shader.program, 'uPaneMatrix');
		shader.uPaneColsRows = gl.getUniformLocation(
			shader.program,
			'uPaneColsRows',
		);
		shader.uFontTexture = gl.getUniformLocation(shader.program, 'uFontTexture');
		shader.uFontColsRows = gl.getUniformLocation(
			shader.program,
			'uFontColsRows',
		);
		shader.uFontUsedSize = gl.getUniformLocation(
			shader.program,
			'uFontUsedSize',
		);
		shader.uGlyphColour = gl.getUniformLocation(shader.program, 'uGlyphColour');
		shader.uGlyphColRow = gl.getUniformLocation(shader.program, 'uGlyphColRow');

		gl.uniform1i(shader.uFontTexure, 0);
		gl.uniform1i(shader.uGlyphColour, 1);
		gl.uniform1i(shader.uGlyphColRow, 2);

		this.fitContainer();

		this.setCharacterSet(
			'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
				'abcdefghijklmnopqrstuvwxyz~!@#$%^&*(' +
				')_+[]{}\\|;\':",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└' +
				'╱╲←↑→↓↖↗↘↙↔↕',
			2048,
		);

		this.projection = { near: 0, far: 100 };
		this.windows = [];

		this.setView(
			this.viewLeft,
			this.viewTop,
			this.viewLeft + this.width,
			this.viewTop + this.height,
		);
		tuis.push(this);
		resizeObserver.observe(container);
		this.dirty = true;
	}

	createWindow(params = {}) {
		params.tui = this;
		return new Window(params);
	}

	getWindow(index = 0) {
		return this.windows[index];
	}

	static hexToRGBA(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		hex = hex.replace(
			/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
			(m, r, g, b) => r + r + g + g + b + b + 'ff',
		);

		hex = hex.replace(
			/^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])$/i,
			(m, r, g, b, a) => r + r + g + g + b + b + a + a,
		);

		const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
			hex,
		);

		return [
			parseInt(rgb ? rgb[1] : '0', 16) / 255.0,
			parseInt(rgb ? rgb[2] : '0', 16) / 255.0,
			parseInt(rgb ? rgb[3] : '0', 16) / 255.0,
			parseInt(rgb ? rgb[4] : '1', 16) / 255.0,
		];
	}

	fitContainer() {
		const canvas = this.context.canvas;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		this.context.gl.viewport(0, 0, canvas.width, canvas.height);
		this.dirty = true;
		this.update();
	}

	zoom(delta) {
		this.projection.left *= delta;
		this.projection.right *= delta;
		this.projection.top *= delta;
		this.projection.bottom *= delta;
		this.setView(
			this.projection.left,
			this.projection.top,
			this.projection.right,
			this.projection.bottom,
		);
	}

	setView(left, top, right, bottom) {
		const projection = this.projection;
		const near = projection.near;
		const far = projection.far;

		projection.right = right;
		projection.left = left;
		projection.top = top;
		projection.bottom = bottom;

		const lr = 1 / (left - right);
		const bt = 1 / (bottom - top);
		const nf = 1 / (near - far);

		this.projectionMatrix = [
			-2 * lr,
			0,
			0,
			0,
			0,
			-2 * bt,
			0,
			0,
			0,
			0,
			2 * nf,
			0,
			(left + right) * lr,
			(top + bottom) * bt,
			(far + near) * nf,
			1,
		];

		this.context.gl.uniformMatrix4fv(
			this.shader.uProjectionMatrix,
			false,
			this.projectionMatrix,
		);

		this.dirty = true;
	}

	setCharacterSet(characters, size = 1024, fontFamily = 'monospace') {
		const gl = this.context.gl;
		const { canvas, ctx, texture } = gl_utils.createCanvasTexture(gl, size);

		ctx.clearRect(0, 0, size, size);
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		let font = size * 0.5;
		let metrics;
		let cols;
		let rows;
		let width;
		let height;

		this.fontTextureSize = size;
		this.charUVs = {};

		do {
			ctx.font = `${font--}px ${fontFamily}`;
			metrics = ctx.measureText('█');
			width = Math.ceil(metrics.width);
			cols = Math.floor(size / width);
			height = Math.ceil(
				metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
			);
			rows = Math.floor(size / height);
		} while (cols * rows < characters.length);

		gl.uniform2i(this.shader.uFontColsRows, cols, rows);
		gl.uniform2i(this.shader.uFontUsedSize, cols * width, rows * height);

		// each character is first painted to a one character canvas and then
		// copied over to the full character set canvas with the edges of the
		// painted character removed to force a 1 pixel clean border/character
		const charCanvas = document.createElement('canvas');
		charCanvas.width = width;
		charCanvas.height = height;
		const charCtx = charCanvas.getContext('2d');
		charCtx.fillStyle = 'white';
		charCtx.textAlign = 'center';
		charCtx.textBaseline = 'middle';
		charCtx.font = `${font--}px ${fontFamily}`;

		for (let i = 0, l = characters.length; i < l; i++) {
			let y = Math.round(Math.floor(i / cols) * height);
			let x = Math.round((i % cols) * width);

			charCtx.clearRect(0, 0, width, height);
			charCtx.fillText(
				characters[i],
				0.5 * width,
				metrics.actualBoundingBoxAscent,
			);
			ctx.drawImage(charCanvas, x + 1, y + 1, width - 2, height - 2);

			//let left = x / size;
			//let top = y / size;
			//let right = (x + width) / size;
			//let bottom = (y + height) / size;
			let charCol = i % cols;
			let charRow = Math.floor(i / cols);

			this.charUVs[characters[i]] = { col: charCol, row: charRow };
		}

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	}

	update() {
		if (!this.dirty || !this.windows) {
			return;
		}

		const gl = this.context.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		for (let win of this.windows) {
			win.render();
		}

		this.dirty = false;
	}
}

class Window {
	constructor(params = {}) {
		params = Object.assign(
			{
				left: 0,
				top: 0,
				cols: params.tui.width,
				rows: params.tui.height,
				colour: COLOURS.WHITE,
				wrap: true,
				zIndex: params.tui.windows.length,
				text: ''
			},
			params,
		);

		Object.assign(this, params);

		this.gl = this.tui.context.gl;

		if (
			params.zIndex === undefined ||
			params.zIndex >= this.tui.windows.length
		) {
			this.tui.windows.push(this);
		} else {
			if (params.zIndex <= 0) {
				this.tui.windows.unshift(this);
			} else {
				this.tui.windows.splice(params.zIndex, this);
			}
		}

		for (let index in this.tui.windows) {
			this.tui.windows[index].zIndex = index;
		}

		this.paneMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

		this.vao = this.gl.createVertexArray();
		this.setColour(COLOURS.WHITE);
		this.resize(this.cols, this.rows, this.width, this.height);

		this.cursor = { col: 0, row: 0 };

		this.translate(0, 0);
		if (this.text !== '') this.write(this.text);
	}

	resize(cols, rows, width = null, height = null) {
		this.cols = cols;
		this.rows = rows;
		this.width = width || this.width || cols;
		this.height = height || this.height || rows;

		this.indicesPerRow = this.cols * 4 + 2;
		this.indices = this.indicesPerRow * this.rows - 2;

		this.paneSize = new Uint16Array([this.cols, this.rows]);

		let pow = 1;

		// Calculate minimum power of 2 texture size to hold per pixel glyph information
		while (Math.pow(2, pow) < Math.max(this.cols, this.rows)) {
			pow++;
		}

		const size = Math.pow(2, pow);

		this.glyphColour = gl_utils.createCanvasTexture(this.gl, size);
		this.glyphColRow = gl_utils.createCanvasTexture(this.gl, size);

		// build degenerated triangle stripe vertices
		const sWidth = this.width / this.cols;
		const sHeight = this.height / this.rows;

		const vertices = [];

		for (let y = 0, row = 0; row < this.rows; row++, y += sHeight) {
			let x = 0;

			for (let col = 0; col < this.cols; col++, x += sWidth) {
				vertices.push(
					x,
					y + sHeight,
					x,
					y,
					x + sWidth,
					y + sHeight,
					x + sWidth,
					y,
				);
			}

			if (row < this.rows) {
				vertices.push(x, y, 0, y + 2 * sHeight);
			}
		}

		this.vertices = {
			typedArray: new Float32Array(vertices),
			buffer: this.gl.createBuffer(),
		};

		this.vao = this.gl.createVertexArray();
		this.gl.bindVertexArray(this.vao);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertices.buffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.vertices.typedArray,
			this.gl.STATIC_DRAW,
		);
		this.gl.vertexAttribPointer(
			this.tui.shader.aPosition,
			2,
			this.gl.FLOAT,
			false,
			0,
			0,
		);
		this.gl.enableVertexAttribArray(this.tui.shader.aPosition);
		this.gl.bindVertexArray(null);

		this.tui.dirty = false;
	}

	translate(cols, rows) {
		this.paneMatrix[12] = this.left += cols;
		this.paneMatrix[13] = this.top += rows;
		this.tui.dirty = true;
	}

	setColour(colour) {
		this.rgba = typeof colour === 'string' ? TUI.hexToRGBA(colour) : colour;
	}

	move(col, row) {
		this.cursor.row = row;

		if (this.wrap && col === this.cols) {
			this.cursor.row += Math.floor(col / this.cols);
			this.cursor.col = col % this.cols;
		} else {
			this.cursor.col = col;
		}
	}

	write(string, col = null, row = null) {
		const colourData = this.glyphColour.imageData.data;
		const colrowData = this.glyphColRow.imageData.data;
		const r = this.rgba[0] * 255;
		const g = this.rgba[1] * 255;
		const b = this.rgba[2] * 255;
		const a = this.rgba[3] * 255;

		this.glyphColour.dirty = true;
		this.glyphColRow.dirty = true;

		if (col !== null && row !== null) {
			this.move(col, row);
		}

		for (let char of string) {
			if (char === '\n') {
				this.cursor.col = 0;
				this.cursor.row++;
				continue;
			}
			if (!this.wrap && this.cursor.col >= this.cols) break;

			if (this.cursor.row >= this.rows) break;

			const i =
				(this.glyphColour.canvas.width * this.cursor.row + this.cursor.col) * 4;
			const charUVs = this.tui.charUVs[char];

			colourData[i] = r;
			colourData[i + 1] = g;
			colourData[i + 2] = b;
			colourData[i + 3] = a;

			colrowData[i] = charUVs.col;
			colrowData[i + 1] = charUVs.row;
			colrowData[i + 3] = 255;

			this.move(this.cursor.col + 1, this.cursor.row);
		}

		this.tui.dirty = true;
	}

	render() {
		const gl = this.gl;

		gl.bindVertexArray(this.vao);
		gl_utils.activeBindUpdateTexture(gl, gl.TEXTURE1, this.glyphColour);
		gl_utils.activeBindUpdateTexture(gl, gl.TEXTURE2, this.glyphColRow);

		gl.uniformMatrix4fv(this.tui.shader.uPaneMatrix, false, this.paneMatrix);
		gl.uniform2i(this.tui.shader.uPaneColsRows, this.cols, this.rows);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.indices);
	}
}

export const COLOURS = {
	BLACK: [0, 0, 0, 1],
	WHITE: [1, 1, 1, 1],
	YELLOW: [1, 1, 0.6, 1],
	RED: [1, 0, 0, 1],
};

const tuis = [];

const resizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		for (let tui of tuis) {
			if (entry.target === tui.container) {
				tui.fitContainer();
			}
		}
	}
});
