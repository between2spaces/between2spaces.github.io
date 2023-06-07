async function main() {

	const adapter = await navigator.gpu?.requestAdapter();
	const device = await adapter?.requestDevice();

	if ( ! device ) throw new Error( 'WebGPU not supported on this browser.' );

	const canvas = document.querySelector( 'canvas' );

	window.addEventListener( 'resize', resize );

	function resize() {

		const l = device.limits;

		canvas.width = Math.min( window.innerWidth, l.maxTextureDimension2D );
		canvas.height = Math.min( window.innerHeight, l.maxTextureDimension2D );

	}

	resize();


	const context = canvas.getContext( 'webgpu' );
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

	context.configure( {
		device: device,
		format: canvasFormat,
	} );

	const module = device.createShaderModule( {
		label: "Shader Module",
		code: `
		struct Uniforms {
			colour: vec4f,
		};

		@group(0) @binding(0) var<uniform> uniforms: Uniforms;
		@group(0) @binding(1) var bSampler: sampler;
		@group(0) @binding(2) var texture: texture_2d<f32>;

		struct VertexInput {
			@location(0) pos: vec2f,
			@builtin(vertex_index) vertexIndex: u32,
		};

		struct VertexOutput {
			@builtin(position) pos: vec4f,
			@location(0) texcoord: vec2f,
		};

		@vertex
		fn vertexMain( input: VertexInput ) -> VertexOutput {
			var pos = array<vec2f, 6>(
				// ◤ Triangle 1
				vec2f( - 0.5, 0.5 ),
				vec2f( 0.5, 0.5 ),
				vec2f( - 0.5, - 0.5 ),

				// ◢ Triangle 2
				vec2f( - 0.5, - 0.5 ),
				vec2f( 0.5, 0.5 ),
				vec2f( 0.5, - 0.5 ),
			);
			let xy = pos[ input.vertexIndex ];
			var output: VertexOutput;
			output.pos = vec4f( xy, 0, 1 );
			output.texcoord = vec2f( xy.x + 0.5, -xy.y + 0.5 );
			return output;
		}

		@fragment
		fn fragmentMain( input: VertexOutput ) -> @location( 0 ) vec4f {
			return textureSample( texture, bSampler, input.texcoord );
		}
		`
	} );


	const uniformColour = [ 1, 0, 0, 1 ];
	const uniformArray = new Float32Array( [ ...uniformColour ] );
	const uniformColourOffset = 0;

	const uniformBuffer = device.createBuffer( {
		label: "Uniforms",
		size: uniformArray.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	} );

	uniformArray.set( uniformColour, uniformColourOffset );
	device.queue.writeBuffer( uniformBuffer, 0, uniformArray );


	const vertices = new Float32Array( [
		// ◢ Triangle 1
		- 0.5, - 0.5,
		0.5, - 0.5,
		0.5, 0.5,

		// ◤ Triangle 2
		- 0.5, - 0.5,
		0.5, 0.5,
		- 0.5, 0.5,
	] );

	const vertexBuffer = device.createBuffer( {
		label: "Vertex Buffer",
		size: vertices.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	} );

	device.queue.writeBuffer( vertexBuffer, 0, vertices );

	const vertexBufferLayout = {
		arrayStride: 8,
		attributes: [ {
			format: "float32x2",
			offset: 0,
			shaderLocation: 0,
		} ],
	};


	const textureSize = 8;
	const _ = [ 255, 0, 0, 255 ]; // red
	const y = [ 255, 255, 0, 255 ]; // yellow
	const b = [ 0, 0, 255, 255 ]; // blue
	const textureData = new Uint8Array( [
		b, _, _, _, _, _, _, _,
		_, _, y, y, y, y, _, _,
		_, _, y, y, y, y, _, _,
		_, _, y, y, _, _, _, _,
		_, _, y, y, y, _, _, _,
		_, _, y, y, _, _, _, _,
		_, _, y, y, _, _, _, _,
		_, _, _, _, _, _, _, _,
	].flat() );

	const texture = device.createTexture( {
		size: [ textureSize, textureSize ],
		format: 'rgba8unorm',
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
	} );

	device.queue.writeTexture( { texture }, textureData, { bytesPerRow: textureSize * 4 }, { width: textureSize, height: textureSize } );

	const sampler = device.createSampler();


	const bindGroupLayout = device.createBindGroupLayout( {
		label: 'Bind Group Layout',
		entries: [
			{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
			{ binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {} },
			{ binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {} },
		]
	} );

	const bindGroup = device.createBindGroup( {
		label: 'Renderer bind group A',
		layout: bindGroupLayout,
		entries: [
			{ binding: 0, resource: { buffer: uniformBuffer } },
			{ binding: 1, resource: sampler },
			{ binding: 2, resource: texture.createView() },
		],
	} );

	const pipelineLayout = device.createPipelineLayout( {
		label: 'Pipeline Layout',
		bindGroupLayouts: [ bindGroupLayout ],
	} );

	const pipeline = device.createRenderPipeline( {
		label: 'Render Pipeline',
		layout: pipelineLayout,
		vertex: {
			module,
			entryPoint: "vertexMain",
			buffers: [ vertexBufferLayout ]
		},
		fragment: {
			module,
			entryPoint: "fragmentMain",
			targets: [ { format: canvasFormat } ]
		}
	} );

	const renderPassDescriptor = {
		label: 'Canvas Render Pass',
		colorAttachments: [ {
			clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
			loadOp: 'clear',
			storeOp: 'store',
		} ]
	};

	function render() {

		renderPassDescriptor.colorAttachments[ 0 ].view = context.getCurrentTexture().createView();

		const encoder = device.createCommandEncoder( { label: 'Command Encoder' } );

		const pass = encoder.beginRenderPass( renderPassDescriptor );
		pass.setPipeline( pipeline );
		pass.setBindGroup( 0, bindGroup );
		pass.setVertexBuffer( 0, vertexBuffer );
		pass.draw( vertices.length / 2 );
		pass.end();

		device.queue.submit( [ encoder.finish() ] );

	}

	requestAnimationFrame( render );


}

main();







function morgue() {


	// Grid uniform buffer ///////////////
	const uniformArray = new Float32Array( [ GRID_SIZE, GRID_SIZE ] );

	const uniformBuffer = device.createBuffer( {
		label: "Grid Uniforms",
		size: uniformArray.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	} );

	device.queue.writeBuffer( uniformBuffer, 0, uniformArray );
	//////////////////////////////////////


	// State storage buffer //////////////
	const cellStateArray = new Uint32Array( GRID_SIZE * GRID_SIZE );

	const cellStateBuffer = [
		device.createBuffer( {
			label: "Cell State A",
			size: cellStateArray.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		} ),
		device.createBuffer( {
			label: "Cell State B",
			size: cellStateArray.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		} )
	];

	// Intialise random starting state
	for ( let i = 0; i < cellStateArray.length; i ++ ) {

		cellStateArray[ i ] = Math.random() > 0.6 ? 1 : 0;

	}

	device.queue.writeBuffer( cellStateBuffer[ 0 ], 0, cellStateArray );
	//////////////////////////////////////



	const WORKGROUP_SIZE = 8;

	const simulationShaderModule = device.createShaderModule( {
		lable: "Game of Life simulation shader",
		code: `
@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellStateIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

fn cellIndex( cell: vec2u ) -> u32 {
	return (cell.y % u32(grid.y)) * u32(grid.x)+ (cell.x % u32(grid.x));
}

fn cellActive( x: u32, y: u32 ) -> u32 {
	return cellStateIn[ cellIndex( vec2( x, y ) ) ];
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn computeMain( @builtin(global_invocation_id) cell: vec3u ) {
	let activeNeighbours = 0 +
		cellActive( cell.x + 1, cell.y + 1 ) +
		cellActive( cell.x + 1, cell.y ) +
		cellActive( cell.x + 1, cell.y - 1 ) +
		cellActive( cell.x, cell.y - 1 ) +
		cellActive( cell.x - 1, cell.y - 1 ) +
		cellActive( cell.x - 1, cell.y ) +
		cellActive( cell.x - 1, cell.y + 1 ) +
		cellActive( cell.x, cell.y + 1 );
	let i = cellIndex(cell.xy);

	switch activeNeighbours {
		case 2: {
			cellStateOut[i] = cellStateIn[i];
		}
		case 3: {
			cellStateOut[i] = 1;
		}
		default: {
			cellStateOut[i] = 0;
		}
	}
}
` } );



	let step = 0;

	function update() {

		step ++;

		const pass = encoder.beginRenderPass( {
			colorAttachments: [ {
				view: context.getCurrentTexture().createView(),
				loadOp: "clear",
				clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
				storeOp: "store",
			} ]
		} );

		pass.setPipeline( cellPipeline );
		pass.setBindGroup( 0, bindGroups[ step % 2 ] );
		pass.setVertexBuffer( 0, vertexBuffer );
		pass.draw( vertices.length / 2, GRID_SIZE * GRID_SIZE );
		pass.end();

		device.queue.submit( [ encoder.finish() ] );

		requestAnimationFrame( update );

	}

	//setInterval( update, UPDATE_INTERVAL );

}
