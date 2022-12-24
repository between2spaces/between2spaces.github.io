import info from "./info.js";
import { input, isDown, wasDown, hasChanged } from "./input.js";
import { listen, announce } from "./event.js";
import * as THREE from "./three.module.js";
import { OrbitControls } from "./OrbitControls"


let canv = document.getElementsByTagName("canvas")[0];
let w = canv.clientWidth;
let h = canv.clientHeight;

const renderer = new THREE.WebGLRenderer({canvas:canv});
renderer.setSize( w, h );
renderer.setClearColor(new THREE.Color(0xeeeeee), 1);

const three = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 70, w / h, 0.01, 1000 );
camera.position.set( 0, 5, 10 );



listen( window, "resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}, 100 );


let current;
let mouseIntersects;

export const global = {};


global.init = () => {

    if ( ! global.light ) {

        global.light1 = new THREE.DirectionalLight( 0xffeeee, 0.7 );
        global.light1.position.set( 1, 1, 1 );
        
        global.light2 = new THREE.DirectionalLight( 0xffffff, 0.3 );
        global.light2.position.set( - 1, - 1, 1 );
        
        global.light3 = new THREE.DirectionalLight( 0xffffff, 0.1 );
        global.light3.position.set( - 1, - 1, - 0.5 );

        global.controls = new OrbitControls( camera, renderer.domElement );
        //global.controls.enableRotate = true;
        //global.controls.mouseButtons.ORBIT = THREE.MOUSE.MIDDLE;

    }
    
    var cube = new THREE.Mesh(
        new THREE.CubeGeometry( 5, 5, 5 ),
        new THREE.MeshLambertMaterial( { color: 0xFF0000 } )
    );
    three.add( cube );

    three.add( global.light1 );
    three.add( global.light2 );
    three.add( global.light3 );

    var axisHelper = new THREE.AxisHelper( 5 );
    three.add( axisHelper );


    const raycaster = new THREE.Raycaster();
    const mouseprojected = new THREE.Vector2();

    listen( window, "mousemove", event => {

        mouseprojected.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouseprojected.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        raycaster.setFromCamera( mouseprojected, camera );

        var intersects = raycaster.intersectObjects( three.children );

        if ( intersects.length ) {

            if ( mouseIntersects && mouseIntersects !== intersects[ 0 ].object ) {
                announce( mouseIntersects, "mouseNoLongerIntersects" );
                //mouseIntersects.material.color.set( 0xffffff );
            }
            mouseIntersects = intersects[ 0 ].object;
            //mouseIntersects.material.color.set( 0x00ff00 );
            announce( mouseIntersects, "mouseIntersects" );

        } else {
            if ( mouseIntersects ) {
                announce( mouseIntersects, "mouseNoLongerIntersects" );
                //mouseIntersects.material.color.set( 0xffffff );
            }
            mouseIntersects = null;
        }

    } );

};

var clock = new THREE.Clock();

global.update = () => {

    var dt = clock.getDelta();
    global.controls.update( dt );

};


export const scene = newScene => {

    for ( let i = three.children.length - 1; i >= 0 ; i -- ) {

        let child = three.children[ i ];

        three.remove( child );

    }

    if ( newScene !== global ) {

        global.init();

    }

    current = newScene;
    current.init();

};


scene( global );


const animate = time => {

    requestAnimationFrame( animate );

    info( "elapsed", time - info( "time" ) );
    info( "time", time );

    global.update();
    current.update();
    renderer.render( three, camera );

};

animate( 0 );

export { renderer, three, camera };
