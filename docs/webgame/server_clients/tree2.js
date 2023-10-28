import { connect, log } from '../client.js';

const client = {
	id: 'Tree',
	config: () => {
	},
	update: () => {
		log( client.id, 'update...' );
	}
};

connect( client );
