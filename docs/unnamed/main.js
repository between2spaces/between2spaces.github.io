import * as webgl_utils from "./webgl_utils.js";
import * as image_utils from "./image_utils.js";
import Object from "./object.js";
import { OrthogonalCamera, PerspectiveCamera, OrbitControl } from "./camera.js";
import * as mat4 from "./mat4.js";
import * as vec3 from "./vec3.js";
import * as quaternion from "./quaternion.js";
import { createNoise2D } from "./simplexnoise.js";
import { seedrandom } from "./seedrandom.js";


const canvas = document.querySelector( "canvas" );
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


const gl = canvas.getContext( "webgl2", { alpha: false } );

gl.enable( gl.BLEND );
gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

gl.clearColor( 1, 1, 1, 1 );
gl.clear( gl.COLOR_BUFFER_BIT );
gl.colorMask( true, true, true, false );



const characterset = image_utils.charTileMap( gl, "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕" );

//document.body.append( characterset.canvas );

const terrainTexture = image_utils.loadTexture( gl, "dembase1.jpg" );


class TiledTerrain extends Object {

	constructor( size, baseLayer = true, seed = Math.random() * 999999999 ) {

		super();

		this.size = size;
		this.baseLayer = baseLayer;
		this.seed = seed;
		this.heightScale = Math.sqrt( size ) * 2;

		this.shader = {
			program: webgl_utils.createProgram( gl,
				`#version 300 es
				in vec2 a_position;
				in vec2 a_uvs;
				out vec3 fragPos;
				out vec4 v_bump;
				out vec3 v_normal;
				out vec2 v_uv;
				uniform mat4 model;
				uniform mat4 view;
				uniform mat4 projection;
				uniform sampler2D u_heightmap;
				uniform float u_size;
				uniform float u_heightscale;

				void main() {
					float halfsize = u_size * 0.5;
					float w = 1.0 / u_size;
					float u = ( a_position.x + halfsize ) / u_size;
					float v = ( a_position.y + halfsize ) / u_size;
					v_bump = texture( u_heightmap, vec2( u, v ) );
					float Az = texture( u_heightmap, vec2( u + w, v ) ).b - v_bump.a;
					float Bz = texture( u_heightmap, vec2( u, v + w ) ).b - v_bump.a;
					v_normal = normalize( vec3( -Az, -Bz, 1 ) );
					vec4 pos = vec4( a_position.x, v_bump.b * u_heightscale, a_position.y, 1.0 );
					fragPos = vec3( model * pos );
					gl_Position = projection * view * model * pos;
					v_uv = a_uvs;
				}
				`,
				`#version 300 es
				precision highp float;
				in vec3 fragPos;
				in vec4 v_bump;
				in vec3 v_normal;
				in vec2 v_uv;
				out vec4 outColor;
				uniform vec3 lightPos;
				uniform sampler2D characterset;

				void main() {
					vec3 lightDir = normalize(lightPos - fragPos);
					float diffuse = max( dot( v_normal, lightDir ), 0.0 );
					vec4 colour = texture(characterset, v_uv);
					outColor = vec4( diffuse * v_bump.rgb, 1.0 ) * colour;
					if ( outColor.a < 0.1 ) outColor.a = 0.0;
				}`
			),
			attribute: {},
			uniform: {},
		};

		this.shader.attribute.position = gl.getAttribLocation( this.shader.program, "a_position" );
		this.shader.attribute.uvs = gl.getAttribLocation( this.shader.program, "a_uvs" );

		this.shader.uniform.model = gl.getUniformLocation( this.shader.program, "model" );
		this.shader.uniform.view = gl.getUniformLocation( this.shader.program, "view" );
		this.shader.uniform.projection = gl.getUniformLocation( this.shader.program, "projection" );

		this.shader.uniform.lightPos = gl.getUniformLocation( this.shader.program, "lightPos" );

		this.shader.uniform.texture = gl.getUniformLocation( this.shader.program, "u_texture" );
		this.shader.uniform.heightmap = gl.getUniformLocation( this.shader.program, "u_heightmap" );
		this.shader.uniform.size = gl.getUniformLocation( this.shader.program, "u_size" );
		this.shader.uniform.heightscale = gl.getUniformLocation( this.shader.program, "u_heightscale" );

		this.heightmap = image_utils.createCanvasTexture( gl, size );
		this.heightmap.ctx.fillStyle = "green";
		this.heightmap.ctx.fillRect( 0, 0, size, size );
		const heightImageData = this.heightmap.ctx.getImageData( 0, 0, size, size );
		const pixels = heightImageData.data;

		this.verticesBuffer = gl.createBuffer();
		this.uvsBuffer = gl.createBuffer();

		const vertices = [];
		const uvs = [];
		const charUV = characterset.uvs[ baseLayer ? "█" : "░" ];

		const noise = createNoise2D( seedrandom( seed ) );
		const octaves = [
			{ frequency: 2.0 / size, amplitude: 0.6 },
			{ frequency: 4.0 / size, amplitude: 0.3 },
			{ frequency: 8.0 / size, amplitude: 0.1 }
		];

		const halfSize = size * 0.5;
		let y = - halfSize;

		this.indices = 0;

		for ( let yi = 0; yi < size; yi ++ ) {

			let x = - halfSize;

			for ( let xi = 0; xi < size; xi ++ ) {

				let height = 0;

				for ( let octave of octaves ) height += noise( x * octave.frequency, y * octave.frequency ) * octave.amplitude;

				vertices.push( x, y, x, y + 1, x + 1, y, x + 1, y + 1 );

				let i = ( yi * size + xi ) * 4;

				pixels[ i + 2 ] = ( height + 1 ) * 127;

				uvs.push( ...charUV );

				this.indices += 4;

				x ++;

			}

			y ++;

			if ( yi < size - 1 ) {

				vertices.push( halfSize, y, - halfSize, y );
				uvs.push( 0, 0, 0, 0 );
				this.indices += 2;

			}

		}

		this.heightmap.ctx.putImageData( heightImageData, 0, 0 );
		image_utils.updateTexture( gl, this.heightmap.canvas, this.heightmap.texture );

		this.vao = gl.createVertexArray();

		gl.bindVertexArray( this.vao );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.verticesBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Uint16Array( vertices ), gl.STATIC_DRAW );
		gl.vertexAttribPointer( this.shader.attribute.position, 2, gl.SHORT, false, 0, 0 );
		gl.enableVertexAttribArray( this.shader.attribute.position );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.uvsBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( uvs ), gl.STATIC_DRAW );
		gl.vertexAttribPointer( this.shader.attribute.uvs, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.shader.attribute.uvs );

		gl.bindVertexArray( null );

	}

}

const terrain = new TiledTerrain( 16 );
const terrain2 = new TiledTerrain( terrain.size, false, terrain.seed );
terrain2.setPosition( 0, 0.2, 0 );
terrain.add( terrain2 );





const camera = new OrthogonalCamera();
//const camera = new PerspectiveCamera( 70 );
const orbitControl = new OrbitControl( camera, 30 );
orbitControl.rotateX( - 0.5 );





window.addEventListener( "resize", () => gl.viewport( 0, 0, gl.canvas.width = window.innerWidth, gl.canvas.height = window.innerHeight ) );

window.addEventListener( "wheel", event => {

	const delta = event.deltaY > 0 ? 1.01 : 0.99;
	camera.zoom( delta );

} );

const mouse = {
	button: [ null, null ],
	pos: [ 0, 0 ]
};



window.addEventListener( "mousedown", event => {

	mouse.button[ event.button ] = vec3.set( event.clientX, event.clientY, 0 );
	mouse.pos[ 0 ] = null;

} );

window.addEventListener( "mouseup", event => {

	mouse.button[ event.button ] = null;

} );

window.addEventListener( "mousemove", event => {

	let a = mouse.button[ 0 ];

	mouse.pos[ 1 ] = mouse.pos[ 0 ];
	mouse.pos[ 0 ] = vec3.set( event.clientX, event.clientY, 0 );

	if ( a ) {

		let n = vec3.subtract( mouse.pos[ 1 ] || mouse.button[ 0 ], mouse.pos[ 0 ] );

		orbitControl.rotateX( n[ 1 ] / canvas.height );
		orbitControl.rotateY( n[ 0 ] / canvas.width );
		orbitControl.updateMatrix();

	}

} );


const light = {
	position: vec3.set( - 1000, 1000, 1000 )
};


const scene = [ terrain, terrain2 ];



function animate() {

	requestAnimationFrame( animate );

	terrain.rotateY( 0.001 );

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	for ( let object of scene ) {

		gl.useProgram( object.shader.program );

		gl.uniform1i( object.shader.uniform.texture, 0 );
		gl.uniform1i( object.shader.uniform.heightmap, 1 );

		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, characterset.texture );
		gl.activeTexture( gl.TEXTURE1 );
		gl.bindTexture( gl.TEXTURE_2D, object.heightmap.texture );

		gl.bindVertexArray( object.vao );

		gl.uniformMatrix4fv( object.shader.uniform.model, false, object.worldMatrix );
		gl.uniformMatrix4fv( object.shader.uniform.view, false, camera.view );
		gl.uniformMatrix4fv( object.shader.uniform.projection, false, camera.projection );

		gl.uniform3fv( object.shader.uniform.lightPos, light.position );
		gl.uniform1f( object.shader.uniform.size, object.size );
		gl.uniform1f( object.shader.uniform.heightscale, object.heightScale );

		gl.drawArrays( gl.TRIANGLE_STRIP, 0, object.indices );

	}

}

animate();
