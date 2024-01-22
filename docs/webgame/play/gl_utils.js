
export function createContext(container) {
	const canvas = document.createElement('canvas');
	container.append(canvas);
	const gl = canvas.getContext('webgl2', { antialias: false });
	gl.clearDepth(1.0);
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	return { canvas, gl };
}

export function createShader(gl, vertexShaderCode, fragmentShaderCode) {
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

export function createCanvasTexture(gl, size = 1024) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, size, size);
	const imageData = ctx.getImageData(0, 0, size, size);
	const texture = gl.createTexture();
	return { canvas, ctx, imageData, texture };
}

