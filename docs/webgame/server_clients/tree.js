import { connect, log } from '../client.js';

const client = {
	config: () => {
		log( client );
	},
	update: () => {
		log( 'update...' );
	}
};

connect( client );
