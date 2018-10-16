/*! canvas */

/**
 * Returns a {Canvas} representing the canvas identified with id
 * @param {string} id
 * @param {number?} width
 * @param {number?} height
 * @return a {Canvas}
 */
const Canvas = ( id, width, height ) => {

    let canvas = {
        element: document.getElementById( id )
    }
    
    if ( ! canvas.element ) {

        console.warn( 'Canvas "' + id + '" not found' )
        return null

    }

    if ( width ) canvas.element.width = width
    if ( height ) canvas.element.height = height

    canvas.width  = canvas.element.width
    canvas.height = canvas.element.height
    canvas.ctx = canvas.element.getContext( '2d' )
    canvas.imageData = canvas.ctx.getImageData( 0, 0, canvas.width, canvas.height )

    canvas.buf = new ArrayBuffer( canvas.imageData.data.length )
    canvas.buf8 = new Uint8ClampedArray( canvas.buf )
    canvas.data = new Uint32Array( canvas.buf )

    return canvas

}

/**
 * Updates the display with the canvases image data
 * @param {Canvas} canvas
 */
const updateImageData = canvas => {

    canvas.imageData.data.set( canvas.buf8 )
    canvas.ctx.putImageData( canvas.imageData, 0, 0 )

}

/**
 * Sets the colours of each pixel to the uint32 returned by fn, than updates the display.
 * @param {function} fn
 */
const paint = ( canvas, fn ) => {

    let height = canvas.height
    let width = canvas.width

    for ( let y = 0; y < height; ++ y ) {

        for ( let x = 0; x < width; ++ x ) {

            canvas.data[ y * width + x ] = fn( x, y, width, height )

        }

    }

    updateImageData( canvas )

}

/**
 * Returns a Uint32 colour value from floats r, g, b, a in the range [0, 1]
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 * @return {number}
 */
const rgba = ( r, g, b, a ) => {

    return ( ~~ ( a * 255.0 ) << 24 ) | ( ~~ ( b * 255.0 ) << 16 ) | ( ~~ ( g * 255.0 ) << 8 ) | ~~ ( r * 255.0 )

}

/**
 * Returns a Uint32 colour value from floats r, g, b in the range [0, 1]
 * The colours alpha channel is set be opaque (i.e 1)
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @return {number}
 */
const rgb = ( r, g, b ) => {

    return OPAQUE | ( ~~ ( b * 255.0 ) << 16 ) | ( ~~ ( g * 255.0 ) << 8 ) | ~~ ( r * 255.0 )

}

// Alpha constants
const OPAQUE = 255 << 24
const TRANSPARENT = 0 << 24

export { Canvas, updateImageData, paint, rgba, rgb, OPAQUE, TRANSPARENT }
