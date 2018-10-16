import { EventDispatcher } from "threejs/core/EventDispatcher"
import { Vector3 } from "threejs/math/Vector3"
import { Mesh } from "threejs/objects/Mesh"
import { CanvasTexture } from "threejs/textures/CanvasTexture"
import { BoxGeometry } from "threejs/geometries/BoxGeometry"
import { MeshPhongMaterial } from "threejs/materials/MeshPhongMaterial"
import * as world from "client/world"
import * as display from "client/display"

class Block extends EventDispatcher {

    constructor( params ) {

        super()

        // construct the material and geometries just in time for the first Block
        if ( !material ) material = createMaterialConstructGeometries()

        params = params || {}

        this.matter = params.hasOwnProperty( "matter" ) ? params.matter : "unknown"
        this.type = params.hasOwnProperty( "type" ) ? params.type : "unknown"

        let x = params.hasOwnProperty( "x" ) ? params.x : 0
        let y = params.hasOwnProperty( "y" ) ? params.y : 0
        let z = params.hasOwnProperty( "z" ) ? params.z : 0

        this.position = new Vector3( x, y, z )

        this.updateMesh(
            params.hasOwnProperty( "char" ) ? params.char : "?",
            params.hasOwnProperty( "width" ) ? params.width : 1,
            params.hasOwnProperty( "height" ) ? params.height : 1,
            params.hasOwnProperty( "depth" ) ? params.depth : 1
        )

        world.add( this )

    }

    get ylevel() {
        return Math.floor( this.position.y )
    }

    updateMesh( char, width, height, depth ) {

        this.char = "" + char
        this.width = width
        this.height = height
        this.depth = depth

        if ( this.mesh ) display.scene.remove( this.mesh )

        this.position.y = Math.floor( this.position.y ) + this.height * 0.5

        this.mesh = new Mesh( createGeometry( this.char, this.width, this.height, this.depth ), material )
        this.mesh.position.copy( this.position )

        display.scene.add( this.mesh )

    }

    update() {

    }

}


const TEXTURESIZE = 256
const GLYPHEDGESIZE = 3
const chars = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_.,-~∼=:;+?#%⁂⨍≋$&@<>()[]{}\/`\'"^*!━╰╭|│╯╮┐┘┌└∩⌐░▒▓▢■'
const size = TEXTURESIZE / Math.sqrt( chars.length )
const lettersperside = Math.ceil( TEXTURESIZE / size )
const uvsize = 1 / lettersperside
const tilesize = uvsize * TEXTURESIZE
const halftile = 0.5 * tilesize
const styles = {}
let material = null

const createMaterialConstructGeometries = () => {

    const canvas = document.createElement( "canvas" )
    canvas.width = canvas.height = TEXTURESIZE

    const ctx = canvas.getContext( "2d" )
    ctx.imageSmoothingEnabled = true

    ctx.font = Math.floor( size * 0.7 ) + "px Monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const alphanumberic = /[a-z0-9]/i

    for ( let i = 0, y = 0; y < lettersperside; y++ ) {

        for ( let x = 0; x < lettersperside; x++ , i++ ) {

            if ( i >= chars.length ) break
            let x1 = ( x / lettersperside ) * TEXTURESIZE
            let y1 = ( y / lettersperside ) * TEXTURESIZE
            let char = chars[ i ]
            let style = styles[ '?' ]

            if ( alphanumberic.test( char ) ) {
                style = styles[ 'alphanumeric' ]
            } else if ( styles.hasOwnProperty( char ) ) {
                style = styles[ char ]
            }

            ctx.fillStyle = style.fill
            ctx.fillRect( x1 + GLYPHEDGESIZE - 0.5, y1 + GLYPHEDGESIZE - 0.5, tilesize - GLYPHEDGESIZE * 2 + 0.5, tilesize - GLYPHEDGESIZE * 2 + 0.5 )

            ctx.beginPath()
            ctx.strokeStyle = style.edge
            ctx.lineWidth = GLYPHEDGESIZE
            ctx.rect( x1 + GLYPHEDGESIZE * 0.5, y1 + GLYPHEDGESIZE * 0.5, tilesize - GLYPHEDGESIZE, tilesize - GLYPHEDGESIZE )
            ctx.stroke()

            ctx.fillStyle = style.glyph
            ctx.fillText( char, Math.round( halftile + x1 ), Math.round( halftile * 0.9 + y1 ) )

        }

    }

    return new MeshPhongMaterial( {
        color: 0xffffff,
        specular: 0x050505,
        map: new CanvasTexture( canvas ),
        transparent: true
    } )

}

const createGeometry = ( char, width, height, depth ) => {

    let i = chars.indexOf( char )
    let x = i % lettersperside
    let y = Math.floor( i / lettersperside )
    let x1 = ( x / lettersperside ) * TEXTURESIZE
    let y1 = ( y / lettersperside ) * TEXTURESIZE

    let uvx1 = ( x1 + 1 ) / TEXTURESIZE
    let uvx2 = ( x1 + tilesize - 2 ) / TEXTURESIZE
    let uvy1 = 1 - ( y1 + tilesize - 2 ) / TEXTURESIZE
    let uvy2 = 1 - ( y1 + 1 ) / TEXTURESIZE

    let geometry = new BoxGeometry( width, height, depth )

    if ( char === "▢" ) return // special char to map entire texture for debuging

    let uvs = geometry.faceVertexUvs[ 0 ]

    for ( let f = 0; f < 12; f++ ) {

        let faceuvs = uvs[ f ]
        //if ( f === 4 || f === 5 ) {
        faceuvs[ 0 ].x = faceuvs[ 0 ].x ? uvx2 : uvx1
        faceuvs[ 0 ].y = faceuvs[ 0 ].y ? uvy2 : uvy1
        faceuvs[ 1 ].x = faceuvs[ 1 ].x ? uvx2 : uvx1
        faceuvs[ 1 ].y = faceuvs[ 1 ].y ? uvy2 : uvy1
        faceuvs[ 2 ].x = faceuvs[ 2 ].x ? uvx2 : uvx1
        faceuvs[ 2 ].y = faceuvs[ 2 ].y ? uvy2 : uvy1
        // } else {
        //     faceuvs[ 0 ].x = faceuvs[ 1 ].x = faceuvs[ 2 ].x = x2
        //     faceuvs[ 0 ].y = faceuvs[ 1 ].y = faceuvs[ 2 ].y = y2
        // }

    }

    return geometry

}

const register = ( char, style ) => {

    styles[ char ] = style

}

register( "?", {
    edge: "rgba( 255, 0, 0, 0.2 )",
    fill: "rgba( 128, 0, 0, 0.5 )",
    glyph: "rgba( 255, 0, 0, 1 )"
} )

register( "alphanumeric", {
    edge: "rgba( 0, 0, 0, 0 )",
    fill: "rgba( 0, 0, 0, 0 )",
    glyph: "rgba( 255, 255, 255, 1 )"
} )

const blockType = {}

const registerBlockType = ( type, class_ ) => {

    blockType[ type ] = class_

}

const createBlock = ( type, params ) => {

    return new blockType[ type ]( params )

}

export { Block, register, registerBlockType, createBlock }
