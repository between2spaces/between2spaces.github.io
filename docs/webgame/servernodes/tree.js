import { connect, call } from '../servernode.js';

connect( {
	name: 'Tree',
	properties: [ 'age', 'weight' ],
	default_values: [ 0, 1 ],
	config: () => {

		call( 'Entity', 'create', 'Tree' );

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
