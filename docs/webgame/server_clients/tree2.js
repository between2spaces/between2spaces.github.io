import * as Client from '../CommonClient.js';

const client = {
	id: 'Tree',
	config: ( id ) => {
		Client.log( client );
	},
	update: () => {
		Client.log( 'update...' );
	}
};

Client.connect( client );
