import { MeshBasicMaterial } from 'threejs'
import { MeshPhongMaterial } from 'threejs'
import { CanvasTexture } from 'threejs'
import { BoxGeometry } from 'threejs'
import { PlaneGeometry } from 'threejs'
import { Vector3 } from 'threejs'
import { Mesh } from 'threejs'
import { TextureLoader } from 'threejs'
import { _Math } from 'threejs'
import { NearestFilter } from 'threejs'


export class Glyph {

    constructor( char, options ) {

        this.char = char
        this.meshes = []
        this.animations = []

        let name = Glyph.name( char )

        if ( name === 'player' ) {

            this.meshes.push( createMesh( '@', Object.assign( { colour: Glyph.colour( chars ) }, options ) ) )

        } else if ( name === 'ground' ) {

            this.meshes.push( createMesh( '.', Object.assign( { colour: Glyph.colour( chars ) }, options ) ) )

        } else if ( name === 'water' ) {

            this.meshes.push( createMesh( '~', Object.assign( { colour: Glyph.colour( chars ) }, options ) ) )

        } else this.meshes.push( createMesh( '?' ) )

    }

    static name( char ) {

        if ( char === '@' ) return 'player'
        if ( char === '.' ) return 'ground'
        if ( char === '`' ) return 'grass'
        if ( char === '^' ) return 'rock'
        if ( char === '~' ) return 'water'

        return 'unknown'

    }

    static colour( char ) {

        let name = Glyph.name( char )

        if ( name === 'player' ) return 0xffe0bd
        if ( name === 'ground' ) return 0x8a5639
        if ( name === 'grass' ) return 0xff1100
        if ( name === 'rock' ) return 0x69665c
        if ( name === 'water' ) return 0x469280

        return 0xffffff

    }

    static scale( chars ) {

        return { x: 1, y: 0.2, z: 1 }

    }

    addAnimation( animation ) {

        this.animations.push( animation )

    }

    animate( time ) {

        if ( this.animations.length === 0 ) return

        let array = this.animations
        let index = array.length

        while ( index-- ) {

            let animation = array[ index ]

            if ( !animation.hasOwnProperty( 'start' ) ) {

                animation.start = time

                if ( !animation.hasOwnProperty( 'from' ) ) {

                    animation.from = animation.object[ animation.property ]

                }

                continue

            }

            let alpha = ( time - animation.start ) / animation.duration

            if ( alpha > 1 ) alpha = 1

            animation.object[ animation.property ] = animation.from + animation.delta * alpha

            if ( alpha === 1 ) {

                if ( animation[ 'repeat' ] ) {

                    animation.object[ animation.property ] = animation.from
                    animation.start = time

                } else if ( animation[ 'pulse' ] ) {

                    animation.from = animation.object[ animation.property ]
                    animation.delta = -animation.delta
                    animation.start = time

                } else {

                    array.splice( index, 1 )

                }

            }

        }

    }

}


function createMesh( char, options ) {

    options = options || {}

    let scale = !options[ 'scale' ] ? { x: 1, y: 0.2, z: 1 } : options[ 'scale' ]

    let geometry = new BoxGeometry( scale.x, scale.y, scale.z ) // new PlaneGeometry( scale.x, scale.z )

    let uvs = geometry.faceVertexUvs[ 0 ]

    let i = chars.indexOf( char )
    let y = Math.floor( i / lettersperside )
    let x = i % lettersperside

    let x1 = x / lettersperside
    let x2 = x1 + uvsize
    let y2 = ( texturesize - ( y / lettersperside ) * texturesize ) / texturesize
    let y1 = y2 - uvsize

    for ( let f = 0; f < 12; f++ ) {

        let faceuvs = uvs[ f ]

        // if ( f === 4 || f === 5 ) {

        faceuvs[ 0 ].x = faceuvs[ 0 ].x ? x2 : x1
        faceuvs[ 0 ].y = faceuvs[ 0 ].y ? y2 : y1
        faceuvs[ 1 ].x = faceuvs[ 1 ].x ? x2 : x1
        faceuvs[ 1 ].y = faceuvs[ 1 ].y ? y2 : y1
        faceuvs[ 2 ].x = faceuvs[ 2 ].x ? x2 : x1
        faceuvs[ 2 ].y = faceuvs[ 2 ].y ? y2 : y1

        // } else {

        //     faceuvs[ 0 ].x = faceuvs[ 0 ].y = faceuvs[ 1 ].x = faceuvs[ 1 ].y = faceuvs[ 2 ].x = faceuvs[ 2 ].y = 0

        // }

    }

    // for ( let f = 0; f < 2; f++ ) {

    //     let faceuvs = uvs[ f ]

    //     if ( f === 0 || f === 1 ) {

    //         faceuvs[ 0 ].x = faceuvs[ 0 ].x ? x2 : x1
    //         faceuvs[ 0 ].y = faceuvs[ 0 ].y ? y2 : y1
    //         faceuvs[ 1 ].x = faceuvs[ 1 ].x ? x2 : x1
    //         faceuvs[ 1 ].y = faceuvs[ 1 ].y ? y2 : y1
    //         faceuvs[ 2 ].x = faceuvs[ 2 ].x ? x2 : x1
    //         faceuvs[ 2 ].y = faceuvs[ 2 ].y ? y2 : y1

    //     } else {

    //         faceuvs[ 0 ].x = faceuvs[ 0 ].y = faceuvs[ 1 ].x = faceuvs[ 1 ].y = faceuvs[ 2 ].x = faceuvs[ 2 ].y = 0

    //     }

    // }

    let material = textureMaterialByColour[ 0x777777 ]

    if ( options.hasOwnProperty( 'colour' ) ) {

        let colour = options[ 'colour' ]

        material = material.clone()
        material.color.setHex( colour )
        textureMaterialByColour[ colour ] = material

    }

    let mesh = new Mesh( geometry, material )

    let rotation = !options[ 'rotation' ] ? { x: 0, y: 0, z: 0 } : options[ 'rotation' ]

    mesh.rotation.set( rotation.x, rotation.y, rotation.z )

    let position = !options[ 'position' ] ? { x: 0, y: 0, z: 0 } : options[ 'position' ]

    mesh.position.copy( position )

    return mesh

}


function createBase( height, colour ) {

    let geometry = new BoxGeometry( 1, height, 1 )
    let material

    if ( solidMaterialByColour.hasOwnProperty( colour ) ) {

        material = solidMaterialByColour[ colour ]

    } else {

        material = solidMaterialByColour[ 0x777777 ].clone()
        material.color.setHex( colour )
        solidMaterialByColour[ colour ] = material

    }

    let mesh = new Mesh( geometry, material )

    return mesh

}





// -----------------------------------------------------------------------------------

const chars = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_.,-~∼=:;+?#%⁂⨍≋$&@<>()[]{}\/`\'"^*!━╰╭|│╯╮┐┘┌└∩⌐░▒▓▢■'
const texturesize = 1024
const family = 'Monospace'

const foreground = 'rgb(127,127,127)'

const canvas = document.createElement( 'canvas' )
canvas.width = canvas.height = texturesize
// document.body.appendChild( canvas )

const size = texturesize / Math.sqrt( chars.length )
const lettersperside = Math.ceil( texturesize / size )

const ctx = canvas.getContext( '2d' )
ctx.imageSmoothingEnabled = true
ctx.fillStyle = 'rgb( 60, 60, 60 )'
ctx.fillRect( 0, 0, canvas.width, canvas.height )

ctx.font = Math.floor( size * 0.7 ) + 'px ' + family
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'

const uvsize = 1 / lettersperside
const tilesize = uvsize * texturesize
const halftile = 0.5 * tilesize

ctx.fillStyle = foreground

for ( let i = 0, y = 0; y < lettersperside; y++ ) {

    for ( let x = 0; x < lettersperside; x++ , i++ ) {

        if ( i >= chars.length ) break

        let x1 = ( x / lettersperside ) * texturesize
        let y1 = ( y / lettersperside ) * texturesize

        ctx.fillText( chars[ i ], Math.round( halftile + x1 ), Math.round( halftile * 0.9 + y1 ) )

    }

}

const texture = new CanvasTexture( canvas )
const textureMaterialByColour = {}
textureMaterialByColour[ 0x777777 ] = new MeshBasicMaterial( {
    color: 0x777777,
    map: texture
} )
const solidMaterialByColour = {}
solidMaterialByColour[ 0x777777 ] = new MeshBasicMaterial( {
    color: 0x777777
} )



// const meshes = {}

// for ( let i = 0, y = 0; y < lettersperside; y++ ) {

//     for ( let x = 0; x < lettersperside; x++ , i++ ) {

//         if ( i >= chars.length ) break

//         let x1 = x / lettersperside
//         let x2 = x1 + uvsize
//         let y2 = ( texturesize - ( y / lettersperside ) * texturesize ) / texturesize
//         let y1 = y2 - uvsize

//         let geometry = new BoxGeometry( 1, 1, 1 )
//         let uvs = geometry.faceVertexUvs[ 0 ]

//         for ( let f = 0; f < 12; f++ ) {

//             let faceuvs = uvs[ f ]

//             if ( f === 4 || f === 5 ) {

//                 faceuvs[ 0 ].x = faceuvs[ 0 ].x ? x2 : x1
//                 faceuvs[ 0 ].y = faceuvs[ 0 ].y ? y2 : y1
//                 faceuvs[ 1 ].x = faceuvs[ 1 ].x ? x2 : x1
//                 faceuvs[ 1 ].y = faceuvs[ 1 ].y ? y2 : y1
//                 faceuvs[ 2 ].x = faceuvs[ 2 ].x ? x2 : x1
//                 faceuvs[ 2 ].y = faceuvs[ 2 ].y ? y2 : y1

//             } else {

//                 faceuvs[ 0 ].x = faceuvs[ 0 ].y = faceuvs[ 1 ].x = faceuvs[ 1 ].y = faceuvs[ 2 ].x = faceuvs[ 2 ].y = 0

//             }

//         }

//         meshes[ chars[ i ] ] = new Mesh( geometry, material )

//     }

// }
