import { connect, log } from '../client.js';

const client = {
	id: 'Tree',
	resolve: () => {
		log( client.id, `Resolved` );
	},
	reject: ( error ) => {
		log( client.id, `Rejected error: ${error}` );
	},
	listen: () => {
		log( client.id, 'listen...' );
	},
	update: () => {
		log( client.id, 'update...' );
	}
};

connect( client );
