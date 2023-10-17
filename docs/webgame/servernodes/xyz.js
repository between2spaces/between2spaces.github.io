import { connect, call } from '../servernode.js';

connect( {
	name: 'Xyz',
	dependencies: [ 'Tree' ],
} );
