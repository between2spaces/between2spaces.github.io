import * as THREE from 'https://cdn.skypack.dev/three@0.135.0/build/three.module.js';
import { openSimplexNoise } from './openSimplexNoise.js';

export function generateIslandGeometry( diameter = 128, seed = Date.now() ) {

	const noise = openSimplexNoise( seed );

	const islandSphereRadius = diameter * 0.5;
	const islandSphereRadiusSq = islandSphereRadius * islandSphereRadius;
	const islandSphereRadiusSqrt = Math.sqrt( islandSphereRadius );

	const octaves = [
		{ frequency: 0.03, amplitude: 6 },
		{ frequency: 0.1, amplitude: 1.5 }
	];

	const flattenFactor = 0.03;

	const geometry = new THREE.PlaneBufferGeometry( diameter, diameter, diameter, diameter );

	var position = geometry.getAttribute( 'position' );

	const vertex = new THREE.Vector3();

	for ( let vertexIndex = 0; vertexIndex < position.count; vertexIndex ++ ) {

		vertex.fromBufferAttribute( position, vertexIndex );

		var zSq = flattenFactor * ( islandSphereRadiusSq - vertex.x * vertex.x - vertex.y * vertex.y );// - islandSphereRadius + 3;
		var z = ( zSq < 0 ) ? - Math.sqrt( - zSq ) : Math.sqrt( zSq );
		z -= islandSphereRadiusSqrt;

		for ( let o of octaves ) {

			z += noise.noise2D( vertex.x * o.frequency, vertex.y * o.frequency ) * o.amplitude;

		}

		position.array[ vertexIndex * 3 + 2 ] = z;

	}

	geometry.computeVertexNormals();

	return geometry;

}
