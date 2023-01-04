//const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const characters = "░▒▓█";

const worldRows = 128;
const worldCols = 128;
const worldDepth = 128;

const world = new Array( worldDepth * worldRows * worldCols );

for ( let depth = 0; depth < worldDepth; depth ++ ) {

	for ( let row = 0; row < worldRows; row ++ ) {

		for ( let col = 0; col < worldCols; col ++ ) {

			const cell = world[ depth * worldRows * worldCols + row * worldCols + col ] = {
				depth, row, col,
		        type: characters.charAt( Math.floor( Math.random() * characters.length ) )
			};

		}

	}

}


let viewRows = worldRows;
let viewCols = worldCols;
let viewOriginX = 0;
let viewOriginY = 0;
let viewOffsetDepth = worldDepth / 2;

let viewCellWidth = 32;
let viewCellHeight = 32;
let viewScale = 1;

const canvas = document.createElement( "canvas" );
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.width = Math.round( window.innerWidth * viewScale * 0.5 ) * 2;
canvas.height = Math.round( window.innerHeight * viewScale * 0.5 ) * 2;
console.log( canvas.width, canvas.height );



let ctx = canvas.getContext( "2d" );
ctx.font = `${viewCellHeight}px monospace`;


document.body.append( canvas );

const view = new Array( viewRows * viewCols );

let viewDirty = [];

for ( let row = 0; row < viewRows; row ++ ) {

	for ( let col = 0; col < viewCols; col ++ ) {

		const cell = view[ viewRows * viewCols + row * viewCols + col ] = {
			x: col * viewCellWidth,
			y: row * viewCellHeight,
			world: world[ viewOffsetDepth * worldRows * worldCols + row * worldCols + col ]
		};
		viewDirty.push( cell );

	}

}

//document.body.style.fontVariantNumeric = "tabular-nums lining-nums";
//document.body.style.fontSize = `${viewCellHeight * 1.5}px`;


function resizeView() {

	canvas.width = Math.round( window.innerWidth * viewScale * 0.5 ) * 2;
	canvas.height = Math.round( window.innerHeight * viewScale * 0.5 ) * 2;

	for ( let row = 0; row < viewRows; row ++ ) {

		for ( let col = 0; col < viewCols; col ++ ) {

			const cell = view[ viewRows * viewCols + row * viewCols + col ];
			viewDirty.push( cell );

		}

	}

	//ctx = canvas.getContext( "2d" );
	//ctx.font = `${viewCellHeight}px monospace`;

}

resizeView();

window.addEventListener( "resize", resizeView );


function zoomView( x, y, delta ) {

	viewScale *= delta;

	let scaledWidth = Math.max( window.innerWidth, Math.round( ( window.innerWidth / viewScale ) * 0.5 ) * 2 );
	let scaledHeight = Math.max( window.innerHeight, Math.round( ( window.innerHeight / viewScale ) * 0.5 ) * 2 );

	canvas.width = scaledWidth;
	canvas.height = scaledHeight;

	viewOriginX = Math.min( 0, Math.round( ( x - ( x - viewOriginX ) * delta ) * 0.5 ) * 2 );
	viewOriginY = Math.min( 0, Math.round( ( y - ( y - viewOriginY ) * delta ) * 0.5 ) * 2 );

	console.log( viewScale, viewOriginX );

	ctx.setTransform( viewScale, 0, 0, viewScale, viewOriginX, viewOriginY );

	for ( let row = 0; row < viewRows; row ++ ) {

		for ( let col = 0; col < viewCols; col ++ ) {

			const cell = view[ viewRows * viewCols + row * viewCols + col ];
			viewDirty.push( cell );

		}

	}

}


window.addEventListener( "wheel", event => {

	zoomView( event.clientX, event.clientY, event.wheelDeltaY > 0 ? 1.1 : 1 / 1.1 );

} );




function animate() {

	requestAnimationFrame( animate );

	if ( viewDirty.length ) {

		const dirty = viewDirty;
		viewDirty = [];

		for ( let i = 0; i < dirty.length; i ++ ) {

			const cell = dirty[ i ];

			ctx.fillText( cell.world.type, cell.x, cell.y );

		}

	}


}

animate();

