export function set( x, y, dst ) {

	dst = dst || new Array( 2 );

	dst[ 0 ] = x;
	dst[ 1 ] = y;

	return dst;

}

export function normalise( v, dst ) {

	dst = dst || new Array( 2 );

	let x = v[ 0 ];
	let y = v[ 1 ];

	let len = x * x + y * y;

	if ( len > 0 ) len = 1 / Math.sqrt( len );

	dst[ 0 ] = x * len;
	dst[ 1 ] = y * len;

	return dst;

}

export function add( a, b, dst ) {

	dst = dst || new Array( 2 );

	dst[ 0 ] = a[ 0 ] + b[ 0 ];
	dst[ 1 ] = a[ 1 ] + b[ 1 ];

	return dst;

}


export function subtract( a, b, dst ) {

	dst = dst || new Array( 2 );

	dst[ 0 ] = a[ 0 ] - b[ 0 ];
	dst[ 1 ] = a[ 1 ] - b[ 1 ];

	return dst;

}


export function multiply( a, b, dst ) {

	dst = dst || new Array( 2 );

	dst[ 0 ] = a[ 0 ] * b[ 0 ];
	dst[ 1 ] = a[ 1 ] * b[ 1 ];

	return dst;

}


export function divide( a, b, dst ) {

	dst = dst || new Array( 2 );

	dst[ 0 ] = a[ 0 ] / b[ 0 ];
	dst[ 1 ] = a[ 1 ] / b[ 1 ];

	return dst;

}

export function distance( a, b ) {

	let dx = b[ 0 ] - a[ 0 ];
	let dy = b[ 1 ] - a[ 1 ];

	return Math.sqrt( dx * dx + dy * dy );

}
