import { connect, call, map } from '../servernode.js';


connect( {
	name: 'Tree',
	properties: [ 'age', 'weight' ],
	default_values: [ 0, 1 ],
	config: () => {

		treeMap = map( 'Tree' );

		call( 'Entity', 'create', 'Tree', tree => {

			console.log( 'Created ', tree );
			treeMap.age( tree, 3 );
			console.log( 'Tree age is', treeMap.age( tree ) );

		} );

	},
	update: () => {

		for ( let id in trees ) {

			console.log( 'update...', trees[ id ] );

		}

	},
	entity: ( entity ) => {

		if ( 'Tree' === entity[ 1 ] ) trees[ entity[ 0 ] ] = entity;

	},
} );


const trees = {};

let treeMap;

