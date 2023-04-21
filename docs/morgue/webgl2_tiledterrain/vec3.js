export const _xAxis = set( 1, 0, 0 );
export const _yAxis = set( 0, 1, 0 );
export const _zAxis = set( 0, 0, 1 );


export function identity( dst ) {

	return set( 0, 0, 0, dst );

}


export function set( x = 0, y = 0, z = 0, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = x;
	dst[ 1 ] = y;
	dst[ 2 ] = z;

	return dst;

}


export function copy( v, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = v[ 0 ];
	dst[ 1 ] = v[ 1 ];
	dst[ 2 ] = v[ 2 ];

	return dst;

}


export function normalise( v, dst ) {

	dst = dst || new Array( 3 );

	let x = v[ 0 ];
	let y = v[ 1 ];
	let z = v[ 2 ];

	let len = x * x + y * y + z * z;

	if ( len > 0 ) len = 1 / Math.sqrt( len );

	dst[ 0 ] = x * len;
	dst[ 1 ] = y * len;
	dst[ 2 ] = z * len;

	return dst;

}

export function add( a, b, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = a[ 0 ] + b[ 0 ];
	dst[ 1 ] = a[ 1 ] + b[ 1 ];
	dst[ 2 ] = a[ 2 ] + b[ 2 ];

	return dst;

}


export function subtract( a, b, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = a[ 0 ] - b[ 0 ];
	dst[ 1 ] = a[ 1 ] - b[ 1 ];
	dst[ 2 ] = a[ 2 ] - b[ 2 ];

	return dst;

}


export function multiply( a, b, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = a[ 0 ] * b[ 0 ];
	dst[ 1 ] = a[ 1 ] * b[ 1 ];
	dst[ 2 ] = a[ 2 ] * b[ 2 ];

	return dst;

}


export function multiplyScalar( v, scalar, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = v[ 0 ] * scalar;
	dst[ 1 ] = v[ 1 ] * scalar;
	dst[ 2 ] = v[ 2 ] * scalar;

	return dst;

}


export function divide( a, b, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = a[ 0 ] / b[ 0 ];
	dst[ 1 ] = a[ 1 ] / b[ 1 ];
	dst[ 2 ] = a[ 2 ] / b[ 2 ];

	return dst;

}


export function dot( a, b, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = a[ 0 ] * b[ 0 ];
	dst[ 1 ] = a[ 1 ] * b[ 1 ];
	dst[ 2 ] = a[ 2 ] * b[ 2 ];

	return dst;

}


export function cross( a, b, dst ) {

	dst = dst || new Array( 3 );

	let ax = a[ 0 ], ay = a[ 1 ], az = a[ 2 ];
	let bx = b[ 0 ], by = b[ 1 ], bz = b[ 2 ];

	//console.log( ay + ' * ' + bz + ' - ' + az + ' * ' + by + ' = ' + ( ay * bz - az * by ) );
	//console.log( az + ' * ' + bx + ' - ' + ax + ' * ' + bz + ' = ' + ( az * bx - ax * bz ) );
	//console.log( ax + ' * ' + by + ' - ' + ay + ' * ' + bx + ' = ' + ( ax * by - ay * bx ) );

	dst[ 0 ] = ay * bz - az * by;
	dst[ 1 ] = az * bx - ax * bz;
	dst[ 2 ] = ax * by - ay * bx;

	return dst;

}

export function distance( a, b ) {

	let dx = b[ 0 ] - a[ 0 ];
	let dy = b[ 1 ] - a[ 1 ];
	let dz = b[ 2 ] - a[ 2 ];

	return Math.sqrt( dx * dx + dy * dy + dz * dz );

}


export function length( v ) {

	return Math.sqrt( v[ 0 ] * v[ 0 ] + v[ 1 ] * v[ 1 ] + v[ 2 ] * v[ 2 ] );

}


export function negate( v, dst ) {

	dst = dst || new Array( 3 );

	dst[ 0 ] = - v[ 0 ];
	dst[ 1 ] = - v[ 1 ];
	dst[ 2 ] = - v[ 2 ];

	return dst;

}
