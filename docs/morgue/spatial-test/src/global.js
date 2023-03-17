import { Vector3 } from 'threejs'
import { Vector2 } from 'threejs'
import { Raycaster } from 'threejs'
import { Plane } from 'threejs'
import { EventDispatcher } from 'threejs'
import { Display } from './Display'
import { World } from './World'
import { Heap } from './Heap'


export const mouseoverEvent = { type: 'mouseover' }
export const mouseleaveEvent = { type: 'mouseleave' }
export const changeEvent = { type: 'change' }


export const tmp_v2 = new Vector2()
export const v3_posY = new Vector3( 0, 1, 0 )
export const plane_XZ = new Plane( v3_posY )
export const raycaster = new Raycaster()
export const events = new EventDispatcher()

export let mouseover = null

export let time = 0
export let elapsed = 0
let lag = 0
export const LOGICINTERVAL = 1000.0 / 20.0


export const logicheap = new Heap()
export const animationlist = []


export function schedule( callback, when ) {

    let score = ( when === undefined ) ? time + 1 : when

    logicheap.push( callback, score )

}


export function startAnimation( callback ) {

    animationlist.push( callback )

}


export function stopAnimation( callback ) {

    let index = animationlist.indexOf( callback )

    if ( index > -1 ) {

        animationlist.splice( index, 1 )

    }

}


export const display = new Display( { camera: 'perspective' } ) // 'orthographic' 'perspective'

export const world = new World( display )


document.addEventListener( 'mousemove', function ( event ) {

    tmp_v2.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 )
    raycaster.setFromCamera( tmp_v2, display.camera )
    let intersects = raycaster.intersectObjects( display.scene.children, true )

    if ( intersects.length ) {

        let worldobject = intersects[ 0 ].object.worldobject

        if ( mouseover !== worldobject ) {

            if ( mouseover ) mouseover.dispatchEvent( mouseleaveEvent )
            mouseover = worldobject
            if ( mouseover ) mouseover.dispatchEvent( mouseoverEvent )

        }

    }

} )


function gameloop( current ) {

    requestAnimationFrame( gameloop )

    elapsed = current - time
    time = current

    display.update()

    let index = animationlist.length

    while ( index-- ) {

        animationlist[ index ]()

    }

    // catch any unexpectedly large frame rate spikes
    if ( elapsed > 1000 ) elapsed = LOGICINTERVAL

    lag += elapsed

    if ( lag >= LOGICINTERVAL ) {

        let head = logicheap.peek()

        if ( head && head.heapscore <= time ) {

            while ( logicheap.pop()() === false ) {

                head = logicheap.peek()

                if ( !head || head.heapscore > time ) break

            }

        }

        lag = 0

    }

}


export function run() {

    gameloop( 0 )

}
