const canvas = document.createElement("canvas");

document.body.append(canvas);

const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });

gl.disable(gl.DEPTH_TEST);
gl.disable(gl.DITHER);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


function resize() {

	const devicePixelRatio = window.devicePixelRatio || 1;

	canvas.width = window.innerWidth * devicePixelRatio;
	canvas.height = window.innerHeight * devicePixelRatio;

	canvas.style.width = window.innerWidth + 'px';
	canvas.style.height = window.innerHeight + 'px';

	gl.viewport(0, 0, canvas.width, canvas.height);

}

resize();

window.addEventListener("resize", resize);



const shader = ( () => {

	const shader = {

		vs: compileShader(gl, gl.VERTEX_SHADER, `#version 300 es

			in vec2 position;
			in vec2 uv;
			in vec4 colour;

			uniform float z;
			uniform mat4 projection;

			out vec2 fragUV;
			out vec4 fragRGBA;

			void main() {
			gl_Position = projection * vec4( position.x, position.y, z, 1.0 );
			fragUV = uv;
			fragRGBA = colour; 
			}

		` ),

		fs: compileShader(gl, gl.FRAGMENT_SHADER, `#version 300 es

			precision highp float;

			in vec2 fragUV;	
			in vec4 fragRGBA;	

			uniform sampler2D glyph;

			out vec4 fragColor;

			void main() {
			fragColor = texture(glyph, fragUV) * fragRGBA;
			}

		` ),

		program: gl.createProgram(),
		attributes: {},
		uniforms: {}

	};

	gl.attachShader(shader.program, shader.vs);
	gl.attachShader(shader.program, shader.fs);
	gl.linkProgram(shader.program);

	if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS))
		throw ("program failed to link:" + gl.getProgramInfoLog(shader.program));

	for ( let attribute of [ "position", "uv", "colour", "z" ] ) {

		shader.attributes[attribute] = gl.getAttribLocation(shader.program, attribute);

	}

	for ( let uniform of [ "projection", "glyph" ] ) {

		shader.uniforms[uniform] = gl.getUniformLocation(shader.program, uniform);

	}

	return shader;

} )();


function compileShader(gl, shaderType, shaderSource) {

	const shader = gl.createShader(shaderType);

	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		throw ("could not compile shader:" + gl.getShaderInfoLog(shader));

	return shader;

}


gl.useProgram(shader.program);




const projection = (() => {

	const matrix = new Array(16);
	const projection = { left: 0, right: 1, top: 10, bottom: 0, near: -1, far: 100, matrix };

	const lr = 1 / (projection.left - projection.right);
	const bt = 1 / (projection.bottom - projection.top);
	const nf = 1 / (projection.near - projection.far);

	matrix[0] = - 2 * lr;
	matrix[1] = matrix[2] = matrix[3] = matrix[4] = matrix[6] = matrix[7] = matrix[8] = matrix[9] = matrix[11] = 0;
	matrix[5] = - 2 * bt;
	matrix[10] = 2 * nf;
	matrix[12] = (projection.left + projection.right) * lr;
	matrix[13] = (projection.top + projection.bottom) * bt;
	matrix[14] = (projection.far + projection.near) * nf;
	matrix[15] = 1;

	return projection;

})();

gl.uniformMatrix4fv(shader.uniforms.projection, false, projection.matrix);



const texture = gl.createTexture();

gl.activeTexture(gl.TEXTURE0);
gl.uniform1i(shader.uniforms.glyph, 0);



const layers = [];


function render(currentTime) {

	requestAnimationFrame(render);

	gl.clear(gl.COLOR_BUFFER_BIT);

	for (let layer of layers) {

		if (layer.uv.dirty) {

			gl.bindBuffer(gl.ARRAY_BUFFER, layer.uv.buffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, layer.uv.data);
			layer.uv.dirty = false;

		}

		if (layer.colour.dirty) {

			gl.bindBuffer(gl.ARRAY_BUFFER, layer.colour.buffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, layer.colour.data);
			layer.colour.dirty = false;

		}

		gl.bindVertexArray(layer.vao);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, layer.indices.total);

	}

	update(currentTime);

}


function createLayer(gl, charSetUVs, cols = 80, rows = 30) {

	const layer = {
		cols: cols,
		rows: rows,
		char: new Array(cols * rows),
		index: layers.length,
		uv: {
			buffer: gl.createBuffer(),
			dirty: false
		},
		colour: {
			buffer: gl.createBuffer(),
			dirty: false
		},
		vao: gl.createVertexArray(),
		indices: {
			perCol: 4,
			perRow: 4 * cols + 2,
			total: (cols * 4 + 2) * rows
		}
	};

	const vertices = [];
	const uvs = [];
	const charUV = charSetUVs[" "];
	const colours = [];
	const rowHeight = projection.top / rows;
	let rowY = 0;

	for (let row = 0; row < rows; row++) {

		for (let col = 0; col < cols; col++) {

			vertices.push(col / cols, rowY);
			vertices.push(col / cols, rowY + rowHeight);
			vertices.push((col + 1) / cols, rowY);
			vertices.push((col + 1) / cols, rowY + rowHeight);

			uvs.push(...charUV);

			colours.push(1, 0, 0, 1);
			colours.push(1, 0, 0, 1);
			colours.push(1, 0, 0, 1);
			colours.push(1, 0, 0, 1);

			layer.char[row * rows + col] = " ";

		}

		rowY += rowHeight;

		vertices.push(1, rowY);
		vertices.push(0, rowY);

		uvs.push(0, 0, 0, 0);

		colours.push(0, 0, 0, 0);
		colours.push(0, 0, 0, 0);

	}

	layer.uv.data = new Float32Array(uvs);

	layer.colour.data = new Float32Array(colours);

	const positionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, layer.uv.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, layer.uv.data, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, layer.colour.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, layer.colour.data, gl.STATIC_DRAW);

	gl.bindVertexArray(layer.vao);

	gl.enableVertexAttribArray(shader.attributes.position);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0);

	gl.enableVertexAttribArray(shader.attributes.uv);
	gl.bindBuffer(gl.ARRAY_BUFFER, layer.uv.buffer);
	gl.vertexAttribPointer(shader.attributes.uv, 2, gl.FLOAT, false, 0, 0);

	gl.enableVertexAttribArray(shader.attributes.colour);
	gl.bindBuffer(gl.ARRAY_BUFFER, layer.colour.buffer);
	gl.vertexAttribPointer(shader.attributes.colour, 4, gl.FLOAT, false, 0, 0);

	gl.uniform1f(shader.uniforms.z, layer.index);

	gl.bindVertexArray(null);

	layers.push(layer);

	return layer;

}

function characterSet(gl, chars, size = 1024) {

	const canvas = document.createElement("canvas");

	canvas.width = size;
	canvas.height = size;

	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	let font = size * 0.5;
	let metrics;
	let cols;
	let height;

	const uvs = {};

	do {

		ctx.font = `${font--}px monospace`;
		metrics = ctx.measureText("㶑");
		cols = Math.floor(canvas.width / metrics.width);
		height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * 1.2;

	} while (cols * Math.floor(canvas.height / height) < chars.length);

	const stdMetrics = ctx.measureText("█");

	for (let i = 0, l = chars.length; i < l; i++) {

		let y = metrics.actualBoundingBoxAscent + Math.floor(i / cols) * height;
		let x = metrics.width * 0.5 + (i % cols) * metrics.width;

		ctx.fillText(chars[i], x, y);

		let left = (x - 0.5 * stdMetrics.width + 1) / size;
		let top = (y - stdMetrics.actualBoundingBoxAscent + 1) / size;
		let right = (x + 0.5 * stdMetrics.width - 1) / size;
		let bottom = (y + stdMetrics.actualBoundingBoxDescent - 1) / size;

		uvs[chars[i]] = [left, bottom, left, top, right, bottom, right, top];

	}

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);//gl.LINEAR );
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	//gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	//gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	//gl.generateMipmap(gl.TEXTURE_2D);
	//
	document.body.append( canvas );

	return uvs;

}


function setChar(col, row, char, layerIndex = 0, colour = null) {

	const layer = (layerIndex > layers.length - 1) ? layers[ layers.length - 1 ] : layers[ layerIndex ];

	if ( col < 0 ) col = layer.cols + col;
	if ( row < 0 ) row = layer.rows + row;

	const charUVs = charSetUVs[char];
	const indice = row * layer.indices.perRow + col * layer.indices.perCol;
	const charOffset = row * layer.cols + col;

	if (layer.char[charOffset] !== char) {

		layer.char[charOffset] = char;

		let data = layer.uv.data;
		let i = indice * 2;

		data[i] = charUVs[0];
		data[i + 1] = charUVs[1];
		data[i + 2] = charUVs[2];
		data[i + 3] = charUVs[3];
		data[i + 4] = charUVs[4];
		data[i + 5] = charUVs[5];
		data[i + 6] = charUVs[6];
		data[i + 7] = charUVs[7];

		layer.uv.dirty = true;

	}

	if (colour) {

		let data = layer.colour.data;
		let i = indice * 4;

		if (data[i] !== colour[0] || data[i + 1] !== colour[1] || data[i + 2] !== colour[1] || data[i + 3] !== colour[1]) {

			data[i] = data[i + 4] = data[i + 8] = data[i + 12] = colour[0];
			data[i + 1] = data[i + 5] = data[i + 9] = data[i + 13] = colour[1];
			data[i + 2] = data[i + 6] = data[i + 10] = data[i + 14] = colour[2];
			data[i + 3] = data[i + 7] = data[i + 11] = data[i + 15] = colour[3];

			layer.colour.dirty = true;

		}

	}

}

function writeText(col, row, string, layerIndex = 0, colour = null) {

	for (let char of string) {
		setChar(col++, row, char, layerIndex, colour);
	}

}


const characters = `
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
~!@#$%^&*()_+[]{}\\|:;\`'",.<>/?⛆☶ ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕☻ぷ
ⅈጸ
`;

const charSetUVs = characterSet(gl, characters);

const view = {
	cols: 20,
	rows: 10 
};


const layer_ground = createLayer(gl, charSetUVs, view.cols, view.rows);
const layer_groundcover = createLayer(gl, charSetUVs, view.cols, view.rows);
const layer_groundcover_2 = createLayer(gl, charSetUVs, view.cols, view.rows);
const layer_groundcover_3 = createLayer(gl, charSetUVs, view.cols, view.rows);
const layer_characters = createLayer(gl, charSetUVs, view.cols, view.rows);
const layer_ui_bg = createLayer(gl, charSetUVs, 20, 10);
const layer_ui_fg = createLayer(gl, charSetUVs, 20, 10);

writeText(0, - 1, "███", layer_ui_bg.index, [1, 1, 1, 0.5]);

for (let row = 0; row < view.rows; row++) {
	for (let col = 0; col < view.cols; col++) {
		setChar(col, row, '█', layer_ground.index, [30/255, 30/255, 30/255, 1]);
		setChar(col, row, '░', layer_groundcover.index, [50/255, 50/255, 50/255, 1]);
	}
}

setChar(6, 0, '⛆', layer_groundcover_3.index, [50/255, 50/255, 150/255, 1]);

setChar(Math.floor(view.cols/2), Math.floor(view.rows/2), "ጸ", layer_characters.index, [255/255, 255/255, 255/255, 1]);


let fps, startTime, prevTime, frameCount = 0;

function update(currentTime) {

	if (layers.length < 3) return;

	if (!startTime) {

		startTime = currentTime;
		prevTime = startTime;

	}

	frameCount++;

	if ( currentTime - prevTime >= 1000 ) {

		fps = frameCount;
		writeText( 0, - 1, `${fps}`, layer_ui_fg.index, [ 0, 0, 0, 1 ] );
		frameCount = 0;
		prevTime = currentTime;

	}

}



render();

