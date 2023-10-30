import { connect, log, call } from '../client.js';

const debug = 'Tree2';

const client = {
	id: 'Tree2',
	resolve: () => {
		log( client.id, `Resolve debug=${debug}` );
		call( client, 'Tree1', 'testFn', 'Some data' );
	},
	reject: ( error ) => {
		log( client.id, `Reject error: ${error}` );
	},
	listen: () => {
		log( client.id, 'listen...' );
	},
	update: () => {
		log( client.id, 'update...' );
	}
};

connect( client );
