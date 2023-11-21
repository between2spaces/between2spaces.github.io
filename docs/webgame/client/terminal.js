export default class Terminal {
	static BLACK = [0, 0, 0, 1];
	static WHITE = [1, 1, 1, 1];
	static YELLOW = [1, 1, 0.7, 1];

	constructor(layers = [{ cols: 80, rows: 25 }], container = document.body) {
		this.layers = [];

		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i];
			this.layers.push({
				cols: layer.cols || 80,
				rows: layer.rows || 25,
				colour: layer.colour || Terminal.WHITE,
				wrap: true,
			});
		}

		this.context = createWebGLContext(container);
		this.shader = createShader(this.context.gl);
		this.container = container;

		resizeObserver.observe(container);

		let cols = this.layers[0].cols;
		let rows = this.layers[0].rows;

		this.projection = {near: 0, far: 100};
		this.modelViewMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		this.modelViewDirty = true;

		this.setView(0, 0, cols/2, -rows/2);

		this.setCharacterSet(
			"0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕",
			1024,
		);
		this.buildBuffers();

		terminals.push(this);
		this.dirty = true;
	}

	get cols() {
		return this.layers[0].cols;
	}

	get rows() {
		return this.layers[0].rows;
	}

	setLayer(index, cols, rows, wrap = true) {}

	getLayer(layer = 0) {
		return this.layers[layer];
	}

	setBackground(colour) {
		const rgba = typeof colour === "string" ? hexToRgba(colour) : colour;
		this.context.gl.clearColor(...rgba);
	}

	setColour(colour, layer = undefined) {
		if (!layer) {
			layer = this.layers[0];
		}

		layer.colour = colour;
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
			(left + right) * lr,
			(top + bottom) * bt,
			(far + near) * nf,
			1,
		];

		this.projectionDirty = true;
	}

	buildBuffers() {}

	setCharacterSet(characters, size = 1024, fontFamily = "monospace") {
		const gl = this.context.gl;
		const { texture, uvs } = createCharactersTexture(gl, characters, size);
		this.texture = texture;
		this.charUVs = uvs;
		let layerZ = -this.layers.length + 1;

		for (let layer of this.layers) {
			let colours = [];
			let vertices = degeneratedTriangleStripeVertices(
				layer.cols,
				layer.rows,
				layerZ,
			);
			let textureCoord = new Array((vertices.length * 2) / 3);

			let top = 1 + layer.rows * 0.5;

			for (let row = 0; row < layer.rows; row++) {
				top--;

				let bottom = top - 1;
				let left = -1 - layer.cols * 0.5;

				for (let col = 0; col < layer.cols; col++) {
					left++;

					let right = left + 1;

					if (row > 0 && col === 0) {
						//textureCoord.push(0, 0, 0, 0, 0, 0);
						colours.push(0.0, 0.0, 0.0, 0.0);
						colours.push(0.0, 0.0, 0.0, 0.0);
						colours.push(0.0, 0.0, 0.0, 0.0);
					}

					colours.push(0.0, 0.0, 0.0, 0.0);
					colours.push(0.0, 0.0, 0.0, 0.0);
					colours.push(0.0, 0.0, 0.0, 0.0);
					colours.push(0.0, 0.0, 0.0, 0.0);

					//textureCoord.push(0, 0, 0, 0, 0, 0, 0, 0);

					if (col === layer.cols - 1) {
						//textureCoord.push(0, 0);
						colours.push(0.0, 0.0, 0.0, 0.0);
					}
				}
			}

			layer.indicesPerRow = (layer.cols + 1) * 4;
			layer.indicesTotal = layer.indicesPerRow * layer.rows - 3;

			layer.vertices = {
				typedArray: new Float32Array(vertices),
				size: 3,
				buffer: gl.createBuffer(),
				dirty: true,
			};
			layer.colours = {
				typedArray: new Float32Array(colours),
				size: 4,
				buffer: gl.createBuffer(),
				dirty: true,
			};

			layer.textureCoord = {
				typedArray: new Float32Array(textureCoord),
				size: 2,
				buffer: gl.createBuffer(),
				dirty: true,
			};

			//layer.modelViewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, layerZ ++, 1 ];
			layer.z = layerZ;
			layerZ++;

			// Load the vertices buffer to GPU and tell WebGL how to pull positions into the vertexPosition attribute
			gl.bindBuffer(gl.ARRAY_BUFFER, layer.vertices.buffer);
			gl.bufferData(gl.ARRAY_BUFFER, layer.vertices.typedArray, gl.STATIC_DRAW);
			gl.vertexAttribPointer(
				this.shader.attributes.vertexPosition,
				layer.vertices.size,
				gl.FLOAT,
				false,
				0,
				0,
			);
			gl.enableVertexAttribArray(this.shader.attributes.vertexPosition);

			// Load the colours buffer to GPU and tell WebGL how to pull colors into the vertexColor attribute
			gl.bindBuffer(gl.ARRAY_BUFFER, layer.colours.buffer);
			gl.bufferData(gl.ARRAY_BUFFER, layer.colours.typedArray, gl.STATIC_DRAW);
			gl.vertexAttribPointer(
				this.shader.attributes.colour,
				layer.colours.size,
				gl.FLOAT,
				false,
				0,
				0,
			);
			gl.enableVertexAttribArray(this.shader.attributes.colour);

			// Load the textureCoord buffer to GPU and tell WebGL how to pull texture coordinates into the textureCoord attribute
			gl.bindBuffer(gl.ARRAY_BUFFER, layer.textureCoord.buffer);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				layer.textureCoord.typedArray,
				gl.STATIC_DRAW,
			);
			gl.vertexAttribPointer(
				this.shader.attributes.textureCoord,
				layer.textureCoord.size,
				gl.FLOAT,
				false,
				0,
				0,
			);
			gl.enableVertexAttribArray(this.shader.attributes.textureCoord);
		}

		// Tell WebGL to use our program when drawing
		gl.useProgram(this.shader.program);

		// Tell WebGL we want to affect texture unit 0
		gl.activeTexture(gl.TEXTURE0);

		// Bind the texture to texture unit 0
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// Tell the shader we bound the texture to texture unit 0
		gl.uniform1i(this.shader.uniforms.texture, 0);
	}

	translate(x, y, z) {
		this.projectionMatrix[12] =
			this.projectionMatrix[0] * x +
			this.projectionMatrix[4] * y +
			this.projectionMatrix[8] * z +
			this.projectionMatrix[12];
		this.projectionMatrix[13] =
			this.projectionMatrix[1] * x +
			this.projectionMatrix[5] * y +
			this.projectionMatrix[9] * z +
			this.projectionMatrix[13];
		this.projectionMatrix[14] =
			this.projectionMatrix[2] * x +
			this.projectionMatrix[6] * y +
			this.projectionMatrix[10] * z +
			this.projectionMatrix[14];
		this.projectionMatrix[15] =
			this.projectionMatrix[3] * x +
			this.projectionMatrix[7] * y +
			this.projectionMatrix[11] * z +
			this.projectionMatrix[15];
		this.projectionDirty = true;
	}

	setHeight(col, row, layer, height) {
		if (layer > this.layers.length - 1) {
			return;
		}

		layer = this.layers[layer];

		let indices = row * layer.indicesPerRow + col * 4;
		let verticesIndex = indices * 3;

		layer.vertices.typedArray[verticesIndex] = layer.z + height;

		layer.vertices.dirty = false;
	}

	put(col, row, char, layer = undefined) {
		if (!layer) {
			layer = this.layers[0];
		}

		if (!layer.wrap && (col >= layer.cols || row >= layer.rows)) {
			return;
		}

		const charUVs = this.charUVs[char];
		let indices = row * layer.indicesPerRow + col * 4;
		let texIndex = indices * 2;

		layer.textureCoord.typedArray[texIndex] = charUVs[0];
		layer.textureCoord.typedArray[texIndex + 1] = charUVs[1];
		layer.textureCoord.typedArray[texIndex + 2] = charUVs[2];
		layer.textureCoord.typedArray[texIndex + 3] = charUVs[3];
		layer.textureCoord.typedArray[texIndex + 4] = charUVs[4];
		layer.textureCoord.typedArray[texIndex + 5] = charUVs[5];
		layer.textureCoord.typedArray[texIndex + 6] = charUVs[6];
		layer.textureCoord.typedArray[texIndex + 7] = charUVs[7];

		layer.textureCoord.dirty = true;

		let colIndex = indices * 4;

		layer.colours.typedArray[colIndex] = layer.colour[0];
		layer.colours.typedArray[colIndex + 1] = layer.colour[1];
		layer.colours.typedArray[colIndex + 2] = layer.colour[2];
		layer.colours.typedArray[colIndex + 3] = layer.colour[3];
		layer.colours.typedArray[colIndex + 4] = layer.colour[0];
		layer.colours.typedArray[colIndex + 5] = layer.colour[1];
		layer.colours.typedArray[colIndex + 6] = layer.colour[2];
		layer.colours.typedArray[colIndex + 7] = layer.colour[3];
		layer.colours.typedArray[colIndex + 8] = layer.colour[0];
		layer.colours.typedArray[colIndex + 9] = layer.colour[1];
		layer.colours.typedArray[colIndex + 10] = layer.colour[2];
		layer.colours.typedArray[colIndex + 11] = layer.colour[3];
		layer.colours.typedArray[colIndex + 12] = layer.colour[0];
		layer.colours.typedArray[colIndex + 13] = layer.colour[1];
		layer.colours.typedArray[colIndex + 14] = layer.colour[2];
		layer.colours.typedArray[colIndex + 15] = layer.colour[3];

		layer.colours.dirty = true;

		this.dirty = true;
	}

	write(col, row, string, layer = undefined) {
		if (!layer) {
			layer = this.layers[0];
		}

		for (let char of string) {
			this.put(col++, row, char, layer);
		}
	}

	update() {
		const gl = this.context.gl;

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if (this.modelViewDirty) {
			gl.uniformMatrix4fv(
				this.shader.uniforms.modelViewMatrix,
				false,
				this.modelViewMatrix,
			);

			this.modelViewDirty = false;
		}

		if (this.projectionDirty) {
			gl.uniformMatrix4fv(
				this.shader.uniforms.projectionMatrix,
				false,
				this.projectionMatrix,
			);

			gl.uniformMatrix4fv(
				this.shader.uniforms.modelViewMatrix,
				false,
				this.modelViewMatrix,
			);

			this.projectionDirty = false;
		}

		for (let layer of this.layers) {
			gl.bindBuffer(gl.ARRAY_BUFFER, layer.vertices.buffer);

			if (layer.vertices.dirty) {
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, layer.vertices.typedArray);
				layer.vertices.dirty = false;
			}

			gl.vertexAttribPointer(
				this.shader.attributes.vertexPosition,
				layer.vertices.size,
				gl.FLOAT,
				false,
				0,
				0,
			);

			gl.bindBuffer(gl.ARRAY_BUFFER, layer.textureCoord.buffer);

			if (layer.textureCoord.dirty) {
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, layer.textureCoord.typedArray);
				layer.textureCoord.dirty = false;
			}

			gl.vertexAttribPointer(
				this.shader.attributes.textureCoord,
				layer.textureCoord.size,
				gl.FLOAT,
				false,
				0,
				0,
			);

			gl.bindBuffer(gl.ARRAY_BUFFER, layer.colours.buffer);

			if (layer.colours.dirty) {
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, layer.colours.typedArray);
				layer.textureCoord.dirty = false;
			}

			gl.vertexAttribPointer(
				this.shader.attributes.colour,
				layer.colours.size,
				gl.FLOAT,
				false,
				0,
				0,
			);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, layer.indicesTotal);
		}

		this.dirty = false;
	}
}

function createWebGLContext(container) {
	const canvas = document.createElement("canvas");
	container.append(canvas);
	const gl = canvas.getContext("webgl", { antialias: false });
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
		`
		attribute vec4 aVertexPosition;
		attribute vec2 aTextureCoord;
		attribute vec4 aColour;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		varying highp vec2 vTextureCoord;
		varying highp vec4 vColour;
		void main() {
			gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
			vTextureCoord = aTextureCoord;
			vColour = aColour;
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
		`
		varying highp vec2 vTextureCoord;
		varying highp vec4 vColour;
		uniform sampler2D uTexture;
		void main() {
			gl_FragColor = texture2D(uTexture, vTextureCoord) * vColour;
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
		vertexPosition: gl.getAttribLocation(program, "aVertexPosition"),
		textureCoord: gl.getAttribLocation(program, "aTextureCoord"),
		colour: gl.getAttribLocation(program, "aColour"),
	};

	const uniforms = {
		projectionMatrix: gl.getUniformLocation(program, "uProjectionMatrix"),
		modelViewMatrix: gl.getUniformLocation(program, "uModelViewMatrix"),
		texture: gl.getUniformLocation(program, "uTexture"),
	};

	return { program, attributes, uniforms };
}

function createCharactersTexture(gl, characters, size = 1024) {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");

	ctx.clearRect(0, 0, size, size);
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	let font = size * 0.5;
	let metrics;
	let cols;
	let height;
	let uvs = {};

	do {
		ctx.font = `${font--}px monospace`;
		metrics = ctx.measureText("█");
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

function degeneratedTriangleStripeVertices(cols, rows, z = 0) {
	const vertices = [];
	let top = 1 + rows * 0.5;

	for (let row = 0; row < rows; row++) {
		top--;

		let bottom = top - 1;
		let left = -1 - cols * 0.5;

		for (let col = 0; col < cols; col++) {
			left++;

			let right = left + 1;

			if (row > 0 && col === 0) {
				vertices.push(left, bottom, z, left, bottom, z, left, bottom, z);
			}

			vertices.push(
				left,
				bottom,
				z,
				left,
				top,
				z,
				right,
				bottom,
				z,
				right,
				top,
				z,
			);

			if (col === cols - 1) {
				vertices.push(right, top, z);
			}
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
			terminal.update();
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
