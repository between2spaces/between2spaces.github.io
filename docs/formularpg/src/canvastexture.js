import * as THREE from "./three.module.js";

const canvastexture = ( id, size, draw, texture ) => {

    let canvas = document.createElement( 'canvas' );

    canvas.width = canvas.height = size;

    let ctx = canvas.getContext( '2d' );

    draw( ctx );

    let tex = new THREE.Texture( canvas );

    if ( texture ) {

        texture( tex );

    }

    tex.needsUpdate = true;

    return tex;

}

export default canvastexture;
