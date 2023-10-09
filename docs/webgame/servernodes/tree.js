import { connect, uuid, call } from '../server.js';

let Tree;

connect( Tree = {
	id: 'Tree',
	connected: connected,
} );

function connected( args ) {

	call( Tree, 'Entity', 'create', [ 'Tree', 'age', '0', 'weight', '100' ], res => {

		const entityId = res[ 0 ];

		call( Tree, 'Entity', 'properties', entityId, res => {

			if ( 'error' === res[ 0 ] ) return console.error( res[ 1 ] );

			console.log( res );

		} );

		call( Tree, 'Entity', 'values', entityId, res => {

			if ( 'error' === res[ 0 ] ) return console.error( res[ 1 ] );

			console.log( res );

		} );

	} );

}
