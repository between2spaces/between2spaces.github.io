import * as canvas from '../canvas/canvas'
import * as simplex from '../simplex/simplex'


simplex.seed( 'seed to make the output consistent between runs' )


const colour = noise => {

    // map range from [-1, 1] to [0, 1]
    noise = ( noise + 1 ) / 2.0

    // return argb to Uint32 pixel data
    return canvas.rgb( noise, 0.9 * noise, 0.8 * noise )

}


canvas.paint( canvas.Canvas( 'static' ), ( x, y, width, height ) => {

    let noise = simplex.noise( x, y )

    return colour( noise )

} )


canvas.paint( canvas.Canvas( 'low_frequency' ), ( x, y, width, height ) => {

    let noise = simplex.noise( x / width, y / height )

    return colour( noise )

} )


canvas.paint( canvas.Canvas( 'grain' ), ( x, y, width, height ) => {

    let grain = ( simplex.noise( x / width, y / height ) + 1 ) * 5

    grain = ( grain - ~~grain )

    return colour( grain )

} )


canvas.paint( canvas.Canvas( 'grain_plus_finer_noise' ), ( x, y, width, height ) => {

    let grain = ( simplex.noise( x / width, y / height ) + 1 ) * 5

    grain = ( grain - ~~grain )

    let finer = simplex.noise( x, y )

    return colour(( 0.85 * grain ) + ( 0.15 * finer ) )

} )


canvas.paint( canvas.Canvas( 'grain_plus_finer_noise_plus_streak' ), ( x, y, width, height ) => {

    let grain = ( simplex.noise( x / width, y / height ) + 1 ) * 5

    grain = ( grain - ~~grain )

    let finer = simplex.noise( x, y )

    let streak = simplex.noise( x / width, y )

    return colour( ( 0.7 * grain ) + ( 0.1 * finer ) + ( 0.2 * streak ) )

} )
