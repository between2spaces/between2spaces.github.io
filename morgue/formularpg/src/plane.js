
const plane = ( size, draw, texture ) => {

    let canvas = document.createElement( 'canvas' );

    canvas.width = canvas.height = size;

    let ctx = canvas.getContext( '2d' );

    draw( ctx );

    let tex = new THREE.Texture( canvas );

    if ( texture ) {

        texture( tex );

    }

    tex.needsUpdate = true;

    let geometry = new THREE.PlaneGeometry( 1, 1 );

    let material = new THREE.MeshLambertMaterial( {
        map: tex,
        transparent: true,
        opacity: 0.99,
        side: THREE.DoubleSide,
        alphaTest: 0.1
    } );

    let mesh = new THREE.Mesh( geometry, material );

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;

}

export default plane;
