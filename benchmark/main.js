import Canvas from '../canvas/canvas'


const canvas = Canvas( '0', 100, 100 )


const array = [
    new Array( canvas.width * canvas.height ),
    new Array( canvas.width * canvas.height )
]

let MAXX = canvas.width - 1
let MAXY = canvas.height - 1

let index = 0
let front = array[ index ]
let back = array[ 1 - index ]

const decay = 0.98
const D = decay * 255


for ( let y = 0; y < canvas.height; y ++ ) {

    for ( let x = 0; x < canvas.width; x ++ ) {

        front[ y * canvas.width + x ] = Canvas.rgba( 1, 1, 1, 1 )

    }

}


const DIAG_CONTRIB = 1.0 / 1.41421356237


const addA = ( rgba, Uint32, diag ) => {

    rgba.a += ( ( Uint32 >>> 24 ) / 255 ) * ( diag ? DIAG_CONTRIB : 1 )
    rgba.b += ( ( Uint32 >>> 16 & 0xFF ) / 255 ) * ( diag ? DIAG_CONTRIB : 1 )
    rgba.g += ( ( Uint32 >>> 8 & 0xFF ) / 255 ) * ( diag ? DIAG_CONTRIB : 1 )
    rgba.r += ( ( Uint32 & 0xFF ) / 255 ) * ( diag ? DIAG_CONTRIB : 1 )

}


const addB = ( rgba, Uint32 ) => {

    rgba.a += ( Uint32 >>> 24 ) / 255
    rgba.b += ( Uint32 >>> 16 & 0xFF ) / 255
    rgba.g += ( Uint32 >>> 8 & 0xFF ) / 255
    rgba.r += ( Uint32 & 0xFF ) / 255

}

const averageA = ( x, y ) => {

    let rgba = {
        r: 0,
        g: 0,
        b: 0,
        a: 0
    }

    let n = 0

    for ( let dy = - 1; dy < 2; dy++ ) {

        let Y = y + dy

        if ( Y < 0 || Y > MAXY ) continue

        for ( let dx = - 1; dx < 2; dx++ ) {

            let X = x + dx

            if ( X < 0 || X > MAXX ) continue

            addA( rgba, front[ Y * canvas.width + X ], dy != 0 || dx != 0 )

            n++

        }

    }

    rgba.r = ( rgba.r / n ) * decay
    rgba.g = ( rgba.g / n ) * decay
    rgba.b = ( rgba.b / n ) * decay
    rgba.a = ( rgba.a / n ) * decay

    if ( rgba.r < 0 ) rgba.r = 0; else if ( rgba.r > 1 ) rgba.r = 1
    if ( rgba.g < 0 ) rgba.g = 0; else if ( rgba.g > 1 ) rgba.g = 1
    if ( rgba.b < 0 ) rgba.b = 0; else if ( rgba.b > 1 ) rgba.b = 1
    if ( rgba.a < 0 ) rgba.a = 0; else if ( rgba.a > 1 ) rgba.a = 1

    return Canvas.rgba( rgba.r, rgba.g, rgba.b, rgba.a )

}

const averageB = ( x, y ) => {

    let rgba = {
        r: 0,
        g: 0,
        b: 0,
        a: 0
    }

    let n = 0

    let XX = x + 1
    let YY = y + 1

    for ( let Y = y - 1; Y <= YY; Y++ ) {

        for ( let X = x - 1; X <= XX; X++ ) {

            if ( X < 0 || X > MAXX || Y < 0 || Y > MAXY ) continue

            addB( rgba, front[ Y * canvas.width + X ] )

            n++

        }

    }

    rgba.r = ( rgba.r / n ) * decay
    rgba.g = ( rgba.g / n ) * decay
    rgba.b = ( rgba.b / n ) * decay
    rgba.a = ( rgba.a / n ) * decay

    if ( rgba.r < 0 ) rgba.r = 0; else if ( rgba.r > 1 ) rgba.r = 1
    if ( rgba.g < 0 ) rgba.g = 0; else if ( rgba.g > 1 ) rgba.g = 1
    if ( rgba.b < 0 ) rgba.b = 0; else if ( rgba.b > 1 ) rgba.b = 1
    if ( rgba.a < 0 ) rgba.a = 0; else if ( rgba.a > 1 ) rgba.a = 1

    return Canvas.rgba( rgba.r, rgba.g, rgba.b, rgba.a )

}


const methodA = () => {

    for ( let y = 0; y <= MAXY; y ++ ) {

        for ( let x = 0; x <= MAXX; x ++ ) {
            
            back[ y * canvas.width + x ] = averageA( x, y )

        }

    }

    index = 1 - index
    front = array[ index ]
    back = array[ 1 - index ]

    Canvas.forEach( canvas, ( x, y, width, height ) => {

        return front[ y * canvas.width + x ]

    } )

}

const methodB = () => {

    for ( let y = 0; y <= MAXY; y ++ ) {

        for ( let x = 0; x <= MAXX; x ++ ) {
            
            back[ y * canvas.width + x ] = averageB( x, y )

        }

    }

    index = 1 - index
    front = array[ index ]
    back = array[ 1 - index ]

    Canvas.forEach( canvas, ( x, y, width, height ) => {

        return front[ y * canvas.width + x ]

    } )

}


const log = message => {

    log.element.textContent += '\n' + message

}

log.element = document.getElementsByTagName( 'code' )
log.element = log.element[ log.element.length - 1 ]


log( 'Starting tests...\n' )


;( new Benchmark.Suite )

.add( 'methodA', function() {

    methodA()

} )

.add( 'methodB', function() {

    methodB()

} )

.on( 'cycle', function( event ) {

    log( event.target )

} )

.on( 'complete', function() {

    log( '\nFastest is ' + this.filter( 'fastest' ).map( 'name' ) )

} )

.run( { 'async': true } )
