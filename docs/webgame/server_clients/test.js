import { connect, log, properties } from '../client.js';

const client = {
	resolve: async () => {
		log(client.id, `Resolved`);
		properties(client, 'Treex')
		.then(treeProp => log(client.id, treeProp))
		.catch(error => log(client.id, error));
	},
	reject: (error) => {
		log(client.id, `Rejected error: ${error}`);
	},
	listen: () => {
		log(client.id, 'listen...');
	},
	update: () => {
		log(client.id, 'update...');
	},
};

connect(client);
