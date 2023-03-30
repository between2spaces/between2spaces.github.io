import Object from "./object.js";
import * as image_utils from "./image_utils.js";
import Material from "./material.js";
import { createNoise2D } from "./simplexnoise.js";
import { seedrandom } from "./seedrandom.js";



const material = new Material( this.gl,
	`#version 300 es
	in vec2 position;
	in vec2 uvs;
	out vec3 fragPos;
	out vec4 v_bump;
	out vec3 v_normal;
	out vec2 v_uv;
	uniform mat4 model;
	uniform mat4 view;
	uniform mat4 projection;
	uniform sampler2D heightmap;
	uniform float size;
	uniform float heightscale;

	void main() {
		float halfsize = size * 0.5;
		float w = 1.0 / size;
		float u = ( position.x + halfsize ) / size;
		float v = ( position.y + halfsize ) / size;
		v_bump = texture( heightmap, vec2( u, v ) );
		float Az = texture( heightmap, vec2( u + w, v ) ).a - v_bump.a;
		float Bz = texture( heightmap, vec2( u, v + w ) ).a - v_bump.a;
		v_normal = normalize( vec3( -Az, 1, -Bz ) );
		vec4 pos = vec4( position.x, v_bump.a * heightscale, position.y, 1.0 );
		fragPos = vec3( model * pos );
		gl_Position = projection * view * pos;
		v_uv = uvs;
	}
	`,
	`#version 300 es
	precision highp float;
	in vec3 fragPos;
	in vec4 v_bump;
	in vec3 v_normal;
	in vec2 v_uv;
	out vec4 outColor;
	uniform vec3 lightDirection;
	uniform vec3 lightColour;
	uniform sampler2D characterset;

	void main() {
		//vec3 reverseLightDirection = normalize( lightPos - fragPos );
		vec3 diffuse = lightColour * max( dot( v_normal, lightDirection ), 0.0 );
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
		outColor = vec4( char.rgb * v_bump.rgb * diffuse, 1.0 );
	}`
);

material.setAttributeLocations( [ "position", "uvs" ] );

material.setUniformLocations( [
	"model", "view", "projection", "lightDirection", "lightColour",
	"texture", "heightmap", "size", "heightscale"
] );



export default class TiledTerrain extends Mesh {

	constructor( gl, size = 32, characterset = image_utils.charTileMap( gl, " ░▒▓█" ) ) {

		super();

		this.gl = gl;
		this.size = size;
		this.characterset = characterset;
		this.heightScale = Math.sqrt( size ) * 3;

		if ( ! material ) {

		this.heightmap = image_utils.createCanvasTexture( this.gl, this.size );

		this.verticesBuffer = this.gl.createBuffer();
		this.uvsBuffer = this.gl.createBuffer();

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

		this.vao = this.gl.createVertexArray();

		this.gl.bindVertexArray( this.vao );

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.verticesBuffer );
		this.gl.bufferData( this.gl.ARRAY_BUFFER, new Uint16Array( vertices ), this.gl.STATIC_DRAW );
		this.gl.vertexAttribPointer( this.shader.attribute.position, 2, this.gl.SHORT, false, 0, 0 );
		this.gl.enableVertexAttribArray( this.shader.attribute.position );

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.uvsBuffer );
		this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( uvs ), this.gl.STATIC_DRAW );
		this.gl.vertexAttribPointer( this.shader.attribute.uvs, 2, this.gl.FLOAT, false, 0, 0 );
		this.gl.enableVertexAttribArray( this.shader.attribute.uvs );

		this.gl.bindVertexArray( null );

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

		const heightdata = this.heightmap.imageData.data;

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

				let edgeClamp = ( dx > 0 || dz > 0 ) ? Math.pow( ( edgeSq - Math.sqrt( dx * dx + dz * dz ) ) / edgeSq, 2 ) : 1;

				let index = ( zi * this.size + xi ) * 4;

				heightdata[ index ] = 100 + Math.floor( Math.random() * 100 );
				heightdata[ index + 1 ] = heightdata[ index ];
				heightdata[ index + 2 ] = heightdata[ index ];
				heightdata[ index + 3 ] = ( height + 1 ) * 127 * edgeClamp;

			}

		}

		this.heightmap.ctx.putImageData( this.heightmap.imageData, 0, 0 );

		image_utils.updateTexture( this.gl, this.heightmap.canvas, this.heightmap.texture );

	}

	render() {

		this.gl.uniformMatrix4fv( this.uniform.model, false, this.worldMatrix );
		this.gl.uniform1i( this.uniform.heightmap, 1 );

		this.gl.activeTexture( this.gl.TEXTURE1 );
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.heightmap.texture );

		this.gl.bindVertexArray( this.vao );

		this.gl.uniform1f( this.uniform.size, this.size );
		this.gl.uniform1f( this.uniform.heightscale, this.heightScale );

		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, this.indices );


		this.gl.useProgram( this.shader.program );

		this.gl.uniform1i( this.shader.uniform.texture, 0 );
		this.gl.uniform1i( this.shader.uniform.heightmap, 1 );

		this.gl.activeTexture( this.gl.TEXTURE0 );
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.characterset.texture );
		this.gl.activeTexture( this.gl.TEXTURE1 );
		this.gl.bindTexture( this.gl.TEXTURE_2D, this.heightmap.texture );

		this.gl.bindVertexArray( this.vao );

		this.gl.uniformMatrix4fv( this.shader.uniform.model, false, this.worldMatrix );
		this.gl.uniformMatrix4fv( this.shader.uniform.view, false, camera.view );
		this.gl.uniformMatrix4fv( this.shader.uniform.projection, false, camera.projection );

		this.gl.uniform3fv( this.shader.uniform.lightDirection, light.directional.position );
		this.gl.uniform3fv( this.shader.uniform.lightColour, light.directional.colour );
		this.gl.uniform1f( this.shader.uniform.size, this.size );
		this.gl.uniform1f( this.shader.uniform.heightscale, this.heightScale );

		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, this.indices );

	}

}

