import { connect, log } from '../client.js';

const debug = 'Tree1';

const client = {
	id: 'Tree1',
	resolve: () => {
		log( client.id, `Resolve debug=${debug}` );
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
