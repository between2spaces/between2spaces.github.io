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
let viewOffsetRow = 0;
let viewOffsetCol = 0;
let viewOffsetDepth = worldDepth / 2;

let viewDivWidth = 32;
let viewDivHeight = 32;

const view = new Array( viewRows * viewCols );

let viewDirty = [];

for ( let row = 0; row < viewRows; row ++ ) {

	for ( let col = 0; col < viewCols; col ++ ) {

		const cell = view[ viewRows * viewCols + row * viewCols + col ] = {
			row, col,
			div: document.createElement( "div" ),
			world: world[ viewOffsetDepth * worldRows * worldCols + row * worldCols + col ]
		};
		cell.div.style.position = "absolute";
		cell.div.style.left = `${col * viewDivWidth}px`;
		cell.div.style.top = `${row * viewDivHeight}px`;
		cell.div.style.width = `${viewDivWidth}px`;
		cell.div.style.height = `${viewDivHeight}px`;
		document.body.append( cell.div );
		viewDirty.push( cell );

	}

}

document.body.style.fontVariantNumeric = "tabular-nums lining-nums";
document.body.style.fontSize = `${viewDivHeight * 1.5}px`;


function resizeView() {

}

window.addEventListener( "resize", resizeView );


function zoomView( delta ) {

	//document.body.style.zoom += delta;
	//console.log( document.body.style.zoom );

}


window.addEventListener( "wheel", event => zoomView( event.wheelDeltaY > 0 ? 1 : - 1 ) );


function animate() {

	requestAnimationFrame( animate );

	if ( viewDirty.length ) {

		const dirty = viewDirty;
		viewDirty = [];

		for ( let i = 0; i < dirty.length; i ++ ) {

			const cell = dirty[ i ];

			cell.div.textContent = cell.world.type;

		}

	}


}

animate();

