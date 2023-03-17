import * as global from '../global'
import * as events from '../events'

global.world.addEventListener( events.ADDED, function ( event ) {

    let worldobject = event.object

    worldobject.addEventListener( events.COLLIDE, function ( event ) {



    } )

} )
