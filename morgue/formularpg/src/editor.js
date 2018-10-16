import { element, attrib, style, content } from "./ui.js";
import { input, isDown, wasDown, hasChanged } from "./input.js";
import { three, camera, global } from "./display.js";
import * as THREE from "./three.module.js";
import Track from "./track.js";
import canvastexture from "./canvastexture.js";
import { listen, announce } from "./event.js";


export const editor = {};



editor.init = () => {

    let geometry = new THREE.PlaneGeometry( 1, 1 );

    editor.ground = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( {

        map: canvastexture( 64, 64, ctx => {

            ctx.strokeStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo( 0, 0 );
            ctx.lineTo( 0, 64 );
            ctx.lineTo( 64, 64 );
            ctx.stroke();

        }, texture => {

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 20, 20 );

        } ),

        transparent: true,
        opacity: 0.99,
        side: THREE.DoubleSide,
        alphaTest: 0.1

    } ) );

    editor.ground.receiveShadow = true;
    editor.ground.scale.set( 20, 1, 20 );
    editor.ground.rotateX( - 0.5 * Math.PI );
    three.add( editor.ground );

    let panel = element( "panel", "div", document.body );
    style( panel, { position: "absolute", bottom: 0, color: "white" } );

    element( "mouseX", "span", panel );
    content( element( null, "span", panel ), ", " );
    element( "mouseY", "span", panel );

    content( element( null, "span", panel ), " | " );

    editor.track = Track();


};



editor.update = () => {

    global.update();

};



const getGroundIntersection = () => {

    let intersections = raycaster.intersectObject( editor.ground, true );

    if ( intersections.length ) {

        return intersections[ 0 ];

    }

}
