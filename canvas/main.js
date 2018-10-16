import * as canvas from "./canvas"


canvas.paint( canvas.Canvas( 'paint' ), ( x, y, width, height ) => {

    return Math.random() > 0.95 ? canvas.rgb( 1, 1, 1 ) : canvas.rgb( 0.5, 0.5, 0.7 );

} )
