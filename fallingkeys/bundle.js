(function () {
	'use strict';

	/*
	let ground = new Body( { mass: 0 } )
	ground.addShape( new Plane( new Vec3( 0, 0, 1 ) ) )
	world.addBody( ground )

	let style = document.createElement( 'style' )
	let basestyle = 'position: absolute; display: inline-block; padding: 1em; border: 1px solid gray;'
	style.textContent = '\n' + [
	    '.fallingkey_ { ' + basestyle + ' background-color: red; }',
	    '.fallingkey { ' + basestyle + ' transition: background-color 1s ease; background-color: rgba( 255, 255, 255, 0 ); }'
	].join( '\n' ) + '\n'
	document.getElementsByTagName( 'head' )[ 0 ].appendChild( style )

	let current = 0
	let elapsed = 0
	const step = 1.0 / 60.0
	const keys = []

	function update( time ) {
	    requestAnimationFrame( update )
	    elapsed = time - current
	    current = time
	    let i = keys.length
	    while( i-- ) {
	        let k = keys[ i ]
	        let p = k.b.position
	        k.e.style.webkitTransform = 'translate(' + p.x + 'px,' + p.z + 'px)' 
	        k.e.style.transform = 'translate(' + p.x + 'px,' + p.z + 'px)'
	    }
	    world.step( step )
	}

	update()

	document.addEventListener( 'keyup', event => {
	    ;( ( label, e ) => {
	        let b = new Body( { mass: 1 } )
	        b.addShape( new Box( new Vec3( 1, 1, 1 ) ) )
	        world.addBody( b )
	        e.className = 'fallingkey_'
	        e.textContent = label
	        document.body.appendChild( e )
	        setTimeout( () => e.className = 'fallingkey', 30 )
	        keys.push( {
	            e: e,
	            b: b
	        } )
	    } )( event.key.replace( / /, 'Space' ), document.createElement( 'div' ) )
	} )
	*/

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyJzcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3JsZCwgQm94LCBhZGRCb3ggfSBmcm9tICcuL3BwJ1xuXG5jb25zdCB3b3JsZCA9IFdvcmxkKClcbmFkZEJveCggd29ybGQsIHsgd2lkdGg6IDIsIGhlaWdodDogMSwgbWFzczogMCwgcG9zaXRpb246IFsgMCwgMyBdIH0gKVxuXG4vKlxubGV0IGdyb3VuZCA9IG5ldyBCb2R5KCB7IG1hc3M6IDAgfSApXG5ncm91bmQuYWRkU2hhcGUoIG5ldyBQbGFuZSggbmV3IFZlYzMoIDAsIDAsIDEgKSApIClcbndvcmxkLmFkZEJvZHkoIGdyb3VuZCApXG5cbmxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzdHlsZScgKVxubGV0IGJhc2VzdHlsZSA9ICdwb3NpdGlvbjogYWJzb2x1dGU7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgcGFkZGluZzogMWVtOyBib3JkZXI6IDFweCBzb2xpZCBncmF5OydcbnN0eWxlLnRleHRDb250ZW50ID0gJ1xcbicgKyBbXG4gICAgJy5mYWxsaW5na2V5XyB7ICcgKyBiYXNlc3R5bGUgKyAnIGJhY2tncm91bmQtY29sb3I6IHJlZDsgfScsXG4gICAgJy5mYWxsaW5na2V5IHsgJyArIGJhc2VzdHlsZSArICcgdHJhbnNpdGlvbjogYmFja2dyb3VuZC1jb2xvciAxcyBlYXNlOyBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKCAyNTUsIDI1NSwgMjU1LCAwICk7IH0nXG5dLmpvaW4oICdcXG4nICkgKyAnXFxuJ1xuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoICdoZWFkJyApWyAwIF0uYXBwZW5kQ2hpbGQoIHN0eWxlIClcblxubGV0IGN1cnJlbnQgPSAwXG5sZXQgZWxhcHNlZCA9IDBcbmNvbnN0IHN0ZXAgPSAxLjAgLyA2MC4wXG5jb25zdCBrZXlzID0gW11cblxuZnVuY3Rpb24gdXBkYXRlKCB0aW1lICkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggdXBkYXRlIClcbiAgICBlbGFwc2VkID0gdGltZSAtIGN1cnJlbnRcbiAgICBjdXJyZW50ID0gdGltZVxuICAgIGxldCBpID0ga2V5cy5sZW5ndGhcbiAgICB3aGlsZSggaS0tICkge1xuICAgICAgICBsZXQgayA9IGtleXNbIGkgXVxuICAgICAgICBsZXQgcCA9IGsuYi5wb3NpdGlvblxuICAgICAgICBrLmUuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgnICsgcC54ICsgJ3B4LCcgKyBwLnogKyAncHgpJyBcbiAgICAgICAgay5lLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoJyArIHAueCArICdweCwnICsgcC56ICsgJ3B4KSdcbiAgICB9XG4gICAgd29ybGQuc3RlcCggc3RlcCApXG59XG5cbnVwZGF0ZSgpXG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdrZXl1cCcsIGV2ZW50ID0+IHtcbiAgICA7KCAoIGxhYmVsLCBlICkgPT4ge1xuICAgICAgICBsZXQgYiA9IG5ldyBCb2R5KCB7IG1hc3M6IDEgfSApXG4gICAgICAgIGIuYWRkU2hhcGUoIG5ldyBCb3goIG5ldyBWZWMzKCAxLCAxLCAxICkgKSApXG4gICAgICAgIHdvcmxkLmFkZEJvZHkoIGIgKVxuICAgICAgICBlLmNsYXNzTmFtZSA9ICdmYWxsaW5na2V5XydcbiAgICAgICAgZS50ZXh0Q29udGVudCA9IGxhYmVsXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGUgKVxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiBlLmNsYXNzTmFtZSA9ICdmYWxsaW5na2V5JywgMzAgKVxuICAgICAgICBrZXlzLnB1c2goIHtcbiAgICAgICAgICAgIGU6IGUsXG4gICAgICAgICAgICBiOiBiXG4gICAgICAgIH0gKVxuICAgIH0gKSggZXZlbnQua2V5LnJlcGxhY2UoIC8gLywgJ1NwYWNlJyApLCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApIClcbn0gKVxuKi8iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0NBS0E7Q0FDQTtDQUNBO0NBQ0E7O0NBRUE7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7O0NBRUE7Q0FDQTtDQUNBO0NBQ0E7O0NBRUE7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7O0NBRUE7O0NBRUE7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Ozs7In0=
