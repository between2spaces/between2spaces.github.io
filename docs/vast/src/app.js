
function animate( time ) {

	requestAnimationFrame( animate )

	_scene.update()

}



function scene( newscene ) {

	_scene.destroy()
	
	_scene = newscene

	_scene.init()

}



function data( name, value ) {

	if ( typeof value !== "undefined" ) {

		data.values[ name ] = value

	}

	return data.values.hasOwnProperty( name ) ? data.values[ name ] : null

};


data.values = {}




function listen( object, event, fn, delay ) {

	let router

	if ( delay ) {

		( function ( timeout ) {

			router = object => {

				timeout || ( fn( object ), timeout = setTimeout( () => {

					timeout = null

				}, delay ) )

			}

		} )()

	} else {

		router = object => {

			fn( object )

		}

	}

	if ( object === window || object === document || object instanceof HTMLElement ) {

		object.addEventListener( event, router )

	} else {

		if ( ! listen.uuids.hasOwnProperty( event ) ) {

			listen.uuids[ event ] = {}

		}

		if ( ! object.hasOwnProperty( "uuid" ) ) {

			object.uuid = _Math.generateUUID()

		}

		if ( ! listen.uuids[ event ].hasOwnProperty( object.uuid ) ) {

			listen.uuids[ event ][ object.uuid ] = []

		}

		listen.uuids[ event ][ object.uuid ].push( router )

	}

}


listen.uuids = {}


function announce( object, event ) {

	if ( object === window || object === document || object instanceof HTMLElement ) {

		object.dispatchEvent( new Event( event ) )

	} else {

		if ( listen.uuids.hasOwnProperty( event ) && listen.uuids[ event ].hasOwnProperty( object.uuid ) ) {

			for ( let index = 0; index < listen.uuids[ event ][ object.uuid ].length; index ++ ) {

				listen.uuids[ event ][ object.uuid ][ index ]( object )

			}

		}

	}

}


let _scene = { update: () => {}, destroy: () => {} }


animate( 0 )


export { scene, data, listen, announce }
