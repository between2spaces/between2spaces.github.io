import * as global from '../global'
import * as events from '../events'

global.world.addEventListener( events.ADDED, function ( event ) {

    let worldobject = event.object

    worldobject.addEventListener( events.MOVED, function ( event ) {

        if ( !worldobject.isVisible() ) return

        worldobject.move_start_time = global.time
        let distance = worldobject.object3d.position.distanceTo( worldobject.position )
        let duration = ( distance / worldobject.speed ) * 1000

        let animation = function () {

            let alpha = ( global.time - worldobject.move_start_time ) / duration

            if ( alpha >= 1 ) {

                worldobject.object3d.position.copy( worldobject.position )
                global.stopAnimation( animation )
                return

            }

            worldobject.object3d.position.lerp( worldobject.position, alpha )

        }

        if ( distance !== 0 ) {

            global.startAnimation( animation )

        }

    } )

} )