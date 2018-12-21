const canvas = document.getElementById( "game-layer" )
const ctx = canvas.getContext( "2d", { alpha: false } )

function onresize() {
    console.log( "onresize" )
    canvas.style.transformOrigin = "0 0"
    canvas.style.transform = "scale(" + Math.max( window.innerWidth / canvas.width, window.innerHeight / canvas.height ) + ")"
}

onresize()

function debounce( func, wait, immediate ) {
    let timeout
    return function () {
        let context = this
        let args = arguments
        let later = function () {
            timeout = null
            if ( !immediate ) func.apply( context, args )
        };
        let callNow = immediate && !timeout
        clearTimeout( timeout )
        timeout = setTimeout( later, wait )
        if ( callNow ) func.apply( context, args )
    }
}

const resizeListener = debounce( onresize, 250 )

window.addEventListener( 'resize', resizeListener )