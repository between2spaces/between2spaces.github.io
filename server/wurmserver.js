import Server from './server.js';


class WurmServer extends Server {

	onNewEntity( entity ) {

	}


	onConnect( client ) {

	}


	onDisconnect( client ) {

	}

}


const server = new WurmServer( [ 'http://localhost:8000', 'https://between2spaces.github.io' ] );

