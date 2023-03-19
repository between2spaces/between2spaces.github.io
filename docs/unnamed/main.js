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

gl.enable( gl.DEPTH_TEST );
gl.depthFunc( gl.LESS );


const characterset = image_utils.charTileMap( gl, "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕" );


const terrainTexture = image_utils.loadTexture( gl, "dembase1.jpg" );


class TiledTerrain extends Object {

	constructor( size ) {

		super();

		this.size = size;
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
					float Az = texture( u_heightmap, vec2( u + w, v ) ).b - v_bump.b;
					float Bz = texture( u_heightmap, vec2( u, v + w ) ).b - v_bump.b;
					v_normal = normalize( vec3( -Az, 1, -Bz ) );
					vec4 pos = vec4( a_position.x, v_bump.b * u_heightscale, a_position.y, 1.0 );
					fragPos = vec3( model * pos );
					gl_Position = projection * view * pos;
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
					vec3 lightDir = normalize( lightPos - fragPos );
					float diffuse = max( dot( v_normal, lightDir ), 0.0 );
					vec4 char = texture(characterset, v_uv);
					vec3 v_up = normalize( vec3( 0, 1, 0 ) );
					float flatness = dot( v_normal, v_up );
					//flatness = flatness * flatness * flatness * flatness * flatness * flatness * flatness;
					if ( flatness > 0.993 ) {
						flatness = flatness;
					} else {
						flatness = 0.2;
					}
					//outColor = vec4( diffuse * v_bump.rgb, 1.0 ) * char;
					outColor = vec4( flatness, flatness, flatness, 1.0 ) * char;
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

		this.heightmap = {
			canvasTexture: image_utils.createCanvasTexture( gl, this.size )
		};
		this.heightmap.imageData = this.heightmap.canvasTexture.ctx.getImageData( 0, 0, this.size, this.size );
		this.heightmap.pixels = this.heightmap.imageData.data;

		this.verticesBuffer = gl.createBuffer();
		this.uvsBuffer = gl.createBuffer();

		const vertices = [];
		const uvs = [];
		const charUV = characterset.uvs[ "█" ];
		const halfSize = this.size * 0.5;

		let z = - halfSize;

		this.indices = 0;

		for ( let zi = 0; zi < this.size; zi ++ ) {

			let x = - halfSize;

			for ( let xi = 0; xi < this.size; xi ++ ) {

				vertices.push( x, z, x, z + 1, x + 1, z, x + 1, z + 1 );
				uvs.push( ...charUV );
				this.indices += 4;
				x ++;

			}

			z ++;

			if ( zi < this.size - 1 ) {

				vertices.push( halfSize, z, - halfSize, z );
				uvs.push( 0, 0, 0, 0 );
				this.indices += 2;

			}

		}

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

	generate( seed = Math.random() * 999999999, edgeWidth = null ) {

		this.seed = seed;
		this.noise = createNoise2D( seedrandom( this.seed ) );
		this.edgeWidth = edgeWidth === null ? this.size * 0.3 : edgeWidth;

		const octaves = [
			{ frequency: 2.0 / this.size, amplitude: 0.6 },
			{ frequency: 4.0 / this.size, amplitude: 0.3 },
			{ frequency: 8.0 / this.size, amplitude: 0.1 }
		];

		let edgeSq = Math.sqrt( this.edgeWidth * this.edgeWidth * 2 );

		for ( let zi = 0; zi < this.size; zi ++ ) {

			for ( let xi = 0; xi < this.size; xi ++ ) {

				let height = 0;

				for ( let octave of octaves ) height += this.noise( xi * octave.frequency, zi * octave.frequency ) * octave.amplitude;

				let dx = 0;
				let dz = 0;

				if ( xi < this.edgeWidth ) dx = this.edgeWidth - xi;
				if ( zi < this.edgeWidth ) dz = this.edgeWidth - zi;
				if ( zi > this.size - this.edgeWidth ) dz = zi - ( this.size - this.edgeWidth );
				if ( xi > this.size - this.edgeWidth ) dx = xi - ( this.size - this.edgeWidth );

				let clamp = ( dx > 0 || dz > 0 ) ? ( edgeSq - Math.sqrt( dx * dx + dz * dz ) ) / edgeSq : 1;

				let index = ( zi * this.size + xi ) * 4;

				this.heightmap.pixels[ index + 2 ] = ( height + 1 ) * 127 * clamp * clamp;
				this.heightmap.pixels[ index + 3 ] = 255;

			}

		}

		// shift range from [-1, 1] to [0, 1]; and
		// normalise such that lowest is 0 and highest is 1; and
		// clamp height near edges (i.e. gaurantees island )
		// let normalised = 1.0 / ( maxHeight - minHeight );
		// let edgeSq = Math.sqrt( this.edgeWidth * this.edgeWidth * 2 );

		// for ( let y = 0; y < this.mapSize; y ++ ) {

		// 	for ( let x = 0; x < this.mapSize; x ++ ) {

		// 		let index = y * this.mapSize + x;

		// 		let dx = 0;
		// 		let dy = 0;

		// 		if ( x < this.edgeWidth ) dx = this.edgeWidth - x;
		// 		if ( y < this.edgeWidth ) dy = this.edgeWidth - y;
		// 		if ( y > this.mapSize - this.edgeWidth ) dy = y - ( this.mapSize - this.edgeWidth );
		// 		if ( x > this.mapSize - this.edgeWidth ) dx = x - ( this.mapSize - this.edgeWidth );

		// 		let clamp = ( dx > 0 || dy > 0 ) ? ( edgeSq - Math.sqrt( dx * dx + dy * dy ) ) / edgeSq : 1;

		// 		let height = ( this.heightArray[ index ] - minHeight ) * normalised * clamp * clamp;
		// 		this.heightArray[ index ] = height;

		// 	}

		// }

		this.heightmap.canvasTexture.ctx.putImageData( this.heightmap.imageData, 0, 0 );
		image_utils.updateTexture( gl, this.heightmap.canvasTexture.canvas, this.heightmap.canvasTexture.texture );
		//document.body.append( this.heightmap.canvasTexture.canvas );

	}

}

const terrain = new TiledTerrain( 128 );
terrain.generate();
//const terrain2 = new TiledTerrain( terrain.size, false, terrain.seed );
//terrain2.setPosition( 0, 0.2, 0 );
//terrain.add( terrain2 );





//const camera = new OrthogonalCamera();
const camera = new PerspectiveCamera( 70 );
const orbitControl = new OrbitControl( camera, terrain.size );
orbitControl.rotateX( - Math.PI * 0.1 );




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
	position: vec3.set( - 1000, 1000, - 1000 )
};


const scene = [ terrain ];



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
		gl.bindTexture( gl.TEXTURE_2D, object.heightmap.canvasTexture.texture );

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
