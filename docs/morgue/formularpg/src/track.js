import canvastexture from "./canvastexture.js";
import CardinalSpline from "./cardinalspline.js";
import * as THREE from "./three.module.js";
import { three } from "./display.js";
import { listen, announce } from "./event.js";

const Track = () => {

    let track = {
        spline: CardinalSpline()
    }

    track.spline.showControls = true;

    ( track => {

        listen( track.spline, "addControl", () => {
            
            CardinalSpline.updatePoints( track.spline, true );

            Track.updateMesh( track );

        } );

        listen( Track, "materialReady", () => {
            
            Track.updateMesh( track );

        } );

    } )( track );

    CardinalSpline.addControl( track.spline, new THREE.Vector3( 0, 0, 3 ) );
    CardinalSpline.addControl( track.spline, new THREE.Vector3( 3, 0, - 3 ) );
    CardinalSpline.addControl( track.spline, new THREE.Vector3( - 3, 0, - 3 ) );

    return track;

}



Track.updateMesh = track => {

    if ( ! material ) {
        
        return;

    }

    
    let geometry = new THREE.Geometry();

    for ( let index in track.spline.points ) {

        let vector = track.spline.points[ index ];
        
        //let perpendicular = new THREE.Vector3();
        //let up = new THREE.Vector3( 0, 0, 1 );
        //perpendicular.crossVectors( vector, up );

        var sphere = new THREE.SphereGeometry( 0.1, 8, 8 );
        let mesh = new THREE.Mesh( sphere );

        mesh.position.set( vector.x, vector.y, vector.z );

        mesh.updateMatrix();

        geometry.mergeMesh( mesh );

    }

    if ( track.mesh ) {

        three.remove( track.mesh );

    }

    track.mesh = new THREE.Mesh( geometry, material );
    track.mesh.receiveShadow = true;
    three.add( track.mesh );

};




let material;

( new THREE.TextureLoader() ).load(

    'track.png',

    function ( texture ) {

        material = new THREE.MeshLambertMaterial( {
            map: texture,
            transparent: true,
            opacity: 0.99,
            side: THREE.DoubleSide,
            alphaTest: 0.1
        } );

        announce( Track, "materialReady" );

    }

);


export default Track;
