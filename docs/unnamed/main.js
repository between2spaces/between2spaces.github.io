import * as image_utils from "./image_utils.js";
import { OrthogonalCamera, PerspectiveCamera, OrbitControl } from "./camera.js";
import * as vec3 from "./vec3.js";
import TiledTerrain from "./tiledterrain.js";



class Renderer {

	constructor() {

		this.canvas = document.querySelector( "canvas" );
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.gl = canvas.getContext( "webgl2", { alpha: false } );

		this.gl.enable( this.gl.DEPTH_TEST );
		this.gl.depthFunc( this.gl.LESS );

		this.shaders = [];

	}


	render( scene, camera ) {

		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

		scene.render( camera );

	}

}


// const characterset = image_utils.charTileMap( gl, "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+[]{}\\|;':\",.<>/? ░▒▓█│─╮╭╯╰┐┌┘└←↑→↓↖↗↘↙↔↕" );
// const terrainTexture = image_utils.loadTexture( gl, "dembase1.jpg" );


const terrain = new TiledTerrain( gl, 128 );
terrain.generate();
//const terrain2 = new TiledTerrain( gl, terrain.size );
//terrains.generate( terrain.seed );
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
	directional: {
		position: vec3.normalise( vec3.set( - 1000, 100, - 1000 ) ),
		colour: vec3.set( 3.0, 3.0, 3.0 )
	}
};











const renderer = new Renderer();
const scene = new Scene();



function animate() {

	requestAnimationFrame( animate );

	renderer.render( scene, camera );

	terrain.rotateY( 0.001 );

}

animate();

