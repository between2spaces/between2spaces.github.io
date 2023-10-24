import * as Client from '../CommonClient.js';

const client = {
	id: 'Tree',
	config: ( id ) => {
		Client.log( client, client );
	},
	update: () => {
		Client.log( client, 'update...' );
	}
};

Client.connect( client );