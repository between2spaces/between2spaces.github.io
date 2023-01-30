export function create() {

	return new Array( 16 );

}

export function	identity( out ) {

	out[ 0 ] = 1;
	out[ 1 ] = 0;
	out[ 2 ] = 0;
	out[ 3 ] = 0;
	out[ 4 ] = 0;
	out[ 5 ] = 1;
	out[ 6 ] = 0;
	out[ 7 ] = 0;
	out[ 8 ] = 0;
	out[ 9 ] = 0;
	out[ 10 ] = 1;
	out[ 11 ] = 0;
	out[ 12 ] = 0;
	out[ 13 ] = 0;
	out[ 14 ] = 0;
	out[ 15 ] = 1;

	return out;

}

export function perspective( out, fovy, aspect, near, far ) {

	const f = 1.0 / Math.tan( fovy / 2 );

	out[ 0 ] = f / aspect;
	out[ 1 ] = 0;
	out[ 2 ] = 0;
	out[ 3 ] = 0;
	out[ 4 ] = 0;
	out[ 5 ] = f;
	out[ 6 ] = 0;
	out[ 7 ] = 0;
	out[ 8 ] = 0;
	out[ 9 ] = 0;
	out[ 11 ] = - 1;
	out[ 12 ] = 0;
	out[ 13 ] = 0;
	out[ 15 ] = 0;

	if ( far != null && far !== Infinity ) {

	  const nf = 1 / ( near - far );
	  out[ 10 ] = ( far + near ) * nf;
	  out[ 14 ] = 2 * far * near * nf;

	} else {

	  out[ 10 ] = - 1;
	  out[ 14 ] = - 2 * near;

	}

	return out;

}

export function ortho( out, left, right, bottom, top, near, far ) {

	const lr = 1 / ( left - right );
	const bt = 1 / ( bottom - top );
	const nf = 1 / ( near - far );

	out[ 0 ] = - 2 * lr;
	out[ 1 ] = 0;
	out[ 2 ] = 0;
	out[ 3 ] = 0;
	out[ 4 ] = 0;
	out[ 5 ] = - 2 * bt;
	out[ 6 ] = 0;
	out[ 7 ] = 0;
	out[ 8 ] = 0;
	out[ 9 ] = 0;
	out[ 10 ] = 2 * nf;
	out[ 11 ] = 0;
	out[ 12 ] = ( left + right ) * lr;
	out[ 13 ] = ( top + bottom ) * bt;
	out[ 14 ] = ( far + near ) * nf;
	out[ 15 ] = 1;

	return out;

}


export function translate( out, vec3 ) {

	let x = vec3[ 0 ];
	let y = vec3[ 1 ];
	let z = vec3[ 2 ];

	out[ 12 ] = out[ 0 ] * x + out[ 4 ] * y + out[ 8 ] * z + out[ 12 ];
	out[ 13 ] = out[ 1 ] * x + out[ 5 ] * y + out[ 9 ] * z + out[ 13 ];
	out[ 14 ] = out[ 2 ] * x + out[ 6 ] * y + out[ 10 ] * z + out[ 14 ];
	out[ 15 ] = out[ 3 ] * x + out[ 7 ] * y + out[ 11 ] * z + out[ 15 ];

	return out;

}
