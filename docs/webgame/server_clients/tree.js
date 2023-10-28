import { connect, log } from '../client.js';

const client = {
	id: 'Tree',
	config: () => {
	},
	listen: () => {
		log( client.id, 'listen...' );
	}
};

connect( client );
