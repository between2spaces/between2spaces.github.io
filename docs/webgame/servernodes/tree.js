import { connect, call, propertiesOf } from '../servernode.js';

connect( {
	name: 'Tree',
	properties: [ 'age', 'weight' ],
	default_values: [ 0, 1 ],
	config: async ( self ) => {

		const treeProperty = ( self.treeProperty = await propertiesOf( 'Tree' ) );

		let tree = await call( 'Entity', 'create', 'Tree' );

		console.log(
			`New tree ${tree[ treeProperty.id ]} weight is ${tree[ treeProperty.weight ]}`
		);

	},
	update: ( self ) => {

		for ( let id in trees ) {

			console.log( 'update...', trees[ id ] );

		}

	},
	entity: ( self, entity ) => {

		console.log( 'Tree.entity...', entity );
		//if ( 'Tree' === entity[ 1 ] ) trees[ entity[ 0 ] ] = entity;

	},
} );

const trees = {};
