// Object.assign polyfill
// Chrome   Edge   Firefox  Internet Explorer  Opera  Safari
//   45     (Yes)    34        No support       32      9
if ( typeof Object.assign != 'function' ) {
	Object.assign = function( target, varArgs ) {
	if ( target === null ) throw new TypeError( 'Cannot convert undefined or null to object' )
	var to = Object( target )
	for ( var index = arguments.length; index > 1; index-- ) {
		var nextSource = arguments[ index ]
		if ( nextSource !== null ) {
			for ( var nextKey in nextSource ) {
				if ( Object.prototype.hasOwnProperty.call( nextSource, nextKey ) ) {
					to[ nextKey ] = nextSource[ nextKey ]
				}
			}
		}
	}
	return to
  }
}
