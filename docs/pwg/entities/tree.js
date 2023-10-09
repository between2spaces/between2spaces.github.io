export function main( server ) {

	server.listen( 'tree', 'update', ( tree, message ) => {

		console.log( server.entityMetadataById[ tree.id ].lastupdate - message.data.timestamp );

		server.scheduleEntityUpdate( tree );

	} );

	server.listen( 'server', 'run', () => {

		server.message( 'server', 'server', 'create', { type: 'tree' }, tree => {

			console.log( tree );

		} );

	} );

}
