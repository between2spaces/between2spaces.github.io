import { connect, log, properties } from '../client.js';

const client = {
	resolve: () => {
		log(client.id, `Resolved`);
		properties('Tree');
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
