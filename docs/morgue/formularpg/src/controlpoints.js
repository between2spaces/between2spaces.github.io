import { three } from "./display.js";
import { generateUUID } from "./math.js";

const controlpoints = {}

controlpoints.selected = null;
controlpoints.hovered = null;

controlpoints.list = [];


controlpoints.add = ( point, afterControlPoint ) => {

    let geometry = new THREE.CubeGeometry( 0.5, 0.5, 0.5 );

    let material = new THREE.MeshLambertMaterial( {
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5
    } );

    let mesh = new THREE.Mesh( geometry, material );

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    mesh.position.set( point.x, point.y, 0 );

    three.add( mesh );

    let insertAt = 0;

    if ( afterControlPoint ) {

        insertAt = controlpoints.list.indexOf( afterControlPoint ) + 1;

    }

    controlpoints.list.splice( insertAt, 0, mesh );

}

controlpoints.setSelected = controlpoint => {

    if ( controlpoint && controlpoint === controlpoints.selected ) {

        return controlpoints.selected;

    }

    if ( controlpoints.selected ) {

        controlpoints.selected.material.color.set( 0x00ff00 );

    }

    controlpoints.selected = controlpoint;

    if ( controlpoints.selected ) {

        controlpoints.selected.material.color.set( 0xff0000 );

    }

    return controlpoints.selected;

}



controlpoints.setHovered = controlpoint => {

    if ( controlpoint && controlpoint === controlpoints.hovered ) {

        return controlpoints.hovered;

    }

    if ( controlpoints.hovered && controlpoints.hovered !== controlpoints.selected ) {

        controlpoints.hovered.material.color.set( 0x00ff00 );

    }

    controlpoints.hovered = controlpoint;

    if ( controlpoints.hovered && controlpoints.hovered !== controlpoints.selected ) {

        controlpoints.hovered.material.color.set( 0xffff00 );

    }

    return controlpoints.hovered;

}


export default controlpoints;

