(function () {
	'use strict';

	const mem = {};

	/**
	 * @param {string=} id The id of the element. Use (null|undefined) for no id.
	 * @param {string=} tag The element tag
	 * @returns {HTMLElement} The element
	 */
	const element = ( id, tag ) => {
	    if ( ! tag ) return element.byId[ id ]
	    let e = document.createElement( tag );
	    if ( id ) {
	        e.setAttribute( "id", id );
	        element.byId[ id ] = e;
	    }
	    return e
	};

	element.byId = {};

	/**
	 * @param {HTMLElement} e The element
	 * @param {string} id The id to set for the element
	 * @returns {HTMLElement} The element
	 */
	const setid = ( e, id ) => {
	    attrib( e, { 'id': id } );
	    element.byId[ id ] = e;
	    return e
	};


	/**
	 * @param {HTMLElement} e The element
	 * @param {(string | {})} attribs if string returns attributes value; otherwise sets attributes
	 * @returns {HTMLElement} The element
	 */
	const attrib = ( e, attribs ) => {
	    if ( typeof attribs === 'string' ) return e.getAttribute( attribs )
	    for ( let props = Object.getOwnPropertyNames( attribs ), i = props.length; i --; ) {
	        e.setAttribute( props[ i ], attribs[ props[ i ] ] );
	    }
	    return e
	};

	/**
	 * @param {HTMLElement} e The element
	 * @param {(string | {})} css if string returns css value; otherwise sets css properties
	 * @returns {HTMLElement} The element
	 */
	const style = ( e, css ) => {
	    if ( typeof css === "string" ) return e.style[ css ]
	    for ( let props = Object.getOwnPropertyNames( css ), i = props.length; i --; ) {
	        e.style[ props[ i ] ] = css[ props[ i ] ];
	    }
	    return e
	};

	/**
	 * @param {HTMLElement} e The element
	 * @param {(any | [])} contents Content to add to element
	 * @returns {HTMLElement} The element
	 */
	const content = ( e, contents ) => {
	    contents = contents instanceof Array ? contents : [ contents ];
	    for ( let i = 0; i < contents.length; ++ i ) {
	        let child = contents[ i ];
	        if ( typeof child === "string" || typeof child === "number" ) {
	            child = document.createTextNode( child );
	        }
	        e.appendChild( child );
	    }
	    return e
	};

	/**
	 * @param {string=} id The id of the element. Use (null|undefined) for no id.
	 * @param {number[]} columns Columns percentages
	 * @param {number=} rows Number of rows (default=1)
	 * @returns {HTMLElement} The element
	 */
	const layout$1 = ( id, columns, rows ) => {
	    let e = element( id, 'table' );
	    let tbody = element( null, 'tbody' );
	    let trs = [];
	    let firstrow = true;
	    for ( let i = 0; i < rows; i++ ) {
	        let tr = element( null, 'tr' );
	        for ( let t = 0; t < columns.length; t++ ) {
	            let td = element( null, 'td' );
	            if ( firstrow ) style( td, { width: columns[ t ] + '%' } );
	            content( tr, td );
	        }
	        firstrow = false;
	        trs.push( tr );
	    }
	    content( e, tbody );
	    content( tbody, trs );
	    return e
	};

	/**
	 * @param {string} xpathExpression An XPath expression
	 * @param {number=} resultType A constant that specifies the desired result type to be returned (default=XPathResult.ANY_TYPE)
	 * @returns The xpath result
	 */
	const xpath = ( xpathExpression, resultType ) => {
	    resultType = ( typeof resultType === 'undefined' ) ? XPathResult.ANY_TYPE : resultType;
	    return document.evaluate( xpathExpression, document, null, resultType, null )
	};


	const update = () => {
	    for ( let key in mem ) {
	        let el = element( key );
	        if ( el ) {
	            let value = mem[ key ];
	            el.innerHTML = typeof value === "number" ? Math.round( value * 100 ) / 100.0 : value;
	        }
	    }
	};

	setid( document.getElementsByTagName( 'head' )[ 0 ], 'head' );
	setid( document.getElementsByTagName( 'body' )[ 0 ], 'body' );

	content( element( 'head' ), attrib( element( 'icon', 'link' ), {
	    rel: 'icon', href: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAAQABADAREAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQYI/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAB0aGihOH/xAAaEAACAgMAAAAAAAAAAAAAAAAEBQEDAhIT/9oACAEBAAEFApNvhsa9p1JGztY8DZX/AP/EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQMBAT8BH//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQIBAT8BH//EACIQAAIBBAEEAwAAAAAAAAAAAAECAwQREiEAEyIxQRShsf/aAAgBAQAGPwKOm6IWBo3bMnuJGP1vkQp5GyeeOMP0zg3eAQGIsdX8cp3GoxFKhYHwTjb8PKGi+EV6EkOcma4WRl2u7+vduf/EAB0QAQEAAQQDAAAAAAAAAAAAAAERQQAhMWFRcfD/2gAIAQEAAT8hYw0Vq8A47d+jO4qtTX3qJYU40eaGZW/R40UiFWppjgqDZcwf/9oADAMBAAIAAwAAABAAT//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQIBAT8QH//EABgQAQEBAQEAAAAAAAAAAAAAAAERITEA/9oACAEBAAE/EBNMkDYuST1UnAH1R+WHXsqvpZ0CH1mQwEWqjUIdSlBBdIGGV2JLLfB//9k='
	} ) );

	content( element( 'head' ), content( element( 'style', 'style', element( 'head' ) ), '\n' + [
	    'body { margin: 0; font-family: monospace; font-size: 2vw; }',
	    '* { box-sizing: border-box; overflow: hidden; }',
	    'table { width: 100%; border-collapse: collapse; }',
	    '.cell { position: absolute; }'
	].join( '\n' ) + '\n' ) );

	const cells = [];
	const B = [];
	const b = [];
	const H = [];
	const h = [];
	const objects = [];
	const towers = [];
	const creeps = [];

	const CHAR = {
	    '.': {
	        name: 'ground',
	        zIndex: 0,
	        damage: 0,
	        damageReduction: 1,
	        memberOf: [ objects ]
	    },
	    'B': {
	        name: 'UPPER base',
	        zIndex: 1,
	        damage: 0,
	        damageReduction: 1,
	        memberOf: [ objects, B ]
	    },
	    'b': {
	        name: 'lower base',
	        zIndex: 1,
	        damage: 0,
	        damageReduction: 1,
	        memberOf: [ objects, b ]
	    },
	    'T': {
	        name: 'UPPER tower',
	        zIndex: 1,
	        damage: 0.3,
	        damageReduction: 1,
	        memberOf: [ objects, towers ]
	    },
	    't': {
	        name: 'lower tower',
	        zIndex: 1,
	        damage: 0.3,
	        damageReduction: 1,
	        memberOf: [ objects, towers ]
	    },
	    'C': {
	        name: 'UPPER creep',
	        zIndex: 2,
	        damage: 0.1,
	        damageReduction: 0,
	        memberOf: [ objects, creeps ]
	    },
	    'c': {
	        name: 'lower creep',
	        zIndex: 2,
	        damage: 0.1,
	        damageReduction: 0,
	        memberOf: [ objects, creeps ]
	    },
	    'H': {
	        name: 'UPPER hero',
	        zIndex: 9,
	        damage: 0.2,
	        damageReduction: 0,
	        memberOf: [ objects, H ]
	    },
	    'h': {
	        name: 'lower hero',
	        zIndex: 9,
	        damage: 0.2,
	        damageReduction: 0,
	        memberOf: [ objects, h ]
	    }
	};

	function Object$1( char ) {
	    let config = CHAR[ char ];
	    let object = {
	        char: char,
	        cell: null,
	        e: element( null, 'span' ),
	        health: 1,
	        damage: config.damage,
	        damageReduction: config.damageReduction
	    };
	    object.e.className = 'cell';
	    style( object.e, { zIndex: config.zIndex } );
	    object.e.textContent = char;
	    for ( let i = 0; i < config.memberOf.length; i++ ) {
	        config.memberOf[ i ].push( object );
	    }
	    return object
	}


	content( element( 'body' ), layout$1( 'cells', Array( 79 ), 1 ) );
	let results = xpath( '//*[@id="cells"]//td', XPathResult.ORDERED_NODE_SNAPSHOT_TYPE );
	for ( let i = 0; i < results.snapshotLength; i++ ) {
	    cells[ i ] = {
	        index: i,
	        e: element( null, 'div' ),
	        objects: []
	    };
	    content( results.snapshotItem( i ), cells[ i ].e );
	    style( cells[ i ].e, { position: 'relative', height: '1em' } )
	    ; ( ( cell ) => {
	        cell.e.addEventListener( 'mouseover', () => { mouseover( cell ); } );
	    } )( cells[ i ] );
	    add( Object$1( '.' ), i );
	}

	const layout = 'b  t              t              t           T              T              T  B';

	for ( let i = 0; i < layout.length; i++ ) {
	    let char = layout[ i ];
	    if ( char === ' ' ) continue
	    add( Object$1( char ), i );
	}

	add( Object$1( 'h' ), 0 );
	add( Object$1( 'H' ), layout.length - 1 );

	mem[ 'lowerpts' ] = 0;
	mem[ 'UPPERpts' ] = 0;
	mem[ 'elapsed' ] = 0;

	content( element( 'body' ), layout$1( 'status', [ 33, 33, 33], 1 ) );
	results = xpath( '//*[@id="status"]//td', XPathResult.ORDERED_NODE_SNAPSHOT_TYPE );
	style( setid( results.snapshotItem( 0 ), 'lowerpts' ), { textAlign: 'left' } );
	style( setid( results.snapshotItem( 1 ), 'elapsed' ), { textAlign: 'center' } );
	style( setid( results.snapshotItem( 2 ), 'UPPERpts' ), { textAlign: 'right' } );

	update();

	function add( object, index ) {
	    let cell = cells[ clamp( index ) ];
	    cell.e.appendChild( object.e );
	    object.cell = cell;
	    let objs = cell.objects;
	    let i = objs.indexOf( object );
	    if ( i === -1 ) objs.push( object );
	    objs.sort( compare_objects_by_health );
	}


	function clamp( index ) {
	    if ( index < 0 ) {
	        return index = 0
	    }
	    if ( index >= cells.length ) {
	        return cells.length - 1
	    }
	    return index
	}


	function compare_objects_by_health( obj1, obj2 ) {
	    if ( obj1.health === obj2.health ) return 0
	    return ( obj1.health < obj2.health ) ? -1 : 1
	}


	function remove( object ) {
	    if ( !object.cell ) return
	    object.cell.e.removeChild( object.e );
	    let i = object.cell.objects.indexOf( object );
	    if ( i > -1 ) {
	        object.cell.objects.splice( i, 1 );
	    }
	    object.cell = null;
	}

	function move( object, index ) {
	    index = clamp( index );
	    if ( index === object.cell.index ) return false
	    remove( object );
	    add( object, index );
	    return true
	}

	function forward( object, distance ) {
	    if ( enemyAt( object, object.cell.index ) ) return true
	    let index = clamp( object.cell.index + ( /[A-Z]/.test( object.char ) ? -distance : distance ) );
	    return move( object, index )
	}

	function back( object ) {
	    let base = /[A-Z]/.test( object.char ) ? B[ 0 ] : b[ 0 ];
	    return move( object, base.cell.index )
	}

	function attack( object, index ) {
	    if ( object.damage === 0 ) return
	    let target = enemyAt( object, index );
	    if ( !target ) return
	    if ( target.health === 0 ) return
	    let damage = object.damage - ( object.damage * target.damageReduction );
	    target.health -= damage;
	    if ( target.health <= 0 ) {
	        target.health = 0;
	        target.lasthit = object;
	    }
	}

	function killed( object ) {
	    if ( object.lasthit === h[ 0 ] ) mem[ 'lowerpts' ] += 2;
	    else if ( object.lasthit === H[ 0 ] ) mem[ 'UPPERpts' ] += 2;
	    else if ( /[a-z]/.test( object.lasthit.char ) ) mem[ 'lowerpts' ]++;
	    else if ( /[A-Z]/.test( object.lasthit.char ) ) mem[ 'UPPERpts' ]++;
	    remove( object );
	    let config = CHAR[ object.char ];
	    for ( let i = 0; i < config.memberOf.length; i++ ) {
	        let t = config.memberOf[ i ].indexOf( object );
	        if ( t > -1 ) config.memberOf[ i ].splice( t, 1 );
	    }
	}

	function friendlyAt( object, index ) {
	    let cell = cells[ clamp( index ) ];
	    let upper = /[A-Z]/.test( object.char );
	    let objs = cell.objects;
	    let i = objs.length;
	    while ( i-- ) {
	        let o = objs[ i ];
	        if ( upper && /[A-Z]/.test( o.char ) ) {
	            return o
	        } else if ( !upper && /[a-z]/.test( o.char ) ) {
	            return o
	        }
	    }
	    return false
	}

	function enemyAt( object, index ) {
	    let cell = cells[ clamp( index ) ];
	    let upper = /[A-Z]/.test( object.char );
	    let objs = cell.objects;
	    let i = objs.length;
	    while ( i-- ) {
	        let o = objs[ i ];
	        if ( upper && /[a-z]/.test( o.char ) ) {
	            return o
	        } else if ( !upper && /[A-Z]/.test( o.char ) ) {
	            return o
	        }
	    }
	    return false
	}

	function teleport( object, index ) {
	    if ( friendlyAt( object, index ) ) {
	        return move( object, index )
	    }
	    return false
	}

	const tasks = [];

	function start( task, interval ) {
	    if ( interval ) {
	        task.interval = interval;
	    }
	    task.last = -1;
	    tasks.push( task );
	}

	function creepSpawn() {
	    if ( mem[ 'elapsed' ] % 15 <= 5 ) {
	        let object = Object$1( 'C' );
	        if ( object ) add( object, B[ 0 ].cell.index );
	        object = Object$1( 'c' );
	        if ( object ) add( object, b[ 0 ].cell.index );
	    }
	}

	start( creepSpawn, 2 );

	function creepUpdate() {
	    let i = creeps.length;
	    while ( i-- ) {
	        let object = creeps[ i ];
	        forward( object, 1 );
	    }
	}

	start( creepUpdate, 1 );

	let mouseindex = 0;

	function mouseover( cell ) {
	    mouseindex = cell.index;
	    console.log( cell.index );
	}

	function keydown( event ) {
	    if ( h[ 0 ].health === 0 ) return
	    let turn = true;
	    switch ( event.key ) {
	        case 'a':
	            break
	        case 'f':
	            turn = forward( h[ 0 ], 1 );
	            break
	        case 'd':
	            turn = forward( h[ 0 ], -1 );
	            break
	        case 'b':
	            turn = back( h[ 0 ] );
	            break
	        case 't':
	            turn = teleport( h[ 0 ], mouseindex );
	            break
	        default:
	            turn = false;
	    }
	    if ( turn ) {
	        let i = tasks.length;
	        while ( i-- ) {
	            let task = tasks[ i ];
	            if ( mem[ 'elapsed' ] >= task.last + task.interval ) {
	                task();
	                task.last = mem[ 'elapsed' ];
	            }
	        }
	        // resolve attacks after movement
	        i = objects.length;
	        while ( i-- ) {
	            let object = objects[ i ];
	            attack( object, object.cell.index );
	        }
	        // resolve kills after attacks
	        i = objects.length;
	        while ( i-- ) {
	            let object = objects[ i ];
	            if ( object.health === 0 ) killed( object );
	        }
	        mem[ 'elapsed' ]++;
	        update();
	    }
	}

	document.addEventListener( 'keydown', keydown );

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyJzcmMvbWVtLmpzIiwic3JjL3VpLmpzIiwic3JjL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgbWVtID0ge31cblxuZXhwb3J0IGRlZmF1bHQgbWVtXG4iLCJpbXBvcnQgbWVtIGZyb20gJy4vbWVtLmpzJ1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nPX0gaWQgVGhlIGlkIG9mIHRoZSBlbGVtZW50LiBVc2UgKG51bGx8dW5kZWZpbmVkKSBmb3Igbm8gaWQuXG4gKiBAcGFyYW0ge3N0cmluZz19IHRhZyBUaGUgZWxlbWVudCB0YWdcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gVGhlIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGNvbnN0IGVsZW1lbnQgPSAoIGlkLCB0YWcgKSA9PiB7XG4gICAgaWYgKCAhIHRhZyApIHJldHVybiBlbGVtZW50LmJ5SWRbIGlkIF1cbiAgICBsZXQgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIHRhZyApXG4gICAgaWYgKCBpZCApIHtcbiAgICAgICAgZS5zZXRBdHRyaWJ1dGUoIFwiaWRcIiwgaWQgKVxuICAgICAgICBlbGVtZW50LmJ5SWRbIGlkIF0gPSBlXG4gICAgfVxuICAgIHJldHVybiBlXG59XG5cbmVsZW1lbnQuYnlJZCA9IHt9XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSBUaGUgZWxlbWVudFxuICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBpZCB0byBzZXQgZm9yIHRoZSBlbGVtZW50XG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFRoZSBlbGVtZW50XG4gKi9cbmV4cG9ydCBjb25zdCBzZXRpZCA9ICggZSwgaWQgKSA9PiB7XG4gICAgYXR0cmliKCBlLCB7ICdpZCc6IGlkIH0gKVxuICAgIGVsZW1lbnQuYnlJZFsgaWQgXSA9IGVcbiAgICByZXR1cm4gZVxufVxuXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSBUaGUgZWxlbWVudFxuICogQHBhcmFtIHsoc3RyaW5nIHwge30pfSBhdHRyaWJzIGlmIHN0cmluZyByZXR1cm5zIGF0dHJpYnV0ZXMgdmFsdWU7IG90aGVyd2lzZSBzZXRzIGF0dHJpYnV0ZXNcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gVGhlIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGNvbnN0IGF0dHJpYiA9ICggZSwgYXR0cmlicyApID0+IHtcbiAgICBpZiAoIHR5cGVvZiBhdHRyaWJzID09PSAnc3RyaW5nJyApIHJldHVybiBlLmdldEF0dHJpYnV0ZSggYXR0cmlicyApXG4gICAgZm9yICggbGV0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoIGF0dHJpYnMgKSwgaSA9IHByb3BzLmxlbmd0aDsgaSAtLTsgKSB7XG4gICAgICAgIGUuc2V0QXR0cmlidXRlKCBwcm9wc1sgaSBdLCBhdHRyaWJzWyBwcm9wc1sgaSBdIF0gKVxuICAgIH1cbiAgICByZXR1cm4gZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGUgVGhlIGVsZW1lbnRcbiAqIEBwYXJhbSB7KHN0cmluZyB8IHt9KX0gY3NzIGlmIHN0cmluZyByZXR1cm5zIGNzcyB2YWx1ZTsgb3RoZXJ3aXNlIHNldHMgY3NzIHByb3BlcnRpZXNcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gVGhlIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGNvbnN0IHN0eWxlID0gKCBlLCBjc3MgKSA9PiB7XG4gICAgaWYgKCB0eXBlb2YgY3NzID09PSBcInN0cmluZ1wiICkgcmV0dXJuIGUuc3R5bGVbIGNzcyBdXG4gICAgZm9yICggbGV0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoIGNzcyApLCBpID0gcHJvcHMubGVuZ3RoOyBpIC0tOyApIHtcbiAgICAgICAgZS5zdHlsZVsgcHJvcHNbIGkgXSBdID0gY3NzWyBwcm9wc1sgaSBdIF1cbiAgICB9XG4gICAgcmV0dXJuIGVcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIFRoZSBlbGVtZW50XG4gKiBAcGFyYW0geyhhbnkgfCBbXSl9IGNvbnRlbnRzIENvbnRlbnQgdG8gYWRkIHRvIGVsZW1lbnRcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gVGhlIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbnRlbnQgPSAoIGUsIGNvbnRlbnRzICkgPT4ge1xuICAgIGNvbnRlbnRzID0gY29udGVudHMgaW5zdGFuY2VvZiBBcnJheSA/IGNvbnRlbnRzIDogWyBjb250ZW50cyBdXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgY29udGVudHMubGVuZ3RoOyArKyBpICkge1xuICAgICAgICBsZXQgY2hpbGQgPSBjb250ZW50c1sgaSBdXG4gICAgICAgIGlmICggdHlwZW9mIGNoaWxkID09PSBcInN0cmluZ1wiIHx8IHR5cGVvZiBjaGlsZCA9PT0gXCJudW1iZXJcIiApIHtcbiAgICAgICAgICAgIGNoaWxkID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGNoaWxkIClcbiAgICAgICAgfVxuICAgICAgICBlLmFwcGVuZENoaWxkKCBjaGlsZCApXG4gICAgfVxuICAgIHJldHVybiBlXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmc9fSBpZCBUaGUgaWQgb2YgdGhlIGVsZW1lbnQuIFVzZSAobnVsbHx1bmRlZmluZWQpIGZvciBubyBpZC5cbiAqIEBwYXJhbSB7bnVtYmVyW119IGNvbHVtbnMgQ29sdW1ucyBwZXJjZW50YWdlc1xuICogQHBhcmFtIHtudW1iZXI9fSByb3dzIE51bWJlciBvZiByb3dzIChkZWZhdWx0PTEpXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFRoZSBlbGVtZW50XG4gKi9cbmV4cG9ydCBjb25zdCBsYXlvdXQgPSAoIGlkLCBjb2x1bW5zLCByb3dzICkgPT4ge1xuICAgIGxldCBlID0gZWxlbWVudCggaWQsICd0YWJsZScgKVxuICAgIGxldCB0Ym9keSA9IGVsZW1lbnQoIG51bGwsICd0Ym9keScgKVxuICAgIGxldCB0cnMgPSBbXVxuICAgIGxldCBmaXJzdHJvdyA9IHRydWVcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCByb3dzOyBpKysgKSB7XG4gICAgICAgIGxldCB0ciA9IGVsZW1lbnQoIG51bGwsICd0cicgKVxuICAgICAgICBmb3IgKCBsZXQgdCA9IDA7IHQgPCBjb2x1bW5zLmxlbmd0aDsgdCsrICkge1xuICAgICAgICAgICAgbGV0IHRkID0gZWxlbWVudCggbnVsbCwgJ3RkJyApXG4gICAgICAgICAgICBpZiAoIGZpcnN0cm93ICkgc3R5bGUoIHRkLCB7IHdpZHRoOiBjb2x1bW5zWyB0IF0gKyAnJScgfSApXG4gICAgICAgICAgICBjb250ZW50KCB0ciwgdGQgKVxuICAgICAgICB9XG4gICAgICAgIGZpcnN0cm93ID0gZmFsc2VcbiAgICAgICAgdHJzLnB1c2goIHRyIClcbiAgICB9XG4gICAgY29udGVudCggZSwgdGJvZHkgKVxuICAgIGNvbnRlbnQoIHRib2R5LCB0cnMgKVxuICAgIHJldHVybiBlXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHhwYXRoRXhwcmVzc2lvbiBBbiBYUGF0aCBleHByZXNzaW9uXG4gKiBAcGFyYW0ge251bWJlcj19IHJlc3VsdFR5cGUgQSBjb25zdGFudCB0aGF0IHNwZWNpZmllcyB0aGUgZGVzaXJlZCByZXN1bHQgdHlwZSB0byBiZSByZXR1cm5lZCAoZGVmYXVsdD1YUGF0aFJlc3VsdC5BTllfVFlQRSlcbiAqIEByZXR1cm5zIFRoZSB4cGF0aCByZXN1bHRcbiAqL1xuZXhwb3J0IGNvbnN0IHhwYXRoID0gKCB4cGF0aEV4cHJlc3Npb24sIHJlc3VsdFR5cGUgKSA9PiB7XG4gICAgcmVzdWx0VHlwZSA9ICggdHlwZW9mIHJlc3VsdFR5cGUgPT09ICd1bmRlZmluZWQnICkgPyBYUGF0aFJlc3VsdC5BTllfVFlQRSA6IHJlc3VsdFR5cGVcbiAgICByZXR1cm4gZG9jdW1lbnQuZXZhbHVhdGUoIHhwYXRoRXhwcmVzc2lvbiwgZG9jdW1lbnQsIG51bGwsIHJlc3VsdFR5cGUsIG51bGwgKVxufVxuXG5cbmV4cG9ydCBjb25zdCB1cGRhdGUgPSAoKSA9PiB7XG4gICAgZm9yICggbGV0IGtleSBpbiBtZW0gKSB7XG4gICAgICAgIGxldCBlbCA9IGVsZW1lbnQoIGtleSApXG4gICAgICAgIGlmICggZWwgKSB7XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBtZW1bIGtleSBdXG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyBNYXRoLnJvdW5kKCB2YWx1ZSAqIDEwMCApIC8gMTAwLjAgOiB2YWx1ZVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IG1lbSBmcm9tICcuL21lbS5qcydcbmltcG9ydCAqIGFzIHVpIGZyb20gJy4vdWkuanMnXG5cbnVpLnNldGlkKCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSggJ2hlYWQnIClbIDAgXSwgJ2hlYWQnIClcbnVpLnNldGlkKCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSggJ2JvZHknIClbIDAgXSwgJ2JvZHknIClcblxudWkuY29udGVudCggdWkuZWxlbWVudCggJ2hlYWQnICksIHVpLmF0dHJpYiggdWkuZWxlbWVudCggJ2ljb24nLCAnbGluaycgKSwge1xuICAgIHJlbDogJ2ljb24nLCBocmVmOiAnZGF0YTppbWFnZS9qcGVnO2Jhc2U2NCwvOWovNEFBUVNrWkpSZ0FCQVFFQVNBQklBQUQvL2dBVFEzSmxZWFJsWkNCM2FYUm9JRWRKVFZELzJ3QkRBQU1DQWdNQ0FnTURBd01FQXdNRUJRZ0ZCUVFFQlFvSEJ3WUlEQW9NREFzS0N3c05EaElRRFE0UkRnc0xFQllRRVJNVUZSVVZEQThYR0JZVUdCSVVGUlQvMndCREFRTUVCQVVFQlFrRkJRa1VEUXNORkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCVC93Z0FSQ0FBUUFCQURBUkVBQWhFQkF4RUIvOFFBRmdBQkFRRUFBQUFBQUFBQUFBQUFBQUFBQlFZSS84UUFGQUVCQUFBQUFBQUFBQUFBQUFBQUFBQUFBUC9hQUF3REFRQUNFQU1RQUFBQjBhR2loT0gveEFBYUVBQUNBZ01BQUFBQUFBQUFBQUFBQUFBRUJRRURBaElULzlvQUNBRUJBQUVGQXBOdmhzYTlwMUpHenRZOERaWC9BUC9FQUJRUkFRQUFBQUFBQUFBQUFBQUFBQUFBQUNELzJnQUlBUU1CQVQ4QkgvL0VBQlFSQVFBQUFBQUFBQUFBQUFBQUFBQUFBQ0QvMmdBSUFRSUJBVDhCSC8vRUFDSVFBQUlCQkFFRUF3QUFBQUFBQUFBQUFBRUNBd1FSRWlFQUV5SXhRUlNoc2YvYUFBZ0JBUUFHUHdLT202SVdCbzNiTW51SkdQMXZrUXA1R3llZU9NUDB6ZzNlQVFHSXNkWDhjcDNHb3hGS2hZSHdUamI4UEtHaStFVjZFa09jbWE0V1JsMnU3K3ZkdWYvRUFCMFFBUUVBQVFRREFBQUFBQUFBQUFBQUFBRVJRUUFoTVdGUmNmRC8yZ0FJQVFFQUFUOGhZdzBWcThBNDdkK2pPNHF0VFgzcUpZVTQwZWFHWlcvUjQwVWlGV3BwamdxRFpjd2YvOW9BREFNQkFBSUFBd0FBQUJBQVQvL0VBQlFSQVFBQUFBQUFBQUFBQUFBQUFBQUFBQ0QvMmdBSUFRTUJBVDhRSC8vRUFCUVJBUUFBQUFBQUFBQUFBQUFBQUFBQUFDRC8yZ0FJQVFJQkFUOFFILy9FQUJnUUFRRUJBUUVBQUFBQUFBQUFBQUFBQUFFUklURUEvOW9BQ0FFQkFBRS9FQk5Na0RZdVNUMVVuQUgxUitXSFhzcXZwWjBDSDFtUXdFV3FqVUlkU2xCQmRJR0dWMkpMTGZCLy85az0nXG59ICkgKVxuXG51aS5jb250ZW50KCB1aS5lbGVtZW50KCAnaGVhZCcgKSwgdWkuY29udGVudCggdWkuZWxlbWVudCggJ3N0eWxlJywgJ3N0eWxlJywgdWkuZWxlbWVudCggJ2hlYWQnICkgKSwgJ1xcbicgKyBbXG4gICAgJ2JvZHkgeyBtYXJnaW46IDA7IGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7IGZvbnQtc2l6ZTogMnZ3OyB9JyxcbiAgICAnKiB7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IG92ZXJmbG93OiBoaWRkZW47IH0nLFxuICAgICd0YWJsZSB7IHdpZHRoOiAxMDAlOyBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlOyB9JyxcbiAgICAnLmNlbGwgeyBwb3NpdGlvbjogYWJzb2x1dGU7IH0nXG5dLmpvaW4oICdcXG4nICkgKyAnXFxuJyApIClcblxuY29uc3QgY2VsbHMgPSBbXVxuY29uc3QgQiA9IFtdXG5jb25zdCBiID0gW11cbmNvbnN0IEggPSBbXVxuY29uc3QgaCA9IFtdXG5jb25zdCBvYmplY3RzID0gW11cbmNvbnN0IHRvd2VycyA9IFtdXG5jb25zdCBjcmVlcHMgPSBbXVxuXG5jb25zdCBDSEFSID0ge1xuICAgICcuJzoge1xuICAgICAgICBuYW1lOiAnZ3JvdW5kJyxcbiAgICAgICAgekluZGV4OiAwLFxuICAgICAgICBkYW1hZ2U6IDAsXG4gICAgICAgIGRhbWFnZVJlZHVjdGlvbjogMSxcbiAgICAgICAgbWVtYmVyT2Y6IFsgb2JqZWN0cyBdXG4gICAgfSxcbiAgICAnQic6IHtcbiAgICAgICAgbmFtZTogJ1VQUEVSIGJhc2UnLFxuICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgIGRhbWFnZTogMCxcbiAgICAgICAgZGFtYWdlUmVkdWN0aW9uOiAxLFxuICAgICAgICBtZW1iZXJPZjogWyBvYmplY3RzLCBCIF1cbiAgICB9LFxuICAgICdiJzoge1xuICAgICAgICBuYW1lOiAnbG93ZXIgYmFzZScsXG4gICAgICAgIHpJbmRleDogMSxcbiAgICAgICAgZGFtYWdlOiAwLFxuICAgICAgICBkYW1hZ2VSZWR1Y3Rpb246IDEsXG4gICAgICAgIG1lbWJlck9mOiBbIG9iamVjdHMsIGIgXVxuICAgIH0sXG4gICAgJ1QnOiB7XG4gICAgICAgIG5hbWU6ICdVUFBFUiB0b3dlcicsXG4gICAgICAgIHpJbmRleDogMSxcbiAgICAgICAgZGFtYWdlOiAwLjMsXG4gICAgICAgIGRhbWFnZVJlZHVjdGlvbjogMSxcbiAgICAgICAgbWVtYmVyT2Y6IFsgb2JqZWN0cywgdG93ZXJzIF1cbiAgICB9LFxuICAgICd0Jzoge1xuICAgICAgICBuYW1lOiAnbG93ZXIgdG93ZXInLFxuICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgIGRhbWFnZTogMC4zLFxuICAgICAgICBkYW1hZ2VSZWR1Y3Rpb246IDEsXG4gICAgICAgIG1lbWJlck9mOiBbIG9iamVjdHMsIHRvd2VycyBdXG4gICAgfSxcbiAgICAnQyc6IHtcbiAgICAgICAgbmFtZTogJ1VQUEVSIGNyZWVwJyxcbiAgICAgICAgekluZGV4OiAyLFxuICAgICAgICBkYW1hZ2U6IDAuMSxcbiAgICAgICAgZGFtYWdlUmVkdWN0aW9uOiAwLFxuICAgICAgICBtZW1iZXJPZjogWyBvYmplY3RzLCBjcmVlcHMgXVxuICAgIH0sXG4gICAgJ2MnOiB7XG4gICAgICAgIG5hbWU6ICdsb3dlciBjcmVlcCcsXG4gICAgICAgIHpJbmRleDogMixcbiAgICAgICAgZGFtYWdlOiAwLjEsXG4gICAgICAgIGRhbWFnZVJlZHVjdGlvbjogMCxcbiAgICAgICAgbWVtYmVyT2Y6IFsgb2JqZWN0cywgY3JlZXBzIF1cbiAgICB9LFxuICAgICdIJzoge1xuICAgICAgICBuYW1lOiAnVVBQRVIgaGVybycsXG4gICAgICAgIHpJbmRleDogOSxcbiAgICAgICAgZGFtYWdlOiAwLjIsXG4gICAgICAgIGRhbWFnZVJlZHVjdGlvbjogMCxcbiAgICAgICAgbWVtYmVyT2Y6IFsgb2JqZWN0cywgSCBdXG4gICAgfSxcbiAgICAnaCc6IHtcbiAgICAgICAgbmFtZTogJ2xvd2VyIGhlcm8nLFxuICAgICAgICB6SW5kZXg6IDksXG4gICAgICAgIGRhbWFnZTogMC4yLFxuICAgICAgICBkYW1hZ2VSZWR1Y3Rpb246IDAsXG4gICAgICAgIG1lbWJlck9mOiBbIG9iamVjdHMsIGggXVxuICAgIH1cbn1cblxuZnVuY3Rpb24gT2JqZWN0KCBjaGFyICkge1xuICAgIGxldCBjb25maWcgPSBDSEFSWyBjaGFyIF1cbiAgICBsZXQgb2JqZWN0ID0ge1xuICAgICAgICBjaGFyOiBjaGFyLFxuICAgICAgICBjZWxsOiBudWxsLFxuICAgICAgICBlOiB1aS5lbGVtZW50KCBudWxsLCAnc3BhbicgKSxcbiAgICAgICAgaGVhbHRoOiAxLFxuICAgICAgICBkYW1hZ2U6IGNvbmZpZy5kYW1hZ2UsXG4gICAgICAgIGRhbWFnZVJlZHVjdGlvbjogY29uZmlnLmRhbWFnZVJlZHVjdGlvblxuICAgIH1cbiAgICBvYmplY3QuZS5jbGFzc05hbWUgPSAnY2VsbCdcbiAgICB1aS5zdHlsZSggb2JqZWN0LmUsIHsgekluZGV4OiBjb25maWcuekluZGV4IH0gKVxuICAgIG9iamVjdC5lLnRleHRDb250ZW50ID0gY2hhclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNvbmZpZy5tZW1iZXJPZi5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgY29uZmlnLm1lbWJlck9mWyBpIF0ucHVzaCggb2JqZWN0IClcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdFxufVxuXG5cbnVpLmNvbnRlbnQoIHVpLmVsZW1lbnQoICdib2R5JyApLCB1aS5sYXlvdXQoICdjZWxscycsIEFycmF5KCA3OSApLCAxICkgKVxubGV0IHJlc3VsdHMgPSB1aS54cGF0aCggJy8vKltAaWQ9XCJjZWxsc1wiXS8vdGQnLCBYUGF0aFJlc3VsdC5PUkRFUkVEX05PREVfU05BUFNIT1RfVFlQRSApXG5mb3IgKCBsZXQgaSA9IDA7IGkgPCByZXN1bHRzLnNuYXBzaG90TGVuZ3RoOyBpKysgKSB7XG4gICAgY2VsbHNbIGkgXSA9IHtcbiAgICAgICAgaW5kZXg6IGksXG4gICAgICAgIGU6IHVpLmVsZW1lbnQoIG51bGwsICdkaXYnICksXG4gICAgICAgIG9iamVjdHM6IFtdXG4gICAgfVxuICAgIHVpLmNvbnRlbnQoIHJlc3VsdHMuc25hcHNob3RJdGVtKCBpICksIGNlbGxzWyBpIF0uZSApXG4gICAgdWkuc3R5bGUoIGNlbGxzWyBpIF0uZSwgeyBwb3NpdGlvbjogJ3JlbGF0aXZlJywgaGVpZ2h0OiAnMWVtJyB9IClcbiAgICA7ICggKCBjZWxsICkgPT4ge1xuICAgICAgICBjZWxsLmUuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNlb3ZlcicsICgpID0+IHsgbW91c2VvdmVyKCBjZWxsICkgfSApXG4gICAgfSApKCBjZWxsc1sgaSBdIClcbiAgICBhZGQoIE9iamVjdCggJy4nICksIGkgKVxufVxuXG5jb25zdCBsYXlvdXQgPSAnYiAgdCAgICAgICAgICAgICAgdCAgICAgICAgICAgICAgdCAgICAgICAgICAgVCAgICAgICAgICAgICAgVCAgICAgICAgICAgICAgVCAgQidcblxuZm9yICggbGV0IGkgPSAwOyBpIDwgbGF5b3V0Lmxlbmd0aDsgaSsrICkge1xuICAgIGxldCBjaGFyID0gbGF5b3V0WyBpIF1cbiAgICBpZiAoIGNoYXIgPT09ICcgJyApIGNvbnRpbnVlXG4gICAgYWRkKCBPYmplY3QoIGNoYXIgKSwgaSApXG59XG5cbmFkZCggT2JqZWN0KCAnaCcgKSwgMCApXG5hZGQoIE9iamVjdCggJ0gnICksIGxheW91dC5sZW5ndGggLSAxIClcblxubWVtWyAnbG93ZXJwdHMnIF0gPSAwXG5tZW1bICdVUFBFUnB0cycgXSA9IDBcbm1lbVsgJ2VsYXBzZWQnIF0gPSAwXG5cbnVpLmNvbnRlbnQoIHVpLmVsZW1lbnQoICdib2R5JyApLCB1aS5sYXlvdXQoICdzdGF0dXMnLCBbIDMzLCAzMywgMzNdLCAxICkgKVxucmVzdWx0cyA9IHVpLnhwYXRoKCAnLy8qW0BpZD1cInN0YXR1c1wiXS8vdGQnLCBYUGF0aFJlc3VsdC5PUkRFUkVEX05PREVfU05BUFNIT1RfVFlQRSApXG51aS5zdHlsZSggdWkuc2V0aWQoIHJlc3VsdHMuc25hcHNob3RJdGVtKCAwICksICdsb3dlcnB0cycgKSwgeyB0ZXh0QWxpZ246ICdsZWZ0JyB9IClcbnVpLnN0eWxlKCB1aS5zZXRpZCggcmVzdWx0cy5zbmFwc2hvdEl0ZW0oIDEgKSwgJ2VsYXBzZWQnICksIHsgdGV4dEFsaWduOiAnY2VudGVyJyB9IClcbnVpLnN0eWxlKCB1aS5zZXRpZCggcmVzdWx0cy5zbmFwc2hvdEl0ZW0oIDIgKSwgJ1VQUEVScHRzJyApLCB7IHRleHRBbGlnbjogJ3JpZ2h0JyB9IClcblxudWkudXBkYXRlKClcblxuZnVuY3Rpb24gYWRkKCBvYmplY3QsIGluZGV4ICkge1xuICAgIGxldCBjZWxsID0gY2VsbHNbIGNsYW1wKCBpbmRleCApIF1cbiAgICBjZWxsLmUuYXBwZW5kQ2hpbGQoIG9iamVjdC5lIClcbiAgICBvYmplY3QuY2VsbCA9IGNlbGxcbiAgICBsZXQgb2JqcyA9IGNlbGwub2JqZWN0c1xuICAgIGxldCBpID0gb2Jqcy5pbmRleE9mKCBvYmplY3QgKVxuICAgIGlmICggaSA9PT0gLTEgKSBvYmpzLnB1c2goIG9iamVjdCApXG4gICAgb2Jqcy5zb3J0KCBjb21wYXJlX29iamVjdHNfYnlfaGVhbHRoIClcbn1cblxuXG5mdW5jdGlvbiBjbGFtcCggaW5kZXggKSB7XG4gICAgaWYgKCBpbmRleCA8IDAgKSB7XG4gICAgICAgIHJldHVybiBpbmRleCA9IDBcbiAgICB9XG4gICAgaWYgKCBpbmRleCA+PSBjZWxscy5sZW5ndGggKSB7XG4gICAgICAgIHJldHVybiBjZWxscy5sZW5ndGggLSAxXG4gICAgfVxuICAgIHJldHVybiBpbmRleFxufVxuXG5cbmZ1bmN0aW9uIGNvbXBhcmVfb2JqZWN0c19ieV9oZWFsdGgoIG9iajEsIG9iajIgKSB7XG4gICAgaWYgKCBvYmoxLmhlYWx0aCA9PT0gb2JqMi5oZWFsdGggKSByZXR1cm4gMFxuICAgIHJldHVybiAoIG9iajEuaGVhbHRoIDwgb2JqMi5oZWFsdGggKSA/IC0xIDogMVxufVxuXG5cbmZ1bmN0aW9uIHJlbW92ZSggb2JqZWN0ICkge1xuICAgIGlmICggIW9iamVjdC5jZWxsICkgcmV0dXJuXG4gICAgb2JqZWN0LmNlbGwuZS5yZW1vdmVDaGlsZCggb2JqZWN0LmUgKVxuICAgIGxldCBpID0gb2JqZWN0LmNlbGwub2JqZWN0cy5pbmRleE9mKCBvYmplY3QgKVxuICAgIGlmICggaSA+IC0xICkge1xuICAgICAgICBvYmplY3QuY2VsbC5vYmplY3RzLnNwbGljZSggaSwgMSApXG4gICAgfVxuICAgIG9iamVjdC5jZWxsID0gbnVsbFxufVxuXG5mdW5jdGlvbiBtb3ZlKCBvYmplY3QsIGluZGV4ICkge1xuICAgIGluZGV4ID0gY2xhbXAoIGluZGV4IClcbiAgICBpZiAoIGluZGV4ID09PSBvYmplY3QuY2VsbC5pbmRleCApIHJldHVybiBmYWxzZVxuICAgIHJlbW92ZSggb2JqZWN0IClcbiAgICBhZGQoIG9iamVjdCwgaW5kZXggKVxuICAgIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGZvcndhcmQoIG9iamVjdCwgZGlzdGFuY2UgKSB7XG4gICAgaWYgKCBlbmVteUF0KCBvYmplY3QsIG9iamVjdC5jZWxsLmluZGV4ICkgKSByZXR1cm4gdHJ1ZVxuICAgIGxldCBpbmRleCA9IGNsYW1wKCBvYmplY3QuY2VsbC5pbmRleCArICggL1tBLVpdLy50ZXN0KCBvYmplY3QuY2hhciApID8gLWRpc3RhbmNlIDogZGlzdGFuY2UgKSApXG4gICAgcmV0dXJuIG1vdmUoIG9iamVjdCwgaW5kZXggKVxufVxuXG5mdW5jdGlvbiBiYWNrKCBvYmplY3QgKSB7XG4gICAgbGV0IGJhc2UgPSAvW0EtWl0vLnRlc3QoIG9iamVjdC5jaGFyICkgPyBCWyAwIF0gOiBiWyAwIF1cbiAgICByZXR1cm4gbW92ZSggb2JqZWN0LCBiYXNlLmNlbGwuaW5kZXggKVxufVxuXG5mdW5jdGlvbiBhdHRhY2soIG9iamVjdCwgaW5kZXggKSB7XG4gICAgaWYgKCBvYmplY3QuZGFtYWdlID09PSAwICkgcmV0dXJuXG4gICAgbGV0IHRhcmdldCA9IGVuZW15QXQoIG9iamVjdCwgaW5kZXggKVxuICAgIGlmICggIXRhcmdldCApIHJldHVyblxuICAgIGlmICggdGFyZ2V0LmhlYWx0aCA9PT0gMCApIHJldHVyblxuICAgIGxldCBkYW1hZ2UgPSBvYmplY3QuZGFtYWdlIC0gKCBvYmplY3QuZGFtYWdlICogdGFyZ2V0LmRhbWFnZVJlZHVjdGlvbiApXG4gICAgdGFyZ2V0LmhlYWx0aCAtPSBkYW1hZ2VcbiAgICBpZiAoIHRhcmdldC5oZWFsdGggPD0gMCApIHtcbiAgICAgICAgdGFyZ2V0LmhlYWx0aCA9IDBcbiAgICAgICAgdGFyZ2V0Lmxhc3RoaXQgPSBvYmplY3RcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGtpbGxlZCggb2JqZWN0ICkge1xuICAgIGlmICggb2JqZWN0Lmxhc3RoaXQgPT09IGhbIDAgXSApIG1lbVsgJ2xvd2VycHRzJyBdICs9IDJcbiAgICBlbHNlIGlmICggb2JqZWN0Lmxhc3RoaXQgPT09IEhbIDAgXSApIG1lbVsgJ1VQUEVScHRzJyBdICs9IDJcbiAgICBlbHNlIGlmICggL1thLXpdLy50ZXN0KCBvYmplY3QubGFzdGhpdC5jaGFyICkgKSBtZW1bICdsb3dlcnB0cycgXSsrXG4gICAgZWxzZSBpZiAoIC9bQS1aXS8udGVzdCggb2JqZWN0Lmxhc3RoaXQuY2hhciApICkgbWVtWyAnVVBQRVJwdHMnIF0rK1xuICAgIHJlbW92ZSggb2JqZWN0IClcbiAgICBsZXQgY29uZmlnID0gQ0hBUlsgb2JqZWN0LmNoYXIgXVxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNvbmZpZy5tZW1iZXJPZi5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgbGV0IHQgPSBjb25maWcubWVtYmVyT2ZbIGkgXS5pbmRleE9mKCBvYmplY3QgKVxuICAgICAgICBpZiAoIHQgPiAtMSApIGNvbmZpZy5tZW1iZXJPZlsgaSBdLnNwbGljZSggdCwgMSApXG4gICAgfVxufVxuXG5mdW5jdGlvbiBmcmllbmRseUF0KCBvYmplY3QsIGluZGV4ICkge1xuICAgIGxldCBjZWxsID0gY2VsbHNbIGNsYW1wKCBpbmRleCApIF1cbiAgICBsZXQgdXBwZXIgPSAvW0EtWl0vLnRlc3QoIG9iamVjdC5jaGFyIClcbiAgICBsZXQgb2JqcyA9IGNlbGwub2JqZWN0c1xuICAgIGxldCBpID0gb2Jqcy5sZW5ndGhcbiAgICB3aGlsZSAoIGktLSApIHtcbiAgICAgICAgbGV0IG8gPSBvYmpzWyBpIF1cbiAgICAgICAgaWYgKCB1cHBlciAmJiAvW0EtWl0vLnRlc3QoIG8uY2hhciApICkge1xuICAgICAgICAgICAgcmV0dXJuIG9cbiAgICAgICAgfSBlbHNlIGlmICggIXVwcGVyICYmIC9bYS16XS8udGVzdCggby5jaGFyICkgKSB7XG4gICAgICAgICAgICByZXR1cm4gb1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBlbmVteUF0KCBvYmplY3QsIGluZGV4ICkge1xuICAgIGxldCBjZWxsID0gY2VsbHNbIGNsYW1wKCBpbmRleCApIF1cbiAgICBsZXQgdXBwZXIgPSAvW0EtWl0vLnRlc3QoIG9iamVjdC5jaGFyIClcbiAgICBsZXQgb2JqcyA9IGNlbGwub2JqZWN0c1xuICAgIGxldCBpID0gb2Jqcy5sZW5ndGhcbiAgICB3aGlsZSAoIGktLSApIHtcbiAgICAgICAgbGV0IG8gPSBvYmpzWyBpIF1cbiAgICAgICAgaWYgKCB1cHBlciAmJiAvW2Etel0vLnRlc3QoIG8uY2hhciApICkge1xuICAgICAgICAgICAgcmV0dXJuIG9cbiAgICAgICAgfSBlbHNlIGlmICggIXVwcGVyICYmIC9bQS1aXS8udGVzdCggby5jaGFyICkgKSB7XG4gICAgICAgICAgICByZXR1cm4gb1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiB0ZWxlcG9ydCggb2JqZWN0LCBpbmRleCApIHtcbiAgICBpZiAoIGZyaWVuZGx5QXQoIG9iamVjdCwgaW5kZXggKSApIHtcbiAgICAgICAgcmV0dXJuIG1vdmUoIG9iamVjdCwgaW5kZXggKVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gY2VsbHNXaXRoaW4oIGluZGV4LCBkaXN0YW5jZSApIHtcbiAgICBsZXQgZnJvbSA9IGluZGV4IC0gZGlzdGFuY2VcbiAgICBsZXQgdG8gPSBpbmRleCArIGRpc3RhbmNlXG4gICAgaWYgKCBmcm9tIDwgMCApIGZyb20gPSAwXG4gICAgaWYgKCB0byA+PSBjZWxscy5sZW5ndGggKSB0byA9IGNlbGxzLmxlbmd0aCAtIDFcbiAgICBsZXQgcmVzdWx0ID0gW11cbiAgICB3aGlsZSAoIGZyb20gPD0gdG8gKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKCBjZWxsc1sgZnJvbSBdIClcbiAgICAgICAgZnJvbSsrXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbn1cblxuXG5jb25zdCB0YXNrcyA9IFtdXG5cbmZ1bmN0aW9uIHN0YXJ0KCB0YXNrLCBpbnRlcnZhbCApIHtcbiAgICBpZiAoIGludGVydmFsICkge1xuICAgICAgICB0YXNrLmludGVydmFsID0gaW50ZXJ2YWxcbiAgICB9XG4gICAgdGFzay5sYXN0ID0gLTFcbiAgICB0YXNrcy5wdXNoKCB0YXNrIClcbn1cblxuZnVuY3Rpb24gc3RvcCggdGFzayApIHtcbiAgICBsZXQgaSA9IHRhc2tzLmluZGV4T2YoIHRhc2sgKVxuICAgIGlmICggaSA+IC0xICkgdGFza3Muc3BsaWNlKCBpLCAxIClcbn1cblxuXG5mdW5jdGlvbiBjcmVlcFNwYXduKCkge1xuICAgIGlmICggbWVtWyAnZWxhcHNlZCcgXSAlIDE1IDw9IDUgKSB7XG4gICAgICAgIGxldCBvYmplY3QgPSBPYmplY3QoICdDJyApXG4gICAgICAgIGlmICggb2JqZWN0ICkgYWRkKCBvYmplY3QsIEJbIDAgXS5jZWxsLmluZGV4IClcbiAgICAgICAgb2JqZWN0ID0gT2JqZWN0KCAnYycgKVxuICAgICAgICBpZiAoIG9iamVjdCApIGFkZCggb2JqZWN0LCBiWyAwIF0uY2VsbC5pbmRleCApXG4gICAgfVxufVxuXG5zdGFydCggY3JlZXBTcGF3biwgMiApXG5cbmZ1bmN0aW9uIGNyZWVwVXBkYXRlKCkge1xuICAgIGxldCBpID0gY3JlZXBzLmxlbmd0aFxuICAgIHdoaWxlICggaS0tICkge1xuICAgICAgICBsZXQgb2JqZWN0ID0gY3JlZXBzWyBpIF1cbiAgICAgICAgZm9yd2FyZCggb2JqZWN0LCAxIClcbiAgICB9XG59XG5cbnN0YXJ0KCBjcmVlcFVwZGF0ZSwgMSApXG5cbmxldCBtb3VzZWluZGV4ID0gMFxuXG5mdW5jdGlvbiBtb3VzZW92ZXIoIGNlbGwgKSB7XG4gICAgbW91c2VpbmRleCA9IGNlbGwuaW5kZXhcbiAgICBjb25zb2xlLmxvZyggY2VsbC5pbmRleCApXG59XG5cbmZ1bmN0aW9uIGtleWRvd24oIGV2ZW50ICkge1xuICAgIGlmICggaFsgMCBdLmhlYWx0aCA9PT0gMCApIHJldHVyblxuICAgIGxldCB0dXJuID0gdHJ1ZVxuICAgIHN3aXRjaCAoIGV2ZW50LmtleSApIHtcbiAgICAgICAgY2FzZSAnYSc6XG4gICAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdmJzpcbiAgICAgICAgICAgIHR1cm4gPSBmb3J3YXJkKCBoWyAwIF0sIDEgKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgICB0dXJuID0gZm9yd2FyZCggaFsgMCBdLCAtMSApXG4gICAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgICAgIHR1cm4gPSBiYWNrKCBoWyAwIF0gKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICB0dXJuID0gdGVsZXBvcnQoIGhbIDAgXSwgbW91c2VpbmRleCApXG4gICAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdHVybiA9IGZhbHNlXG4gICAgfVxuICAgIGlmICggdHVybiApIHtcbiAgICAgICAgbGV0IGkgPSB0YXNrcy5sZW5ndGhcbiAgICAgICAgd2hpbGUgKCBpLS0gKSB7XG4gICAgICAgICAgICBsZXQgdGFzayA9IHRhc2tzWyBpIF1cbiAgICAgICAgICAgIGlmICggbWVtWyAnZWxhcHNlZCcgXSA+PSB0YXNrLmxhc3QgKyB0YXNrLmludGVydmFsICkge1xuICAgICAgICAgICAgICAgIHRhc2soKVxuICAgICAgICAgICAgICAgIHRhc2subGFzdCA9IG1lbVsgJ2VsYXBzZWQnIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXNvbHZlIGF0dGFja3MgYWZ0ZXIgbW92ZW1lbnRcbiAgICAgICAgaSA9IG9iamVjdHMubGVuZ3RoXG4gICAgICAgIHdoaWxlICggaS0tICkge1xuICAgICAgICAgICAgbGV0IG9iamVjdCA9IG9iamVjdHNbIGkgXVxuICAgICAgICAgICAgYXR0YWNrKCBvYmplY3QsIG9iamVjdC5jZWxsLmluZGV4IClcbiAgICAgICAgfVxuICAgICAgICAvLyByZXNvbHZlIGtpbGxzIGFmdGVyIGF0dGFja3NcbiAgICAgICAgaSA9IG9iamVjdHMubGVuZ3RoXG4gICAgICAgIHdoaWxlICggaS0tICkge1xuICAgICAgICAgICAgbGV0IG9iamVjdCA9IG9iamVjdHNbIGkgXVxuICAgICAgICAgICAgaWYgKCBvYmplY3QuaGVhbHRoID09PSAwICkga2lsbGVkKCBvYmplY3QgKVxuICAgICAgICB9XG4gICAgICAgIG1lbVsgJ2VsYXBzZWQnIF0rK1xuICAgICAgICB1aS51cGRhdGUoKVxuICAgIH1cbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBrZXlkb3duICkiXSwibmFtZXMiOlsibGF5b3V0IiwidWkuc2V0aWQiLCJ1aS5jb250ZW50IiwidWkuZWxlbWVudCIsInVpLmF0dHJpYiIsIk9iamVjdCIsInVpLnN0eWxlIiwidWkubGF5b3V0IiwidWkueHBhdGgiLCJ1aS51cGRhdGUiXSwibWFwcGluZ3MiOiI7OztBQUFBLE9BQU0sR0FBRyxHQUFHLEVBQUU7O0NDRWQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLEFBQU8sT0FBTSxPQUFPLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxNQUFNO0NBQ3RDLElBQUksS0FBSyxFQUFFLEdBQUcsR0FBRyxPQUFPLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0NBQzFDLElBQUksSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLEdBQUU7Q0FDekMsSUFB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RSxJQUFJLEVBQUM7Q0FDM0QsU0FBUyxLQUFLLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO0NBQ2hFLFNBQVMsS0FBSyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsR0FBRyxFQUFFLFVBQVUsRUFBRSxHQUFFO0NBQ3ZFLFNBQVMsS0FBSyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsR0FBRyxFQUFFLFVBQVUsRUFBRSxHQUFFO0NBQ3ZFLElBQUksTUFBTSxFQUFFLE1BQU0sR0FBRTtDQUNwQixJQUFJLElBQUksTUFBTSxHQUFHLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFFO0NBQ3BDLElBQUksTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHO0NBQ3ZELFFBQVEsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxHQUFFO0NBQ3RELFFBQVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRTtDQUN6RCxLQUFLO0NBQ0wsQ0FBQzs7Q0FFRCxTQUFTLFVBQVUsRUFBRSxNQUFNLEVBQUUsS0FBSyxHQUFHO0NBQ3JDLElBQUksSUFBSSxJQUFJLEdBQUcsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRTtDQUN0QyxJQUFJLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRTtDQUMzQyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFPO0NBQzNCLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU07Q0FDdkIsSUFBSSxRQUFRLENBQUMsRUFBRSxHQUFHO0NBQ2xCLFFBQVEsSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRTtDQUN6QixRQUFRLEtBQUssS0FBSyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHO0NBQy9DLFlBQVksT0FBTyxDQUFDO0NBQ3BCLFNBQVMsTUFBTSxLQUFLLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHO0NBQ3ZELFlBQVksT0FBTyxDQUFDO0NBQ3BCLFNBQVM7Q0FDVCxLQUFLO0NBQ0wsSUFBSSxPQUFPLEtBQUs7Q0FDaEIsQ0FBQzs7Q0FFRCxTQUFTLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxHQUFHO0NBQ2xDLElBQUksSUFBSSxJQUFJLEdBQUcsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRTtDQUN0QyxJQUFJLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRTtDQUMzQyxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFPO0NBQzNCLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU07Q0FDdkIsSUFBSSxRQUFRLENBQUMsRUFBRSxHQUFHO0NBQ2xCLFFBQVEsSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRTtDQUN6QixRQUFRLEtBQUssS0FBSyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHO0NBQy9DLFlBQVksT0FBTyxDQUFDO0NBQ3BCLFNBQVMsTUFBTSxLQUFLLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHO0NBQ3ZELFlBQVksT0FBTyxDQUFDO0NBQ3BCLFNBQVM7Q0FDVCxLQUFL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
