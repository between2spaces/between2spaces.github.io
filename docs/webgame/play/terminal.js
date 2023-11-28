export class Terminal {
	constructor(container = document.body, defaults = {}) {
		this.container = container;
		this.defaults = Object.assign({
			cols: 20,
			rows: 20,
			wrap: true,
			background: '#172b2c',
			colour: COLOURS.WHITE,
			panes: 1
		}, defaults);

		this.context = createWebGLContext(container);
		this.gl = this.context.gl;

		this.shader = createShader(this.gl);
		this.gl.useProgram(this.shader.program);
		this.gl.uniform1i(this.shader.uniforms.fontTexture, 0);
		this.gl.uniform1i(this.shader.uniforms.paneTexture, 1);

		this.setBackground(this.defaults.background);

		this.panes = [];

		for (let index = 0; index < this.defaults.panes; index++) {
			this.addPane();
		}

		resizeObserver.observe(container);

		this.projection = { near: 0, far: 100 };
		this.setView(0, 0, this.panes[0].cols - 1, this.panes[0].rows - 1);
		this.setCharacterSet(
			'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
				'abcdefghijklmnopqrstuvwxyz~!@#$%^&*(' +
				')_+[]{}\\|;\':",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└' +
				'←↑→↓↖↗↘↙↔↕',
		);

		terminals.push(this);

		this.dirty = true;
	}

	addPane(params={}) {

		params = Object.assign({
			cols: this.defaults.cols,
			rows: this.defaults.rows,
			colour: this.defaults.colour,
			wrap: this.defaults.wrap
		}, params);

		params.terminal = this;

		const pane = new Pane(params);

		if (params.index === undefined || params.index >= this.panes.length) {
			this.panes.push(pane);
		} else {
			if (params.index <= 0) {
				this.panes.unshift(pane);
			} else {
				this.panes.splice(params.index, pane);
			}
		}

		for (let index in this.panes) {
			this.panes[index].index = index;
		}

		return pane;
	}

	getPane(index = 0) {
		return this.panes[index];
	}

	setBackground(colour) {
		const rgba = typeof colour === 'string' ? hexToRgba(colour) : colour;
		this.context.gl.clearColor(...rgba);
	}

	fitContainer() {
		const canvas = this.context.canvas;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		this.context.gl.viewport(0, 0, canvas.width, canvas.height);
		this.dirty = true;
	}

	zoom(delta) {
		this.projection.left *= delta;
		this.projection.right *= delta;
		this.projection.top *= delta;
		this.projection.bottom *= delta;
		this.setView(width, height);
	}

	setView(left, top, right, bottom) {
		const projection = this.projection;
		const near = projection.near;
		const far = projection.far;

		/* Make right and bottom inclusive bounds i.e. setView(7, 7, 7, 7) => 1 visable cell at 7, 7 */
		right += 1;
		bottom += 1;

		projection.right = right;
		projection.left = left;
		projection.top = top;
		projection.bottom = bottom;

		const lr = 1 / (left - right);
		const bt = 1 / (bottom - top);
		const nf = 1 / (near - far);

		this.projectionMatrix = [
			-2 * lr, 0, 0, 0,
			0, -2 * bt, 0, 0,
			0, 0, 2 * nf, 0,
			(left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
		];

		this.context.gl.uniformMatrix4fv(
			this.shader.uniforms.projectionMatrix,
			false,
			this.projectionMatrix,
		);

		this.dirty = true;
	}

	setCharacterSet(characters, size = 2048, fontFamily = 'monospace') {
		const gl = this.context.gl;
		const { texture, uvs } = createCharactersTexture(gl, characters, size);

		this.fontTexture = texture;
		this.charUVs = uvs;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
	}

	render() {
		const gl = this.context.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		for (let pane of this.panes) {
			pane.render();
		}
		this.dirty = false;
	}
}

class Pane {
	constructor(params={}) {
		Object.assign(this, params);
		this.indicesPerRow = this.cols * 4 + 2;
		this.indices = this.indicesPerRow * this.rows - 2;

		this.gl = this.terminal.context.gl;
		this.attribs = this.terminal.shader.attributes;
		this.uniforms = this.terminal.shader.uniforms;

		this.paneMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

		let colours = [];
		let vertices = degeneratedTriangleStripeVertices(this.cols, this.rows);
		let textureCoord = new Array(vertices.length);

		let top = 1 + this.rows * 0.5;

		for (let row = 0; row < this.rows; row++) {
			top--;

			let bottom = top - 1;
			let left = -1 - this.cols * 0.5;

			for (let col = 0; col < this.cols; col++) {
				left++;

				let right = left + 1;

				if (row > 0 && col === 0) {
					colours.push(0.0, 0.0, 0.0, 0.0);
					colours.push(0.0, 0.0, 0.0, 0.0);
					colours.push(0.0, 0.0, 0.0, 0.0);
				}

				colours.push(0.0, 0.0, 0.0, 0.0);
				colours.push(0.0, 0.0, 0.0, 0.0);
				colours.push(0.0, 0.0, 0.0, 0.0);
				colours.push(0.0, 0.0, 0.0, 0.0);

				if (col === this.cols - 1) {
					colours.push(0.0, 0.0, 0.0, 0.0);
				}
			}
		}
		/* Vertices   Array of Uint16 [0 to 65536] -> 2 Unsigned Shorts per vertex */
		this.vertices = {
			typedArray: new Uint16Array(vertices),
			buffer: this.gl.createBuffer(),
			dirty: true,
		};

		/* Texture coordinates   Array of Uint16 -> 2 Unsigned Shorts per vertex */
		this.textureCoord = {
			typedArray: new Float32Array(textureCoord),
			buffer: this.gl.createBuffer(),
			dirty: true,
		};

		this.colours = {
			typedArray: new Float32Array(colours),
			buffer: this.gl.createBuffer(),
			dirty: true,
		};

		this.vao = this.gl.createVertexArray();
		this.gl.bindVertexArray( this.vao );

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertices.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices.typedArray, this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.attribs.vertexPosition, 2, this.gl.UNSIGNED_SHORT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.attribs.vertexPosition);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoord.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureCoord.typedArray, this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.attribs.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.attribs.textureCoord);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colours.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.colours.typedArray, this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.attribs.colour, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.attribs.colour);


		this.gl.bindVertexArray( null );

		this.terminal.dirty = true;
	}

	translate(x, y) {
		this.paneMatrix[12] += x;
		this.paneMatrix[13] += y;
	}

	setColour(colour) {
		const rgba = typeof colour === 'string' ? hexToRgba(colour) : colour;
		this.colour = rgba;
	}

	put(col, row, char) {
		if (!this.wrap && (col >= this.cols || row >= this.rows)) {
			return;
		}

		if (col >= this.cols) {
			row += Math.floor(col / this.cols);
			col = col % this.cols;
		}

		if (row >= this.rows) return;

		const charUVs = this.terminal.charUVs[char];
		let indices = row * this.indicesPerRow + col * 4;
		let texIndex = indices * 2;

		const textureCoord = this.textureCoord;
		textureCoord.typedArray[texIndex] = charUVs[0];
		textureCoord.typedArray[texIndex + 1] = charUVs[1];
		textureCoord.typedArray[texIndex + 2] = charUVs[2];
		textureCoord.typedArray[texIndex + 3] = charUVs[3];
		textureCoord.typedArray[texIndex + 4] = charUVs[4];
		textureCoord.typedArray[texIndex + 5] = charUVs[5];
		textureCoord.typedArray[texIndex + 6] = charUVs[6];
		textureCoord.typedArray[texIndex + 7] = charUVs[7];

		textureCoord.dirty = true;

		let colIndex = indices * 4;

		const colours = this.colours;
		const colour = this.colour;
		colours.typedArray[colIndex] = colour[0];
		colours.typedArray[colIndex + 1] = colour[1];
		colours.typedArray[colIndex + 2] = colour[2];
		colours.typedArray[colIndex + 3] = colour[3];
		colours.typedArray[colIndex + 4] = colour[0];
		colours.typedArray[colIndex + 5] = colour[1];
		colours.typedArray[colIndex + 6] = colour[2];
		colours.typedArray[colIndex + 7] = colour[3];
		colours.typedArray[colIndex + 8] = colour[0];
		colours.typedArray[colIndex + 9] = colour[1];
		colours.typedArray[colIndex + 10] = colour[2];
		colours.typedArray[colIndex + 11] = colour[3];
		colours.typedArray[colIndex + 12] = colour[0];
		colours.typedArray[colIndex + 13] = colour[1];
		colours.typedArray[colIndex + 14] = colour[2];
		colours.typedArray[colIndex + 15] = colour[3];

		colours.dirty = true;
	}

	write(col, row, string) {
		for (let char of string) {
			this.put(col++, row, char);
		}
	}

	render() {
		if (this.textureCoord.dirty) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoord.buffer);
			this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.textureCoord.typedArray);
			this.textureCoord.dirty = false;
		}

		if (this.colours.dirty) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colours.buffer);
			this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.colours.typedArray);
			this.colours.dirty = false;
		}

		this.gl.bindVertexArray(this.vao);
		this.gl.uniformMatrix4fv(this.uniforms.paneMatrix, false, this.paneMatrix);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.indices);
	}

}



export const COLOURS = {
	BLACK: [0, 0, 0, 1],
	WHITE: [1, 1, 1, 1],
	YELLOW: [1, 1, 0.6, 1],
	RED: [1, 0, 0, 1],
};

function createWebGLContext(container) {
	const canvas = document.createElement('canvas');
	container.append(canvas);
	const gl = canvas.getContext('webgl2', { antialias: false });
	gl.clearDepth(1.0);
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	return { canvas, gl };
}

function createShader(gl) {
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(
		vertexShader,
		`#version 300 es
		in vec2 aPosition;
		in vec2 aTextureCoord;
		in vec4 aColour;
		uniform mat4 uProjectionMatrix;
		uniform mat4 uPaneMatrix;
		uniform sampler2D uFontTexture;
		uniform sampler2D uPaneTexture;
		out vec2 vTextureCoord;
		out vec4 vColour;
		void main() {
			ivec2 size = textureSize(uFontTexture, 0);
			vTextureCoord = aTextureCoord;
			vColour = aColour;
			gl_Position = uProjectionMatrix * uPaneMatrix * vec4(aPosition.x, aPosition.y, 0.0, 1.0);
		}
	`,
	);
	gl.compileShader(vertexShader);

	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vertexShader));
	}

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(
		fragmentShader,
		`#version 300 es
		precision highp float;
		in vec2 vTextureCoord;
		in vec4 vColour;
		uniform sampler2D uFontTexture;
		out vec4 outColor;
		void main() {
			outColor = texture(uFontTexture, vTextureCoord) * vColour;
		}
	`,
	);
	gl.compileShader(fragmentShader);

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(fragmentShader));
	}

	const program = gl.createProgram();

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
	}

	const attributes = {
		vertexPosition: gl.getAttribLocation(program, 'aPosition'),
		textureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
		colour: gl.getAttribLocation(program, 'aColour'),
	};

	const uniforms = {
		projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
		paneMatrix: gl.getUniformLocation(program, 'uPaneMatrix'),
		fontTexture: gl.getUniformLocation(program, 'uFontTexture'),
		paneTexture: gl.getUniformLocation(program, 'uPaneTexture'),
	};

	return { program, attributes, uniforms };
}

function createCharactersTexture(gl, characters, size = 1024) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d');

	ctx.clearRect(0, 0, size, size);
	ctx.fillStyle = 'white';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	let font = size * 0.5;
	let metrics;
	let cols;
	let height;
	let uvs = {};

	do {
		ctx.font = `${font--}px monospace`;
		metrics = ctx.measureText('█');
		cols = Math.floor(size / metrics.width);
		height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
	} while (cols * Math.floor(size / height) < characters.length);

	for (let i = 0, l = characters.length; i < l; i++) {
		let y = metrics.actualBoundingBoxAscent + Math.floor(i / cols) * height;
		let x = metrics.width * 0.5 + (i % cols) * metrics.width;
		ctx.fillText(characters[i], x, y);
		let left = (x - 0.5 * metrics.width) / size;
		let top = (y - metrics.actualBoundingBoxAscent) / size;
		let right = (x + 0.5 * metrics.width) / size;
		let bottom = (y + metrics.actualBoundingBoxDescent) / size;
		uvs[characters[i]] = [left, bottom, left, top, right, bottom, right, top];
	}

	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

	return { texture, uvs };
}

function degeneratedTriangleStripeVertices(cols, rows) {
	const vertices = [];

	for (let row = 0; row < rows; row++) {
		let col = 0;
		while (col < cols) {
			vertices.push(col, row + 1, col, row, col + 1, row + 1, col + 1, row);
			col++;
		}
		if (row < rows - 1) {
			vertices.push(col, row, 0, row + 2);
		}
	}

	return vertices;
}

function hexToRgba(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	hex = hex.replace(
		/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
		(m, r, g, b) => r + r + g + g + b + b,
	);

	const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return rgb
		? [
			parseInt(rgb[1], 16) / 255.0,
			parseInt(rgb[2], 16) / 255.0,
			parseInt(rgb[3], 16) / 255.0,
			1,
		  ]
		: null;
}

const terminals = [];

function updateFrame() {
	requestAnimationFrame(updateFrame);

	for (let terminal of terminals) {
		if (terminal.dirty) {
			terminal.render();
		}
	}
}

updateFrame();

const resizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		for (let terminal of terminals) {
			if (entry.target === terminal.container) {
				terminal.fitContainer();
			}
		}
	}
});
