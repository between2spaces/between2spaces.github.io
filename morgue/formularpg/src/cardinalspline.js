import { listen, announce } from "./event.js";
import * as THREE from "./three.module.js";
import { three } from "./display.js";

const CardinalSpline = () => {

    return {
        controls: [],
        points: [],
        showControls: false
    }

}

/**
 * Recalculates the points array from the current controls.
 * @param {CardinalSpline} cardinalspline
 * @param {Vector3} vector3
 * @param {Vector3} insertBefore
 */
CardinalSpline.addControl = ( cardinalspline, vector3, insertBefore ) => {

    let insertAt = cardinalspline.controls.length;

    if ( insertBefore ) {

        insertAt = cardinalspline.controls.indexOf( insertBefore );

        if ( insertAt === - 1 ) {

            insertAt = cardinalspline.controls.length;

        }

    }

    let controlpoint = vector3.clone();

    if ( cardinalspline.showControls ) {

        let geometry = new THREE.CubeGeometry( 0.5, 0.5, 0.5 );

        let material = new THREE.MeshLambertMaterial( {
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        } );

        controlpoint = new THREE.Mesh( geometry, material );

        controlpoint.receiveShadow = true;
        controlpoint.castShadow = true;

        controlpoint.position.set( vector3.x, vector3.y, vector3.z );

        three.add( controlpoint );

        ( controlpoint => {

            listen( controlpoint, "mouseIntersects", () => {

                console.log( controlpoint.uuid );

                controlpoint.material.color.set( 0x00ff00 );

            } );

        } )( controlpoint );

    }

    cardinalspline.controls.splice( insertAt, 0, controlpoint );

    announce( cardinalspline, "addControl" );

}


/**
 * Recalculates the points array from the current controls.
 * @param {CardinalSpline} cardinalspline
 * @param {boolean=false} closed
 * @param {number=0.5} tension
 * @param {number=25} numOfSeg
 */
CardinalSpline.updatePoints = ( cardinalspline, closed, tension, numOfSeg ) => {

    cardinalspline.points = [];

    // given nothing return nothing

    if ( cardinalspline.controls.length === 0 ) return [];

    // given one point, just return it

    if ( cardinalspline.controls.length === 1 ) {

        cardinalspline.points.push( cardinalspline.controls[ 0 ].clone() );

        return;

    }

    // options or defaults

    tension = ( typeof tension === "number" ) ? tension : 0.5;
    numOfSeg = ( typeof numOfSeg === "number" ) ? numOfSeg : 25;

    // clone points array

    let controls = cardinalspline.controls.slice( 0 );

    let index = 0;
    let cache = new Float32Array( ( numOfSeg + 2 ) * 4 );
    let cacheindex = 4;

    if ( closed ) {

        // insert end point as first point and first point as last point

        controls.unshift( cardinalspline.controls[ cardinalspline.controls.length - 1 ] );
        controls.push( cardinalspline.controls[ 0 ] );
        controls.push( cardinalspline.controls.length > 1 ? cardinalspline.controls[ 1 ] : cardinalspline.controls[ 0 ] );

    } else {

        // duplicate first and last points

        controls.unshift( cardinalspline.controls[ 0 ] );
        controls.push( cardinalspline.controls[ cardinalspline.controls.length - 1 ] );

    }

    // cache inner-loop calculations as they are based on t alone

    cache[ 0 ] = 1;

    for ( let i = 1 ; i < numOfSeg; i ++ ) {

        let st = i / numOfSeg;
        let st2 = st * st;
        let st3 = st2 * st;
        let st23 = st3 * 2;
        let st32 = st2 * 3;

        cache[ cacheindex ++ ] = st23 - st32 + 1;      // c1
        cache[ cacheindex ++ ] = st32 - st23;          // c2
        cache[ cacheindex ++ ] = st3 - 2 * st2 + st;   // c3
        cache[ cacheindex ++ ] = st3 - st2;            // c4

    }

    cache[ ++ cacheindex ] = 1;

    // calc. points

    for ( let i = 1; i < controls.length - 2; i ++ ) {

        let pt0, pt1, pt2, pt3;
        
        if ( controls[ i ].hasOwnProperty( "position" ) ) {

            pt0 = controls[ i - 1 ].position;
            pt1 = controls[ i ].position;
            pt2 = controls[ i + 1 ].position;
            pt3 = controls[ i + 2 ].position;

        } else {

            pt0 = controls[ i - 1 ];
            pt1 = controls[ i ];
            pt2 = controls[ i + 1 ];
            pt3 = controls[ i + 2 ];

        }

        let t1 = new THREE.Vector3(
            ( pt2.x - pt0.x ) * tension,
            ( pt2.y - pt0.y ) * tension,
            ( pt2.z - pt0.z ) * tension
        );

        let t2 = new THREE.Vector3(
            ( pt3.x - pt1.x ) * tension,
            ( pt3.y - pt1.y ) * tension,
            ( pt3.z - pt1.z ) * tension
        );

        let c = 0;

        for ( let t = 0; t < numOfSeg; t ++ ) {

            let c1 = cache[ c ++ ];
            let c2 = cache[ c ++ ];
            let c3 = cache[ c ++ ];
            let c4 = cache[ c ++ ];

            cardinalspline.points[ index ++ ] = new THREE.Vector3(
                c1 * pt1.x + c2 * pt2.x + c3 * t1.x + c4 * t2.x,
                c1 * pt1.y + c2 * pt2.y + c3 * t1.y + c4 * t2.y,
                c1 * pt1.z + c2 * pt2.z + c3 * t1.z + c4 * t2.z
            );
            
        }

    }

    announce( cardinalspline, "updatePoints" );

};


export default CardinalSpline;
