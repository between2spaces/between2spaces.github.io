import * as THREE from 'https://cdn.skypack.dev/three@0.135.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js';
import * as Landscape from './landscape.js';

const worldSize = 100;

const landscapeGeometry = Landscape.generateIslandGeometry( worldSize );

var dirtMaterial = new THREE.MeshStandardMaterial( {
    color: 'brown',
    polygonOffset: true
} );

var dirtMesh = new THREE.Mesh( landscapeGeometry, dirtMaterial );

scene.add( dirtMesh );

var wireframe = new THREE.LineSegments( new THREE.WireframeGeometry( landscapeGeometry ) );
wireframe.material.opacity = 0.25;
wireframe.material.tramorgue/threejs_random_island_generationnsparent = true;
scene.add( wireframe );

var waterGeometry = new THREE.PlaneGeometry( worldSize, worldSize );
var waterMaterial = new THREE.MeshStandardMaterial( { color: 'blue' } );
var waterMesh = new THREE.Mesh( waterGeometry, waterMaterial );
scene.add( waterMesh );

// function dirtTexture( width, height ) {

//     const canvas = document.createElement( 'canvas' );
//     canvas.width = width;
//     canvas.height = height;

//     const context = canvas.getContext( '2d' );
//     context.fillStyle = 'brown';
//     context.fillRect( 0, 0, width, height );

//     const image = context.getImageData( 0, 0, canvas.width, canvas.height );
//     const imageData = image.data;

//     for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {

//         // imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
//         // imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
//         // imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );

//     }

//     context.putImageData( image, 0, 0 );

//     return canvas;

// }

class GenerateIslandDemo {

    constructor( container ) {

        this.renderer = {
            main: new THREE.WebGLRenderer(),
            mini: new THREE.WebGLRenderer( { alpha: true } )
        };

        this.renderer.main.setPixelRatio( window.devicePixelRatio );
        this.renderer.mini.setPixelRatio( window.devicePixelRatio );

        this.renderer.main.setSize( window.innerWidth, window.innerHeight );
        this.renderer.mini.setSize( window.innerWidth * 0.25, window.innerHeight * 0.25 );

        this.renderer.mini.domElement.style.position = 'absolute';
        this.renderer.mini.domElement.style.top = '0';

        container.append( this.renderer.main.domElement );
        container.append( this.renderer.mini.domElement );

        this.lookAt = new THREE.Vector3();

        let aspect = container.offsetWidth / container.offsetHeight;

        this.camera = new THREE.PerspectiveCamera( 90, aspect, 0.1, 1000 );
        this.camera.rotation.y = Math.PI;
        //this.camera.position.z = worldSize;
        //cameraPerspective.position.z = worldSize * 0.5;
        this.helper = new THREE.CameraHelper( this.camera );

        this.scene = new THREE.Scene();
        this.scene.add( this.helper );

        let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        hemiLight.color.setHSL( 0.6, 0.75, 0.5 );
        hemiLight.groundColor.setHSL( 0.095, 0.5, 0.5 );
        hemiLight.position.set( 0, 500, 0 );
        this.scene.add( hemiLight );

        let dirLight = new THREE.DirectionalLight( 0xffffff, 2 );
        dirLight.position.set( - 1, 1, 0 );

        this.scene.add( dirLight );
        this.scene.add( dirLight.shadow.camera );

        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 1024 * 2;

        new OrbitControls( cameraPerspective, mainRenderer.domElement );
        new OrbitControls( cameraOrtho, mainRenderer.domElement );

    }

}

function animate() {

    requestAnimationFrame( animate );

    render();

}

function render() {

    if ( activeCamera === cameraPerspective ) {

        cameraPerspective.far = cameraPerspective.position.length() + worldSize * 0.5;
        cameraPerspective.updateProjectionMatrix();

        cameraPerspectiveHelper.update();
        cameraPerspectiveHelper.visible = true;

        cameraOrthoHelper.visible = false;

    } else {

        cameraOrtho.far = cameraOrtho.position.length() + worldSize * 0.5;
        cameraOrtho.updateProjectionMatrix();

        cameraOrthoHelper.update();
        cameraOrthoHelper.visible = true;

        cameraPerspectiveHelper.visible = false;

    }

    cameraRig.lookAt( lookAt );

    //renderer.clear();

    activeHelper.visible = false;

    //mainRenderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    mainRenderer.render( scene, activeCamera );

    activeHelper.visible = true;

    //minimapRenderer.setViewport( screenWidth / 2, screenHeight / 2, screenWidth / 2, screenHeight / 2 );
    minimapRenderer.render( scene, this.camera.mini );

}

animate();

