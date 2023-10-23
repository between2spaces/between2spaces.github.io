import * as Client from '../CommonClient.js';

const client = {
	update: () => {
		console.log( 'update...' );
	}
};

Client.connect( client );
