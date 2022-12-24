# Canvas

[canvas](canvas.js) wraps a HTML canvas with some useful functions.

```
/**
 * Returns a {Canvas} representing the canvas identified with id
 * @param {string} id
 * @return a {Canvas}
 */
const Canvas( id )

/**
 * Updates the display with the canvases image data
 * @param {Canvas} canvas 
 */
Canvas.updateImageData( canvas )

/**
 * Sets the colours of each pixel to the uint32 returned by fn, and updates the display.
 * @param {function} fn 
 */
Canvas.forEach( canvas, fn )

/**
 * Returns a Uint32 colour value from floats r, g, b, a in the range [0, 1]
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @param {number} a 
 * @return {number}
 */
Canvas.rgba( r, g, b, a )

/**
 * Returns a Uint32 colour value from floats r, g, b in the range [0, 1]
 * The colours alpha channel is set be opaque (i.e 1)
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @return {number}
 */
Canvas.rgb( r, g, b )
```

## Usage
Create an instance of Canvas for the canvas you wish to draw to.
````
import Canvas from "../canvas/canvas"

let canvas = Canvas( "canvas" )
```

Canvas.forEach iterates each pixel of the canvas setting its colour data to the returned Uint32 number of the provided function. The pixels x and y location along with the canvas's width and height are passed to the function. 

```
Canvas.forEach( canvas, ( x, y, width, height ) => {

    let r = 0.5;
    let g = 0.5;
    let b = 0.7;
    let a = 1;

    if ( Math.random() > 0.95 ) {

        r = g = b = 1;

    }

    return ( ~~( a * 255.0 ) << 24 ) | ( ~~( b * 255.0 ) << 16 ) | ( ~~( g * 255.0 ) << 8 ) | ~~( r * 255.0 );

} );
```

Canvas.rgb and Canvas.rgba are provided as convienence functions taking colour components as floats in the range [0, 1] and converting to a Uint32 number.

```
Canvas.forEach( canvas, ( x, y, width, height ) => {

    return Math.random() > 0.95 ? Canvas.rgb( 1, 1, 1 ) : Canvas.rgb( 0.5, 0.5, 0.7 );

} );
```



<canvas id="paint" width="512" height="512"></canvas>

![script](bundle.js)
