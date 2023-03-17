# Simplex noise

[simplex](simplex.js) is an implementation of Ken Perlins [Simplex noise](https://en.wikipedia.org/wiki/Simplex_noise).

```

/**
 * Returns the same psuedo-random number given the same inputs.
 * @param {number} x
 * @param {number} y
 * @return {number} [-1.0, 1.0]
 */
noise( x, y )

/**
 * Seeds simplex.noise.
 * @param {string} seed
 */
seed( seed )

/**
 * Returns a random string of characters in the range [a-Z0-9] of length n.
 * @param {number} n
 */
randomString( n )

```

## Using noise to generate textures
To generate a texture from noise we use each pixels x and y location as inputs to the noise function and get back a floating point number in the range [-1, 1] which we map to the range [0, 1] using ( noise + 1 ) / 2.0 than normalise to a luminosity range of [0, 255]. Repeat this for each pixel and you end up with something like the static you see on an untuned TV.  

```

import Canvas from '../canvas/canvas'
import * as simplex from '../simplex/simplex'

simplex.seed( "seed to make the output consistent between runs" )

const colour = noise => {

    // map range from [ - 1, 1 ] to [ 0, 1 ]
    noise = ( noise + 1 ) / 2.0

    // return argb to Uint32 pixel data
    return Canvas.rgb( noise, 0.9 * noise, 0.8 * noise )

}

Canvas.forEach( Canvas( "static" ), ( x, y, width, height ) => {

    let noise = simplex.noise( x, y )

    return colour( noise )

} )

```

<canvas id="static" width="512" height="512"></canvas>

To smooth this chaos out we need to reduce the distance between each pixels noise input. Thinking of noise as a sound wave, what we want is noise with low-frequency which can be achieved by scaling the input. If we scale x and y by width and height respectively, the noise inputs will change from a range of [(0, 0), (width, height)] to a range of [(0, 0), (1, 1)], meaning there is less change in inputs over a greater distance on canvas so the end result will appear less chaotic.

```

Canvas.forEach( Canvas( "low_frequency" ), ( x, y, width, height ) => {

    let noise = simplex.noise( x / width, y / height )

    return colour( noise )

} )

```

<canvas id="low_frequency" width="512" height="512"></canvas>

Besides the obvious use as a procedurally generated height map, you can also create interesting patterns for textures by doing more with the noise value than just simply normalising to a luminosity range. For example, by breaking the continuity of the noise by only considering the remainder of ( noise - ~~noise ) you can achieve a grain like texture. 


```

Canvas.forEach( Canvas( "grain" ), ( x, y, width, height ) => {

    let grain = ( simplex.noise( x / width, y / height ) + 1 ) * 10

    grain = ( grain - ~~grain )

    return colour( grain )

} )

```

<canvas id="grain" width="512" height="512"></canvas>

You can than start thinking in terms of layers of noise with each layer contributing a percentage of the final result. For example adding very high-frequency noise with low amplitude to the grain we get something that looks a little rougher.

```

Canvas.forEach( Canvas( 'grain_plus_finer_noise' ), ( x, y, width, height ) => {

    let grain = ( simplex.noise( x / width, y / height ) + 1 ) * 5

    grain = ( grain - ~~grain )

    let finer = simplex.noise( x, y )

    return colour( ( 0.85 * grain ) + ( 0.15 * finer ) )

} )

```

<canvas id="grain_plus_finer_noise" width="512" height="512"></canvas>

We'll add one more layer and be done with our procedurally generated wood texture. The last layer is a streak or scratch like effect, which contributes 20% to the final result. The other layers contributions have been adjusted so that the sum of all noise adds to 1.

```

Canvas.forEach( Canvas( "grain_plus_finer_noise_plus_streak" ), ( x, y, width, height ) => {

    let grain = ( simplex.noise( x / width, y / height ) + 1 ) * 5

    grain = ( grain - ~~grain )

    let finer = simplex.noise( x, y )

    let streak = simplex.noise( x / width, y )

    return colour( ( 0.7 * grain ) + ( 0.1 * finer ) + ( 0.2 * streak ) )

} )

```

<canvas id="grain_plus_finer_noise_plus_streak" width="512" height="512"></canvas>


## References
[Ken Perlin](https://web.archive.org/web/20120517024212/http://mrl.nyu.edu/~perlin/) Invented Perlin noise to generate textures for Tron and later this method in 2001 to address the limitations of his classic noise function [Real-Time Shading SIGGRAPH Course Notes 2001](https://web.archive.org/web/20120517024212/http://www.csee.umbc.edu/~olano/s2002c36/ch02.pdf)

[Perlin noise](https://web.archive.org/web/20120512184725/http://freespace.virgin.net/hugo.elias/models/m_perlin.htm) is a great introduction to the use noise for producing procedurally generated textures by Huge Elias

[Texture synthesis](https://web.archive.org/web/20061113131058/http://www.threedgraphics.com/texsynth/index.html) is a collection of links related to procedural texture synthesis


![script](bundle.js)
