import * as global from 'src/global'
import * as events from 'src/events'

global.world.addEventListener( events.ADDED, function ( event ) {

    let worldobject = event.object

    worldobject.addEventListener( events.COLLIDE, function ( event ) {



    } )

} )
