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
		connection
			.properties('Tree')
			.then((connection, treeProp) => connection.log(treeProp))
			.catch((connection, error) => connection.log(error));
	})
	.catch((connection, error) => {
		connection.log(`Rejected error: ${error}`);
	});
