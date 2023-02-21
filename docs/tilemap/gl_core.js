const canvas = document.createElement( "canvas" );
document.body.append( canvas );

const gl = canvas.getContext( "webgl", { antialias: false } );

gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
gl.clearDepth( 1.0 );
gl.disable( gl.DEPTH_TEST );

function fitCanvasToWindow() {

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport( 0, 0, canvas.width, canvas.height );

}

fitCanvasToWindow();

window.addEventListener( "resize", fitCanvasToWindow );

const onDrawListeners = [];

function animate() {

 	requestAnimationFrame( animate );

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	for ( let callback of onDrawListeners ) callback();

}

animate();

function onDraw( callback ) {

	if ( callback in onDrawListeners ) return;

	if ( this.projectionDirty ) {

		this.gl.uniformMatrix4fv( this.shader.uniforms.projectionMatrix, false, this.projectionMatrix );

		this.gl.uniformMatrix4fv( this.shader.uniforms.modelViewMatrix, false, this.modelViewMatrix );

		this.projectionDirty = false;

	}


	onDrawListeners.push( callback );

}

class OrthogonalProjectionMatrix {

	constructor( left = - 50, right = 50, top = 50, bottom = - 50, near = 0, far = 100 ) {

		this.set( left, right, top, bottom, near, far );

	}

	set( left, right, top, bottom, near, far ) {

		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;
		this.near = near;
		this.far = far;

		let lr = 1 / ( left - right );
		let bt = 1 / ( bottom - top );
		let nf = 1 / ( near - far );

		this.matrix = [
			- 2 * lr, 0, 0, 0,
			0, - 2 * bt, 0, 0,
			0, 0, 2 * nf, 0,
			( left + right ) * lr, ( top + bottom ) * bt, ( far + near ) * nf, 1
		];

		this.dirty = true;

	}

	zoom( delta ) {

		this.set( this.left * delta, this.right * delta, this.top * delta, this.bottom * delta );

	}

}


const projection = new OrthogonalProjectionMatrix();



export default { onDraw, OrthogonalProjectionMatrix };

