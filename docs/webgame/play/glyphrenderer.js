export class GlyphRenderer {
	constructor(container = document.body, defaults = {}) {
		this.container = container;

		defaults = this.defaults = Object.assign(
			{
				cols: 20,
				rows: 20,
				wrap: true,
				background: '#172b2c',
				colour: COLOURS.WHITE,
				panes: 1,
			},
			defaults,
		);

		this.context = createWebGLContext(container);

		const gl = (this.gl = this.context.gl);
		const shader = (this.shader = createShader(
			gl,
			`#version 300 es
			precision highp float;
			in vec2 aPosition;
			in vec2 aTextureCoord;
			uniform mat4 uProjectionMatrix;
			uniform mat4 uPaneMatrix;
			uniform sampler2D uFontTexture;
			uniform sampler2D uPaneTexture;
			uniform ivec2 uPaneColsRows;
			out vec2 vTextureCoord;
			out vec4 vColour;
			out vec4 vGlyph;
			void main() {
				//ivec2 size = textureSize(uFontTexture, 0);
				int indicesPerRow = uPaneColsRows.x * 4 + 2;
				int row = int(floor(float(gl_VertexID) / float(indicesPerRow)));
				//int col = int((gl_VertexID - indicesPerRow * int(floor(float(gl_VertexID) / float(indicesPerRow)))) / 4);
				//int col = (gl_VertexID % indicesPerRow) / 4;
				float fVertexID = float(gl_VertexID);
				float fIndicesPerRow = float(indicesPerRow);
				float fCol = floor((fVertexID - floor((fVertexID + 0.5) / fIndicesPerRow) * fIndicesPerRow) + 0.5);
				int col = int(fCol) / 4;
				//ivec2 pixel = ivec2(aPosition.x), aPosition.y);
				//vec2 uv = vec2(0.5, 0.8);
				vec4 rgba = texelFetch(uPaneTexture, ivec2(col, row), 0);
				int rgbacr = (int(round(rgba.r * 255.0)) << 24) | (int(round(rgba.g * 255.0)) << 16) | (int(round(rgba.b * 255.0)) << 8) | int(round(rgba.a * 255.0));
				float red = float((rgbacr >> 27) & 0x1F) / 31.0;
				float green = float((rgbacr >> 22) & 0x1F) / 31.0;
				float blue = float((rgbacr >> 17) & 0x1F) / 31.0;
				float alpha = float((rgbacr >> 12) & 0x1F) / 31.0;
				vColour = vec4(red, green, blue, 1);
				//if (col == 8 && row == 0) vColour = vec4(0, 1, 0, 1);
				vTextureCoord = aTextureCoord;
				gl_Position = uProjectionMatrix * uPaneMatrix * vec4(aPosition.x, aPosition.y, 0.0, 1.0);
			}
		`,
			`#version 300 es
			precision highp float;
			in vec4 vGlyph;
			in vec2 vTextureCoord;
			in vec4 vColour;
			uniform sampler2D uFontTexture;
			uniform sampler2D uPaneTexture;
			out vec4 outColor;
			void main() {
				outColor = texture(uFontTexture, vTextureCoord) * vColour;
			}
		`,
		));

		gl.useProgram(shader.program);

		shader.aPosition = gl.getAttribLocation(shader.program, 'aPosition');
		shader.aTextureCoord = gl.getAttribLocation(
			shader.program,
			'aTextureCoord',
		);
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
		shader.uPaneTexture = gl.getUniformLocation(shader.program, 'uPaneTexture');

		// set which texture units to render with
		gl.uniform1i(shader.uFontTexure, 0); // texture unit 0
		gl.uniform1i(shader.uPaneTexture, 1); // texture unit 1

		this.setBackground(defaults.background);
		this.setCharacterSet(
			'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
				'abcdefghijklmnopqrstuvwxyz~!@#$%^&*(' +
				')_+[]{}\\|;\':",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└' +
				'←↑→↓↖↗↘↙↔↕',
		);

		this.projection = { near: 0, far: 100 };
		this.panes = [];

		for (let i = 0; i < this.defaults.panes; i++) {
			this.addPane();
		}

		this.setView(0, 0, this.panes[0].cols - 1, this.panes[0].rows - 1);
		renderers.push(this);
		resizeObserver.observe(container);
		this.dirty = true;
	}

	addPane(params = {}) {
		params = Object.assign(
			{
				cols: this.defaults.cols,
				rows: this.defaults.rows,
				colour: this.defaults.colour,
				wrap: this.defaults.wrap,
			},
			params,
		);

		params.renderer = this;

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
		const rgba = typeof colour === 'string' ? hex_to_rgba(colour) : colour;
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
		const { canvas, ctx, texture } = createCanvasTexture(gl, size);

		ctx.clearRect(0, 0, size, size);
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		let font = size * 0.5;
		let metrics;
		let cols;
		let height;

		this.fontTextureSize = size;
		this.charUVs = {};

		do {
			ctx.font = `${font--}px monospace`;
			metrics = ctx.measureText('█');
			cols = Math.floor(size / metrics.width);
			height =
				metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
		} while (cols * Math.floor(size / height) < characters.length);

		for (let i = 0, l = characters.length; i < l; i++) {
			let y = metrics.actualBoundingBoxAscent + Math.floor(i / cols) * height;
			let x = metrics.width * 0.5 + (i % cols) * metrics.width;
			ctx.fillText(characters[i], x, y);
			let left = (x - 0.5 * metrics.width) / size;
			let top = (y - metrics.actualBoundingBoxAscent) / size;
			let right = (x + 0.5 * metrics.width) / size;
			let bottom = (y + metrics.actualBoundingBoxDescent) / size;
			let charCol = i % cols & 0x3f; // 6 bits [0 to 63] for Col
			let charRow = Math.floor(i / cols) & 0x3f; // 6 bits [0 to 63] for Row
			this.charUVs[characters[i]] = [
				left,
				bottom,
				left,
				top,
				right,
				bottom,
				right,
				top,
				charCol,
				charRow,
			];
		}

		document.body.append(canvas);

		gl.activeTexture(gl.TEXTURE0 + 0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
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
	constructor(params = {}) {
		Object.assign(this, params);
		this.indicesPerRow = this.cols * 4 + 2;
		this.indices = this.indicesPerRow * this.rows - 2;

		const gl = (this.gl = this.renderer.context.gl);
		const shader = this.renderer.shader;

		this.paneMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		this.paneSize = new Uint16Array([this.cols, this.rows]);

		// create a white 256x256 texture to hold cell info
		const size = 256;
		this.paneTexture = createCanvasTexture(gl, size);
		this.paneTexture.ctx.fillStyle = 'white';
		this.paneTexture.ctx.fillRect(0, 0, size, size);

		document.body.append(this.paneTexture.canvas);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.paneTexture.texture);

		// Set the parameters so we don't need mips
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			this.paneTexture.canvas,
		);

		// build degenerated triangle stripe vertices for a colsxrows pane
		const vertices = [];

		for (let row = 0; row < this.rows; row++) {
			let col = 0;

			while (col < this.cols) {
				vertices.push(col, row + 1, col, row, col + 1, row + 1, col + 1, row);
				col++;
			}

			if (row < this.rows - 1) {
				vertices.push(col, row, 0, row + 2);
			}
		}

		let textureCoord = new Array(vertices.length);
		let colours = [];

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
			buffer: gl.createBuffer(),
			dirty: true,
		};

		/* Texture coordinates   Array of Uint16 -> 2 Unsigned Shorts per vertex */
		this.textureCoord = {
			typedArray: new Float32Array(textureCoord),
			buffer: gl.createBuffer(),
			dirty: true,
		};

		this.colours = { dirty: true };

		this.setColour(COLOURS.WHITE);

		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices.typedArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(shader.aPosition, 2, gl.UNSIGNED_SHORT, false, 0, 0);
		gl.enableVertexAttribArray(shader.aPosition);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoord.buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			this.textureCoord.typedArray,
			gl.STATIC_DRAW,
		);
		gl.vertexAttribPointer(shader.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shader.aTextureCoord);

		gl.bindVertexArray(null);

		this.renderer.dirty = true;
	}

	translate(x, y) {
		this.paneMatrix[12] += x;
		this.paneMatrix[13] += y;
	}

	setColour(colour) {
		this.rgba = typeof colour === 'string' ? hex_to_rgba(colour) : colour;
		// Bit reduce rgba8888 to rgba5555 + 12 bits for char col row
		// 32 - 12 = 20 / 4 = 5
		this.rgba5555 =
			(Math.round(this.rgba[0] * 31) << 27) |
			(Math.round(this.rgba[1] * 31) << 22) |
			(Math.round(this.rgba[2] * 31) << 17) |
			(Math.round(this.rgba[3] * 31) << 12);
	}

	put(col, row, char) {
		if (!this.wrap && (col >= this.cols || row >= this.rows)) {
			return;
		}

		if (col >= this.cols) {
			row += Math.floor(col / this.cols);
			col = col % this.cols;
		}

		if (row >= this.rows) {
			return;
		}

		const charUVs = this.renderer.charUVs[char];

		// Append char col and row to 32bit rgbacr using 6 bits for col and 6 bits for row (value range [0 to 63])
		const rgbacr = this.rgba5555 | (charUVs[8] << 6) | charUVs[9];

		if (col == 8 && row == 0) {
			console.log(this.rgba);
			console.log((this.rgba5555 >> 27) & 0x1F);
		}

		// Extract 8-bit values from the 32-bit combined value
		const imageData = this.paneTexture.imageData;
		const i = (this.paneTexture.canvas.width * row + col) * 4;
		imageData.data[i] = (rgbacr >> 24) & 0xFF;
		imageData.data[i + 1] = (rgbacr >> 16) & 0xFF;
		imageData.data[i + 2] = (rgbacr >> 8) & 0xFF;
		imageData.data[i + 3] = rgbacr & 0xFF;

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

		this.colours.dirty = true;
	}

	write(col, row, string) {
		for (let char of string) {
			this.put(col++, row, char);
		}
	}

	render() {
		const gl = this.gl;
		const shader = this.renderer.shader;

		if (this.textureCoord.dirty) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoord.buffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.textureCoord.typedArray);
			this.textureCoord.dirty = false;
		}

		if (this.colours.dirty) {
			//int indicesPerRow = uPaneColsRows.x * 4 + 2;
			//int row = int(floor(float(gl_VertexID) / float(indicesPerRow)));
			//int col = int((gl_VertexID - indicesPerRow * (gl_VertexID / indicesPerRow)) / 4);
			//ivec2 pixel = ivec2(aPosition.x), aPosition.y);
			//vec2 uv = vec2(0.5, 0.8);
			//vec4 rgba = texelFetch(uPaneTexture, ivec2(col, row), 0);
			//int rgbacr = (int(round(rgba.r * 255.0)) << 24) | (int(round(rgba.g * 255.0)) << 16) | (int(round(rgba.b * 255.0)) << 8) | int(round(rgba.a * 255.0));
			//float red = float((rgbacr >> 27) & 0x1F) / 31.0;
			//float green = float((rgbacr >> 22) & 0x1F) / 31.0;
			//float blue = float((rgbacr >> 17) & 0x1F) / 31.0;
			//float alpha = float((rgbacr >> 12) & 0x1F) / 31.0;

			let uPaneColsRows = {x: this.cols, y: this.rows};
			let indicesPerRow = uPaneColsRows.x * 4 + 2;
			let gl_VertexID = 8 * 4;
			let row = Math.floor(gl_VertexID / indicesPerRow);
			let col = parseInt((gl_VertexID - indicesPerRow * (gl_VertexID / indicesPerRow)) / 4);
			console.log('debug', '(', gl_VertexID, '-', indicesPerRow, '*', 'floor(', gl_VertexID, '/', indicesPerRow, ')', ')', '/', '4');
			console.log('debug', '(', gl_VertexID, '-', indicesPerRow, '*', Math.floor(gl_VertexID / indicesPerRow), ')', '/', '4');
			console.log('debug', '(', gl_VertexID, '-', indicesPerRow * Math.floor(gl_VertexID / indicesPerRow), ')', '/', '4');
			console.log('debug', (gl_VertexID - indicesPerRow * Math.floor(gl_VertexID / indicesPerRow)) / 4);
			//const pixel = ctx.getImageData(x, y, 1, 1);
			//const data = pixel.data;
			//const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
			console.log(this.paneTexture.ctx);
						
			this.paneTexture.ctx.putImageData(this.paneTexture.imageData, 0, 0);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.paneTexture.texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				this.paneTexture.canvas,
			);
			this.colours.dirty = false;
		}

		gl.bindVertexArray(this.vao);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.paneTexture.texture);
		gl.uniformMatrix4fv(shader.uPaneMatrix, false, this.paneMatrix);
		gl.uniform2i(shader.uPaneColsRows, this.cols, this.rows);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.indices);
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

function createShader(gl, vertexShaderCode, fragmentShaderCode) {
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);

	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vertexShader));
	}

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderCode);
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

	return { program };
}

function createCanvasTexture(gl, size = 1024) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, size, size);
	const imageData = ctx.getImageData(0, 0, size, size);
	const texture = gl.createTexture();
	return { canvas, ctx, imageData, texture };
}

function hex_to_rgba(hex) {
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

const renderers = [];

function updateFrame() {
	requestAnimationFrame(updateFrame);

	for (let renderer of renderers) {
		if (renderer.dirty) {
			renderer.render();
		}
	}
}

updateFrame();

const resizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		for (let renderer of renderers) {
			if (entry.target === renderer.container) {
				renderer.fitContainer();
			}
		}
	}
});
