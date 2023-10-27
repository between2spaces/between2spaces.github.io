import { connect, log } from '../client.js';

const client = {
	id: 'Tree',
	config: () => {
		log( client );
	},
	update: () => {
		log( 'update...' );
	}
};

connect( client );
