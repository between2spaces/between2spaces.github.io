const GRID_SIZE = 32;

const canvas = document.querySelector( "canvas" );

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

if (! navigator.gpu ) {

    throw new Error( "WebGPU not supported on this browser." );

}

const adapter = await navigator.gpu.requestAdapter();

if ( ! adapter ) {

    throw new Error( "No appropriate GPUAdapter found." );

}

const device = await adapter.requestDevice();

const context = canvas.getContext( "webgpu" );
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure( {
    device: device,
    format: canvasFormat,
} );



// Vertex buffer /////////////////////
const vertices = new Float32Array( [
    // ◢ Triangle 1
    - 0.8, - 0.8,
    0.8, - 0.8,
    0.8, 0.8,

    // ◤ Triangle 2
    - 0.8, - 0.8,
    0.8, 0.8,
    - 0.8, 0.8,
] );

const vertexBuffer = device.createBuffer( {
    label: "Cell vertices",
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
//////////////////////////////////////



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



const cellShaderModule = device.createShaderModule( {
    label: "Cell shader",
    code: `
struct VertexInput {
@location(0) pos: vec2f,
@builtin(instance_index) instance: u32,
};

struct VertexOutput {
@builtin(position) pos: vec4f,
@location(0) cell: vec2f,
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<u32>;

@vertex
fn vertexMain( input: VertexInput ) -> VertexOutput {
let i = f32(input.instance);
let cell = vec2f(i % grid.x, floor(i / grid.x));
let state = f32(cellState[input.instance]);

let cellOffset = cell / grid * 2;
let gridPos = (input.pos * state + 1) / grid - 1 + cellOffset;

var output: VertexOutput;
output.pos = vec4f( gridPos, 0, 1 );
output.cell = cell;
return output;
}

@fragment
fn fragmentMain( input: VertexOutput ) -> @location( 0 ) vec4f {
let colour = input.cell / grid;
return vec4f( colour, 1 - colour.x, 1);
}
` } );



const WORKGROUP_SIZE = 8;

const simulationShaderModule = device.createShaderModule( {
    lable: "Game of Life simulation shader",
    code: `
@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellStateIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

fn cellIndex( cell: vec2u ) -> u32 {
return cell.y * u32(grid.x) + cell.x;
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn computeMain( @builtin(global_invocation_id) cell: vec3u ) {
if ( cellStateIn[cellIndex(cell.xy)] == 1 ) {
cellStateOut[cellIndex(cell.xy)] = 0;
} else {
cellStateOut[cellIndex(cell.xy)] = 1;
}
}
` } );




const bindGroupLayout = device.createBindGroupLayout( {
    label: "Cell Bind Group Layout",
    entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
    ]
} );


const bindGroups = [

    device.createBindGroup( {
        label: "Cell renderer bind group A",
        layout: bindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: cellStateBuffer[ 0 ] } },
            { binding: 2, resource: { buffer: cellStateBuffer[ 1 ] } },
        ],
    } ),
    device.createBindGroup( {
        label: "Cell renderer bind group B",
        layout: bindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: cellStateBuffer[ 1 ] } },
            { binding: 2, resource: { buffer: cellStateBuffer[ 0 ] } },
        ],
    } )
];



const pipelineLayout = device.createPipelineLayout( {
    label: "Cell Pipeline Layout",
    bindGroupLayouts: [ bindGroupLayout ],
} );


const cellPipeline = device.createRenderPipeline( {
    label: "Cell pipeline",
    layout: pipelineLayout,
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [ vertexBufferLayout ]
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [ {
            format: canvasFormat
        } ]
    }
} );


const simulationPipeline = device.createComputePipeline( {
    label: "Simulation pipeline",
    layout: pipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
    }
} );


const UPDATE_INTERVAL = 200;

let step = 0;

function update() {

    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();

    computePass.setPipeline( simulationPipeline );
    computePass.setBindGroup( 0, bindGroups[ step % 2 ] );

    const workgroupCount = Math.ceil( GRID_SIZE / WORKGROUP_SIZE );
    computePass.dispatchWorkgroups( workgroupCount, workgroupCount );

    computePass.end();

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

}

setInterval( update, UPDATE_INTERVAL );

