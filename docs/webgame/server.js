import fs from 'fs';
import { WebSocketServer } from 'ws';

/* Configuration */
const serverConfig = {
	port: process.env.PORT,
	allowedOrigins: [undefined, 'http://localhost:8000'],
};

/* WebSocket server initialization */
const wss = new WebSocketServer({
	port: serverConfig.port,
	verifyClient: (info) =>
		serverConfig.allowedOrigins.includes(info.req.headers.origin),
});

/* Client data management */
const clients = {};
const awaiting = {};

/* Entity data management */
const propertiesByType = {};
const defaultsByType = {};
const valuesById = {};
const listeners = [];

let nextClientId = 0;
let nextEntityId = 0;

/* Error messages */
const ERROR = {
	NOVALIDPROTOCOL: 'Failed to connect. No valid protocol.',
	CLIENTID_INUSE: (id) =>
		`Failed to connect. Client id '${id}' already in use.`,
};

/* Handle a new WebSocket connection */
function handleConnection(ws, req)
{
	const protocol = req.headers['sec-websocket-protocol'];
	const swp = protocol ? protocol.split(',') : [];

	if (swp.length === 0) {
		return handleConnectionError(ws, ERROR.NOVALIDPROTOCOL);
	}
./index.html
./x.js
./server.js
./servernodes/tree.js
./servernodes/xyz.js
./NodeClient.js
./newer_commonclient.js
./um.ss
./node_modules/.package-lock.json
./node_modules/ws/LICENSE
./node_modules/ws/browser.js
./node_modules/ws/wrapper.mjs
./node_modules/ws/package.json
./node_modules/ws/README.md
./node_modules/ws/lib/extension.js
./node_modules/ws/lib/receiver.js
./node_modules/ws/lib/buffer-util.js
./node_modules/ws/lib/sender.js
./node_modules/ws/lib/limiter.js
./node_modules/ws/lib/subprotocol.js
./node_modules/ws/lib/validation.js
./node_modules/ws/lib/constants.js
./node_modules/ws/lib/stream.js
./node_modules/ws/lib/websocket.js
./node_modules/ws/lib/websocket-server.js
./node_modules/ws/lib/event-target.js
./node_modules/ws/lib/permessage-deflate.js
./node_modules/ws/index.js
./package.json
./.env
./server_clients/tree.js
./server_clients/test.js
./old_servernode.js
./old_client.js
./client.js
./package-lock.json

	let id = swp.shift();

	if (id==='$') id = `c${nextClientId++}`;

	if (clients[id]) {
		return handleConnectionError(ws, ERROR.CLIENTID_INUSE(id));
	}

	ws.id = id;
	ws.addEventListener('message', (msg) => handleSocketMessage(ws, msg.data));
	ws.addEventListener('close', () => handleSocketClose(ws.id));

	processProtocolSettings(ws, swp);
}

/* Handle connection error */
function handleConnectionError(ws, message) {
	send(ws, 'connection', message, false);
	ws.close();
}

/* Handle the WebSocket connection close event of a specific client */
function handleSocketClose(id) {
	log(`Client '${id}' connection closed.`);
}

/* Process WebSocket protocol settings */
function processProtocolSettings(ws, settings) {
	let dependencies = [];

	propertiesByType[ws.id] = ['id', 'type'];
	defaultsByType[ws.id] = [];

	settings.forEach((setting) => {
		const [type, ...params] = setting.split('_');

		switch (type.trim()) {
		case 'dependencies':
			params.forEach(
				(id) => clients[id] !== undefined && dependencies.push(id)
			);
			break;
		case 'properties':
			propertiesByType[ws.id].push(...setting);
			break;
		case 'defaults':
			defaultsByType[ws.id].push(...setting);
			break;
		case 'listen':
			listeners.push(ws.id);
			break;
		}
	});

	if (dependencies.length === 0) {
		clients[ws.id] = { ws };
		send(ws, 'connection', ws.id);
	}

	processClientsAwaitingDependencies(ws.id);

	if (dependencies.length > 0) {
		awaiting[ws.id] = { ws, dependencies };
	}
}

function processClientsAwaitingDependencies(connectingId) {
	for (let id in awaiting) {
		let [ws, dependencies] = awaiting[id];
		const index = dependencies.indexOf(connectingId);

		if (index > -1) {
			dependencies.splice(index, 1);
		}

		if (dependencies.length === 0) {
			delete awaiting[id];
			send(ws, 'connection', id);
		}
	}
}

/* Handle incoming WebSocket messages for a specific client */
function handleSocketMessage(ws, message) {
	log(`Received: '${message}'`);

	const messages = message.toString().split(';');

	messages.forEach((msg) => {
		const [id, callbackId, fn, success, ...args] = msg.split('_');

		if (id === 'Entity') {
			handleEntityMessage(ws, callbackId, fn, args);
		} else if (clients[id] === undefined) {
			return log(`Error: Unknown message target '${id}'`);
		}

		send(ws, fn, args, success, ws.id, callbackId);
	});
}

/* Handle a message directed at Entity */
function handleEntityMessage(ws, callbackId, fn, args) {
	if (Entity[fn] === undefined) {
		return log(`${fn} is not a Entity function`);
	}

	const returnValue = Entity[fn](args);

	if (callbackId) {
		return send(ws, callbackId, returnValue);
	}

	send(ws, callbackId, `Unknown fuction Entity.${fn}`, false);
}

/* Log messages to the console with a custom prefix and color */
function log(...args) {
	console.log('\x1b[33mserver:', ...args, '\x1b[0m');
}

/* Sends a message to the WebSocket with the specified parameters */
function send(
	ws,
	fn,
	args = '',
	success = true,
	callerId = '',
	callbackId = ''
) {
	args = args ? (Array.isArray(args) ? '_' + args.join('_') : `_${args}`) : '';
	console.log(
		`${ws.id} <- ${callerId}_${callbackId}_${fn}_${success ? '' : '1'}${args}`
	);
	ws.send(`${callerId}_${callbackId}_${fn}_${success ? '' : '1'}${args}`);
}

const Entity = {
	delta: '',
	create: (args) => {
		const type = args.shift();
		const id = 'e' + nextEntityId++;
		const typeDefaults = defaultsByType[type];
		const values = new Array(typeDefaults.length + 2);
		const delta = `e_${id}_1_${type}`;

		values[0] = id;
		values[1] = type;

		for (let i = 0; i < typeDefaults.length; i++) {
			let value = (values[i + 2] = i < args.length ? args[i] : typeDefaults[i]);
			delta += `_${i + 2}_${value}`;
		}

		valuesById[id] = values;
		Entity.delta += delta;
		return values;
	},

	properties: (args) => {
		return propertiesByType[args[0]];
	},
};

wss.on('connection', handleConnection);

fs.readdir('./server_clients/', (err, files = []) => {
	if (err) {
		return log(err.message);
	}

	for (const file of files) {
		file.endsWith('.js') && import(`./server_clients/${file}`);
	}
});

setInterval(() => {
	const delta = Entity.delta;

	Entity.delta = '';

	if (delta.length === 0) {
		return;
	}

	for (let id of listeners) {
		send(clients[id].ws, 'delta', delta);
	}
}, 1000);
