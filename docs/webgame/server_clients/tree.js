import { connect } from '../client.js';

connect({
	id: 'Tree',
	listen: (connection) => {
		connection.log('listen...');
	},
	update: (connection) => {
		connection.log('update...');
	},
})
	.then((connection) => {
		connection.log(`Resolved`);
	})
	.catch((connection, error) => {
		connection.log(`Rejected error: ${error}`);
	});
