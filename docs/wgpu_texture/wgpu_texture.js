
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
	const format = navigator.gpu.getPreferredCanvasFormat();

	context.configure( { device, format } );

	const module = device.createShaderModule( {
		label: "Shader Module",
		code: `
		struct Uniforms {
			colour: vec4f,
		};

		@group(0) @binding(0) var bSampler: sampler;
		@group(0) @binding(1) var texture: texture_2d<f32>;

		struct VertexInput {
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
			output.texcoord = vec2f( xy.x + 0.5, - xy.y + 0.5 );
			return output;
		}

		@fragment
		fn fragmentMain( input: VertexOutput ) -> @location( 0 ) vec4f {
			return textureSample( texture, bSampler, input.texcoord );
		}
		`
	} );

	async function loadImageBitmap( url ) {

		const res = await fetch( url );
		const blob = await res.blob();
		return await createImageBitmap( blob, { colorSpaceConversion: 'none' } );

	}

	const url = 'https://webgpufundamentals.org/webgpu/resources/images/f-texture.png';
	const source = await loadImageBitmap( url );
	const texture = device.createTexture( {
		label: url,
		format: 'rgba8unorm',
		size: [ source.width, source.height ],
		usage: GPUTextureUsage.TEXTURE_BINDING |
           GPUTextureUsage.COPY_DST |
           GPUTextureUsage.RENDER_ATTACHMENT,
	} );

	device.queue.copyExternalImageToTexture(
		{ source, flipY: false },
		{ texture },
		{ width: source.width, height: source.height },
	);

	//const textureSize = 8;
	//const _ = [ 255, 0, 0, 255 ]; // red
	//const y = [ 255, 255, 0, 255 ]; // yellow
	//const b = [ 0, 0, 255, 255 ]; // blue
	//const textureData = new Uint8Array( [
	//	b, _, _, _, _, _, _, _,
	//	_, _, y, y, y, y, _, _,
	//	_, _, y, y, y, y, _, _,
	//	_, _, y, y, _, _, _, _,
	//	_, _, y, y, y, _, _, _,
	//	_, _, y, y, _, _, _, _,
	//	_, _, y, y, _, _, _, _,
	//	_, _, _, _, _, _, _, _,
	//].flat() );

	//const texture = device.createTexture( {
	//	size: [ textureSize, textureSize ],
	//	format: 'rgba8unorm',
	//	usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
	//} );

	//device.queue.writeTexture( { texture }, textureData, { bytesPerRow: textureSize * 4 }, { width: textureSize, height: textureSize } );

	const sampler = device.createSampler( {
		addressModeU: 'clamp-to-edge',
		addressModeV: 'clamp-to-edge',
		magFilter: 'nearest',
		minFilter: 'nearest',
	} );


	const pipeline = device.createRenderPipeline( {
		label: 'Render Pipeline',
		layout: 'auto',
		vertex: { module, entryPoint: "vertexMain", buffers: [], },
		fragment: { module, entryPoint: "fragmentMain", targets: [ { format } ] }
	} );


	const bindGroup = device.createBindGroup( {
		label: 'Renderer bind group A',
		layout: pipeline.getBindGroupLayout( 0 ),
		entries: [
			{ binding: 0, resource: sampler },
			{ binding: 1, resource: texture.createView() },
		],
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
		pass.draw( 6 );
		pass.end();

		device.queue.submit( [ encoder.finish() ] );

	}

	requestAnimationFrame( render );


}

main();
