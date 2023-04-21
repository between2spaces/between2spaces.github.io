import * as vec3 from "./vec3.js";

export function identity() {

	return set();

}


export function set( x = 0, y = 0, z = 0, w = 1, dst ) {

	dst = dst || new Array( 4 );

	dst[ 0 ] = x;
	dst[ 1 ] = y;
	dst[ 2 ] = z;
	dst[ 3 ] = w;

	return dst;

}


export function setFromAxisAngle( axis, angle, dst ) {

	dst = dst || new Array( 4 );

	const halfAngle = angle / 2, s = Math.sin( halfAngle );

	dst[ 0 ] = axis[ 0 ] * s;
	dst[ 1 ] = axis[ 1 ] * s;
	dst[ 2 ] = axis[ 2 ] * s;
	dst[ 3 ] = Math.cos( halfAngle );

	return dst;

}


export function setFromRotationMatrix( m, dst ) {

	dst = dst || new Array( 4 );

	const m11 = m[ 0 ], m12 = m[ 4 ], m13 = m[ 8 ],
	      m21 = m[ 1 ], m22 = m[ 5 ], m23 = m[ 9 ],
	      m31 = m[ 2 ], m32 = m[ 6 ], m33 = m[ 10 ],
		  trace = m11 + m22 + m33;

	if ( trace > 0 ) {

		const s = 0.5 / Math.sqrt( trace + 1.0 );

		dst[ 3 ] = 0.25 * s;
		dst[ 0 ] = ( m32 - m23 ) * s;
		dst[ 1 ] = ( m13 - m31 ) * s;
		dst[ 2 ] = ( m21 - m12 ) * s;

	} else if ( m11 > m22 && m11 > m33 ) {

		const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

		dst[ 3 ] = ( m32 - m23 ) / s;
		dst[ 0 ] = 0.25 * s;
		dst[ 1 ] = ( m12 + m21 ) / s;
		dst[ 2 ] = ( m13 + m31 ) / s;

	} else if ( m22 > m33 ) {

		const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

		dst[ 3 ] = ( m13 - m31 ) / s;
		dst[ 0 ] = ( m12 + m21 ) / s;
		dst[ 1 ] = 0.25 * s;
		dst[ 2 ] = ( m23 + m32 ) / s;

	} else {

		const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

		dst[ 3 ] = ( m21 - m12 ) / s;
		dst[ 0 ] = ( m13 + m31 ) / s;
		dst[ 1 ] = ( m23 + m32 ) / s;
		dst[ 2 ] = 0.25 * s;

	}

	return dst;

}


export function multiply( a, b, dst ) {

	dst = dst || new Array( 4 );

	const qax = a[ 0 ], qay = a[ 1 ], qaz = a[ 2 ], qaw = a[ 3 ];
	const qbx = b[ 0 ], qby = b[ 1 ], qbz = b[ 2 ], qbw = b[ 3 ];

	dst[ 0 ] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
	dst[ 1 ] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
	dst[ 2 ] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
	dst[ 3 ] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

	return dst;

}
