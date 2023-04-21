import * as vec3 from "./vec3.js";
import * as quaternion from "./quaternion.js";


const _v = vec3.identity();
const _m = identity();


export function identity( dst ) {

	return set( 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, dst );

}


export function set( m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44, dst ) {

	dst = dst || new Array( 16 );

	dst[ 0 ] = m11;
	dst[ 1 ] = m12;
	dst[ 2 ] = m13;
	dst[ 3 ] = m14;
	dst[ 4 ] = m21;
	dst[ 5 ] = m22;
	dst[ 6 ] = m23;
	dst[ 7 ] = m24;
	dst[ 8 ] = m31;
	dst[ 9 ] = m32;
	dst[ 10 ] = m33;
	dst[ 11 ] = m34;
	dst[ 12 ] = m41;
	dst[ 13 ] = m42;
	dst[ 14 ] = m43;
	dst[ 15 ] = m44;

	return dst;

}


export function copy( m, dst ) {

	dst = dst || new Array( 16 );

	dst[ 0 ] = m[ 0 ];
	dst[ 1 ] = m[ 1 ];
	dst[ 2 ] = m[ 2 ];
	dst[ 3 ] = m[ 3 ];
	dst[ 4 ] = m[ 4 ];
	dst[ 5 ] = m[ 5 ];
	dst[ 6 ] = m[ 6 ];
	dst[ 7 ] = m[ 7 ];
	dst[ 8 ] = m[ 8 ];
	dst[ 9 ] = m[ 9 ];
	dst[ 10 ] = m[ 10 ];
	dst[ 11 ] = m[ 11 ];
	dst[ 12 ] = m[ 12 ];
	dst[ 13 ] = m[ 13 ];
	dst[ 14 ] = m[ 14 ];
	dst[ 15 ] = m[ 15 ];

	return dst;

}


export function compose( position, rotation, scale, dst ) {

	dst = dst || new Array( 16 );

	const x = rotation[ 0 ], y = rotation[ 1 ], z = rotation[ 2 ], w = rotation[ 3 ];
	const x2 = x + x,	y2 = y + y, z2 = z + z;
	const xx = x * x2, xy = x * y2, xz = x * z2;
	const yy = y * y2, yz = y * z2, zz = z * z2;
	const wx = w * x2, wy = w * y2, wz = w * z2;

	const sx = scale[ 0 ], sy = scale[ 1 ], sz = scale[ 2 ];

	dst[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
	dst[ 1 ] = ( xy + wz ) * sx;
	dst[ 2 ] = ( xz - wy ) * sx;
	dst[ 3 ] = 0;

	dst[ 4 ] = ( xy - wz ) * sy;
	dst[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
	dst[ 6 ] = ( yz + wx ) * sy;
	dst[ 7 ] = 0;

	dst[ 8 ] = ( xz + wy ) * sz;
	dst[ 9 ] = ( yz - wx ) * sz;
	dst[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
	dst[ 11 ] = 0;

	dst[ 12 ] = position[ 0 ];
	dst[ 13 ] = position[ 1 ];
	dst[ 14 ] = position[ 2 ];
	dst[ 15 ] = 1;

	return dst;

}


export function decompose( m, position, rotation, scale ) {

	let sx = vec3.length( vec3.set( m[ 0 ], m[ 1 ], m[ 2 ], _v ) );
	const sy = vec3.length( vec3.set( m[ 4 ], m[ 5 ], m[ 6 ], _v ) );
	const sz = vec3.length( vec3.set( m[ 8 ], m[ 9 ], m[ 10 ], _v ) );

	if ( determinant( m ) < 0 ) sx = - sx;

	position[ 0 ] = m[ 12 ];
	position[ 0 ] = m[ 13 ];
	position[ 0 ] = m[ 14 ];

	copy( m, _m );

	const invSX = 1 / sx;
	const invSY = 1 / sy;
	const invSZ = 1 / sz;

	_m[ 0 ] *= invSX;
	_m[ 1 ] *= invSX;
	_m[ 2 ] *= invSX;

	_m[ 4 ] *= invSY;
	_m[ 5 ] *= invSY;
	_m[ 6 ] *= invSY;

	_m[ 8 ] *= invSZ;
	_m[ 9 ] *= invSZ;
	_m[ 10 ] *= invSZ;

	quaternion.setFromRotationMatrix( _m, rotation );

	scale[ 0 ] = sx;
	scale[ 1 ] = sy;
	scale[ 2 ] = sz;

}


export function determinant( m ) {

	const n11 = m[ 0 ], n12 = m[ 4 ], n13 = m[ 8 ], n14 = m[ 12 ];
	const n21 = m[ 1 ], n22 = m[ 5 ], n23 = m[ 9 ], n24 = m[ 13 ];
	const n31 = m[ 2 ], n32 = m[ 6 ], n33 = m[ 10 ], n34 = m[ 14 ];
	const n41 = m[ 3 ], n42 = m[ 7 ], n43 = m[ 11 ], n44 = m[ 15 ];

	return (
		n41 * (
			+ n14 * n23 * n32
			 - n13 * n24 * n32
			 - n14 * n22 * n33
			 + n12 * n24 * n33
			 + n13 * n22 * n34
			 - n12 * n23 * n34
		) +
		n42 * (
			+ n11 * n23 * n34
			 - n11 * n24 * n33
			 + n14 * n21 * n33
			 - n13 * n21 * n34
			 + n13 * n24 * n31
			 - n14 * n23 * n31
		) +
		n43 * (
			+ n11 * n24 * n32
			 - n11 * n22 * n34
			 - n14 * n21 * n32
			 + n12 * n21 * n34
			 + n14 * n22 * n31
			 - n12 * n24 * n31
		) +
		n44 * (
			- n13 * n22 * n31
			 - n11 * n23 * n32
			 + n11 * n22 * n33
			 + n13 * n21 * n32
			 - n12 * n21 * n33
			 + n12 * n23 * n31
		)

	);

}


export function makeOrthogonal( left = - 50, right = 50, top = 50, bottom = - 50, near = 0, far = 100, dst ) {

	dst = dst || new Array( 16 );

	let lr = 1 / ( left - right );
	let bt = 1 / ( bottom - top );
	let nf = 1 / ( near - far );

	dst[ 0 ] = - 2 * lr;
	dst[ 1 ] = 0;
	dst[ 2 ] = 0;
	dst[ 3 ] = 0;
	dst[ 4 ] = 0;
	dst[ 5 ] = - 2 * bt;
	dst[ 6 ] = 0;
	dst[ 7 ] = 0;
	dst[ 8 ] = 0;
	dst[ 9 ] = 0;
	dst[ 10 ] = 2 * nf;
	dst[ 11 ] = 0;
	dst[ 12 ] = ( left + right ) * lr;
	dst[ 13 ] = ( top + bottom ) * bt;
	dst[ 14 ] = ( far + near ) * nf;
	dst[ 15 ] = 1;

	return dst;

}


export function makePerspective( fovy, aspect, near, far, dst ) {

	dst = dst || new Array( 16 );

	let f = 1.0 / Math.tan( fovy / 2 );

	dst[ 0 ] = f / aspect;
	dst[ 1 ] = 0;
	dst[ 2 ] = 0;
	dst[ 3 ] = 0;
	dst[ 4 ] = 0;
	dst[ 5 ] = f;
	dst[ 6 ] = 0;
	dst[ 7 ] = 0;
	dst[ 8 ] = 0;
	dst[ 9 ] = 0;
	dst[ 11 ] = - 1;
	dst[ 12 ] = 0;
	dst[ 13 ] = 0;
	dst[ 15 ] = 0;

	if ( far != null && far !== Infinity ) {

	  let nf = 1 / ( near - far );
	  dst[ 10 ] = ( far + near ) * nf;
	  dst[ 14 ] = 2 * far * near * nf;

	} else {

		dst[ 10 ] = - 1;
		dst[ 14 ] = - 2 * near;

	}

	return dst;

}


export function inverse( m, dst ) {

	dst = dst || new Array( 16 );

	let m00 = m[ 0 ], m01 = m[ 1 ], m02 = m[ 2 ], m03 = m[ 3 ];
	let m10 = m[ 4 ], m11 = m[ 5 ], m12 = m[ 6 ], m13 = m[ 7 ];
	let m20 = m[ 8 ], m21 = m[ 9 ], m22 = m[ 10 ], m23 = m[ 11 ];
	let m30 = m[ 12 ], m31 = m[ 13 ], m32 = m[ 14 ], m33 = m[ 15 ];

	let b00 = m00 * m11 - m01 * m10;
	let b01 = m00 * m12 - m02 * m10;
	let b02 = m00 * m13 - m03 * m10;
	let b03 = m01 * m12 - m02 * m11;
	let b04 = m01 * m13 - m03 * m11;
	let b05 = m02 * m13 - m03 * m12;
	let b06 = m20 * m31 - m21 * m30;
	let b07 = m20 * m32 - m22 * m30;
	let b08 = m20 * m33 - m23 * m30;
	let b09 = m21 * m32 - m22 * m31;
	let b10 = m21 * m33 - m23 * m31;
	let b11 = m22 * m33 - m23 * m32;

	let det =
	  b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	det = 1.0 / det;

	dst[ 0 ] = ( m11 * b11 - m12 * b10 + m13 * b09 ) * det;
	dst[ 1 ] = ( m02 * b10 - m01 * b11 - m03 * b09 ) * det;
	dst[ 2 ] = ( m31 * b05 - m32 * b04 + m33 * b03 ) * det;
	dst[ 3 ] = ( m22 * b04 - m21 * b05 - m23 * b03 ) * det;
	dst[ 4 ] = ( m12 * b08 - m10 * b11 - m13 * b07 ) * det;
	dst[ 5 ] = ( m00 * b11 - m02 * b08 + m03 * b07 ) * det;
	dst[ 6 ] = ( m32 * b02 - m30 * b05 - m33 * b01 ) * det;
	dst[ 7 ] = ( m20 * b05 - m22 * b02 + m23 * b01 ) * det;
	dst[ 8 ] = ( m10 * b10 - m11 * b08 + m13 * b06 ) * det;
	dst[ 9 ] = ( m01 * b08 - m00 * b10 - m03 * b06 ) * det;
	dst[ 10 ] = ( m30 * b04 - m31 * b02 + m33 * b00 ) * det;
	dst[ 11 ] = ( m21 * b02 - m20 * b04 - m23 * b00 ) * det;
	dst[ 12 ] = ( m11 * b07 - m10 * b09 - m12 * b06 ) * det;
	dst[ 13 ] = ( m00 * b09 - m01 * b07 + m02 * b06 ) * det;
	dst[ 14 ] = ( m31 * b01 - m30 * b03 - m32 * b00 ) * det;
	dst[ 15 ] = ( m20 * b03 - m21 * b01 + m22 * b00 ) * det;

	return dst;

}


export function multiply( a, b, dst ) {

	dst = dst || new Array( 16 );

	let a00 = a[ 0 ], a01 = a[ 1 ], a02 = a[ 2 ], a03 = a[ 3 ];
	let a10 = a[ 4 ], a11 = a[ 5 ], a12 = a[ 6 ], a13 = a[ 7 ];
	let a20 = a[ 8 ], a21 = a[ 9 ], a22 = a[ 10 ], a23 = a[ 11 ];
	let a30 = a[ 12 ], a31 = a[ 13 ], a32 = a[ 14 ], a33 = a[ 15 ];

	let b0 = b[ 0 ], b1 = b[ 1 ], b2 = b[ 2 ], b3 = b[ 3 ];

	dst[ 0 ] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	dst[ 1 ] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	dst[ 2 ] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	dst[ 3 ] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[ 4 ]; b1 = b[ 5 ]; b2 = b[ 6 ]; b3 = b[ 7 ];

	dst[ 4 ] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	dst[ 5 ] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	dst[ 6 ] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	dst[ 7 ] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[ 8 ]; b1 = b[ 9 ]; b2 = b[ 10 ]; b3 = b[ 11 ];

	dst[ 8 ] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	dst[ 9 ] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	dst[ 10 ] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	dst[ 11 ] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[ 12 ]; b1 = b[ 13 ]; b2 = b[ 14 ]; b3 = b[ 15 ];

	dst[ 12 ] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	dst[ 13 ] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	dst[ 14 ] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	dst[ 15 ] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	return dst;

}


export function rotateX( m, rad, dst ) {

	dst = dst || new Array( 16 );

	let s = Math.sin( rad );
	let c = Math.cos( rad );
	let m10 = m[ 4 ];
	let m11 = m[ 5 ];
	let m12 = m[ 6 ];
	let m13 = m[ 7 ];
	let m20 = m[ 8 ];
	let m21 = m[ 9 ];
	let m22 = m[ 10 ];
	let m23 = m[ 11 ];

	if ( m !== dst ) {

		dst[ 0 ] = m[ 0 ];
		dst[ 1 ] = m[ 1 ];
		dst[ 2 ] = m[ 2 ];
		dst[ 3 ] = m[ 3 ];
		dst[ 12 ] = m[ 12 ];
		dst[ 13 ] = m[ 13 ];
		dst[ 14 ] = m[ 14 ];
		dst[ 15 ] = m[ 15 ];

	}

	dst[ 4 ] = m10 * c + m20 * s;
	dst[ 5 ] = m11 * c + m21 * s;
	dst[ 6 ] = m12 * c + m22 * s;
	dst[ 7 ] = m13 * c + m23 * s;
	dst[ 8 ] = m20 * c - m10 * s;
	dst[ 9 ] = m21 * c - m11 * s;
	dst[ 10 ] = m22 * c - m12 * s;
	dst[ 11 ] = m23 * c - m13 * s;

	return dst;

}


export function rotateY( m, rad, dst ) {

	dst = dst || new Array( 16 );

	let s = Math.sin( rad );
	let c = Math.cos( rad );
	let m00 = m[ 0 ];
	let m01 = m[ 1 ];
	let m02 = m[ 2 ];
	let m03 = m[ 3 ];
	let m20 = m[ 8 ];
	let m21 = m[ 9 ];
	let m22 = m[ 10 ];
	let m23 = m[ 11 ];

	if ( m !== dst ) {

	  dst[ 4 ] = m[ 4 ];
	  dst[ 5 ] = m[ 5 ];
	  dst[ 6 ] = m[ 6 ];
	  dst[ 7 ] = m[ 7 ];
	  dst[ 12 ] = m[ 12 ];
	  dst[ 13 ] = m[ 13 ];
	  dst[ 14 ] = m[ 14 ];
	  dst[ 15 ] = m[ 15 ];

	}

	dst[ 0 ] = m00 * c - m20 * s;
	dst[ 1 ] = m01 * c - m21 * s;
	dst[ 2 ] = m02 * c - m22 * s;
	dst[ 3 ] = m03 * c - m23 * s;
	dst[ 8 ] = m00 * s + m20 * c;
	dst[ 9 ] = m01 * s + m21 * c;
	dst[ 10 ] = m02 * s + m22 * c;
	dst[ 11 ] = m03 * s + m23 * c;

	return dst;

}


export function rotateZ( m, rad, dst ) {

	dst = dst || new Array( 16 );

	let s = Math.sin( rad );
	let c = Math.cos( rad );
	let m00 = m[ 0 ];
	let m01 = m[ 1 ];
	let m02 = m[ 2 ];
	let m03 = m[ 3 ];
	let m10 = m[ 4 ];
	let m11 = m[ 5 ];
	let m12 = m[ 6 ];
	let m13 = m[ 7 ];

	if ( m !== dst ) {

		dst[ 8 ] = m[ 8 ];
		dst[ 9 ] = m[ 9 ];
		dst[ 10 ] = m[ 10 ];
		dst[ 11 ] = m[ 11 ];
		dst[ 12 ] = m[ 12 ];
		dst[ 13 ] = m[ 13 ];
		dst[ 14 ] = m[ 14 ];
		dst[ 15 ] = m[ 15 ];

	}

	dst[ 0 ] = m00 * c + m10 * s;
	dst[ 1 ] = m01 * c + m11 * s;
	dst[ 2 ] = m02 * c + m12 * s;
	dst[ 3 ] = m03 * c + m13 * s;
	dst[ 4 ] = m10 * c - m00 * s;
	dst[ 5 ] = m11 * c - m01 * s;
	dst[ 6 ] = m12 * c - m02 * s;
	dst[ 7 ] = m13 * c - m03 * s;

	return dst;

}


export function rotateOnAxis( m, axis, angle, dst ) {

	dst = dst || new Array( 16 );

	const c = Math.cos( angle );
	const s = Math.sin( angle );
	const t = 1 - c;
	const x = axis[ 0 ], y = axis[ 1 ], z = axis[ 2 ];
	const tx = t * x, ty = t * y;

	const _r = set(
		tx * x + c, tx * y - s * z, tx * z + s * y, 0,
		tx * y + s * z, ty * y + c, ty * z - s * x, 0,
		tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
		0, 0, 0, 1
	);

	return multiply( m, _r, dst );

}


export function translate( m, v, dst ) {

	dst = dst || new Array( 16 );

	let x = v[ 0 ], y = v[ 1 ], z = v[ 2 ];
	let a00, a01, a02, a03;
	let a10, a11, a12, a13;
	let a20, a21, a22, a23;

	if ( m === dst ) {

		dst[ 12 ] = m[ 0 ] * x + m[ 4 ] * y + m[ 8 ] * z + m[ 12 ];
		dst[ 13 ] = m[ 1 ] * x + m[ 5 ] * y + m[ 9 ] * z + m[ 13 ];
		dst[ 14 ] = m[ 2 ] * x + m[ 6 ] * y + m[ 10 ] * z + m[ 14 ];
		dst[ 15 ] = m[ 3 ] * x + m[ 7 ] * y + m[ 11 ] * z + m[ 15 ];

	} else {

		a00 = m[ 0 ];
		a01 = m[ 1 ];
		a02 = m[ 2 ];
		a03 = m[ 3 ];
		a10 = m[ 4 ];
		a11 = m[ 5 ];
		a12 = m[ 6 ];
		a13 = m[ 7 ];
		a20 = m[ 8 ];
		a21 = m[ 9 ];
		a22 = m[ 10 ];
		a23 = m[ 11 ];
		dst[ 0 ] = a00;
		dst[ 1 ] = a01;
		dst[ 2 ] = a02;
		dst[ 3 ] = a03;
		dst[ 4 ] = a10;
		dst[ 5 ] = a11;
		dst[ 6 ] = a12;
		dst[ 7 ] = a13;
		dst[ 8 ] = a20;
		dst[ 9 ] = a21;
		dst[ 10 ] = a22;
		dst[ 11 ] = a23;
		dst[ 12 ] = a00 * x + a10 * y + a20 * z + m[ 12 ];
		dst[ 13 ] = a01 * x + a11 * y + a21 * z + m[ 13 ];
		dst[ 14 ] = a02 * x + a12 * y + a22 * z + m[ 14 ];
		dst[ 15 ] = a03 * x + a13 * y + a23 * z + m[ 15 ];

	}

	return dst;

}


export function makeLookAt( eye, target, up, dst ) {

	dst = dst || new Array( 16 );

	let z0 = eye[ 0 ] - target[ 0 ];
	let z1 = eye[ 1 ] - target[ 1 ];
	let z2 = eye[ 2 ] - target[ 2 ];

	let len = z0 * z0 + z1 * z1 + z2 * z2;

	if ( len > 0 ) {

		len = 1 / Math.sqrt( len );
		z0 *= len;
		z1 *= len;
		z2 *= len;

	}

	let x0 = up[ 1 ] * z2 - up[ 2 ] * z1;
	let x1 = up[ 2 ] * z0 - up[ 0 ] * z2;
	let x2 = up[ 0 ] * z1 - up[ 1 ] * z0;

	len = x0 * x0 + x1 * x1 + x2 * x2;

	if ( len > 0 ) {

		len = 1 / Math.sqrt( len );
		x0 *= len;
		x1 *= len;
		x2 *= len;

	}

	dst[ 0 ] = x0;
	dst[ 1 ] = x1;
	dst[ 2 ] = x2;
	dst[ 3 ] = 0;
	dst[ 4 ] = z1 * x2 - z2 * x1;
	dst[ 5 ] = z2 * x0 - z0 * x2;
	dst[ 6 ] = z0 * x1 - z1 * x0;
	dst[ 7 ] = 0;
	dst[ 8 ] = z0;
	dst[ 9 ] = z1;
	dst[ 10 ] = z2;
	dst[ 11 ] = 0;
	dst[ 12 ] = eye[ 0 ];
	dst[ 13 ] = eye[ 1 ];
	dst[ 14 ] = eye[ 2 ];
	dst[ 15 ] = 1;

	return dst;

}
