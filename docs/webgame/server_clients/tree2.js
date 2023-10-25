import { connect, log } from '../client.js';

const client = {
	id: 'Tree',
	config: ( id ) => {
		log( client );
	},
	update: () => {
		log( 'update...' );
	}
};

connect( client );
