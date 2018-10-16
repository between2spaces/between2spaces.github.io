let text = ( str, r, g, b ) => {

    if ( ! texture ) {

        let canvas = document.createElement( 'canvas' );

        canvas.width = canvas.height = 1024;

        let g = canvas.getContext( '2d' );

        g.font = 'Bold ' + ( canvas.height / rows ) + 'px monospace';
        g.fillStyle = 'white';

        charArray.forEach( ( c, i ) => {

            g.fillText( c, ( 0.1 * canvas.width / columns ) + ( i % columns ) * ( canvas.width / columns ), ( 0.8 * canvas.height / rows ) + ~~ ( i / columns ) * ( canvas.height / rows ) );

        } );

        texture = new THREE.Texture( canvas );
        texture.needsUpdate = true;

    }



    let group = new THREE.Group();

    let x = - 0.5 * ( str.length - 1 );


    for ( let index in str ) {

        let char = str.charAt( index );

        let i = charArray.indexOf( char );
        let u = 0.004 + ( i % columns ) / columns;
        let v = 0.986 - ( ~~ ( i / columns ) / rows );

        let geometry = new THREE.PlaneBufferGeometry( 1, 1 );
        let uvs = geometry.attributes.uv.array;

        uvs[ 0 ] = u; uvs[ 1 ] = v;
        uvs[ 2 ] = u + w; uvs[ 3 ] = v;
        uvs[ 4 ] = u; uvs[ 5 ] = v - h;
        uvs[ 6 ] = u + w; uvs[ 7 ] = v - h;

        geometry.attributes.uv.needsUpdate = true;

        let material = new THREE.MeshLambertMaterial( {
            map: texture,
            transparent: true,
            opacity: 0.99,
            side: THREE.DoubleSide,
            alphaTest: 0.1
        } );

        material.color.r = ( typeof r === "undefined" ) ? 1 : r;
        material.color.g = ( typeof g === "undefined" ) ? 1 : g;
        material.color.b = ( typeof b === "undefined" ) ? 1 : b;

        let mesh = new THREE.Mesh( geometry, material );

        mesh.receiveShadow = true;
        mesh.castShadow = true;

        mesh.position.x = x ++;

        group.add( mesh );

    }

    return group;

}

const columns = 12;
const rows = 8;

const w = 1.0 / ( columns + 1 );
const h = 1.0 / ( rows + 1 );

const charArray = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789~`!@#$%^&*()_+-={}|[]\\:";\'<>?,./ '.split( '' );

let texture;

export default text;
