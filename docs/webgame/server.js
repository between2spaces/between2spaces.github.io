import fs from 'fs';
import crypto from 'crypto';
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
const callbacks = {};

/* Entity data management */
const propertiesByType = {};
const defaultsByType = {};
const valuesById = {};
const listeners = [];

let dirtyById = {};
let nextClientId = 0;
let nextEntityId = 0;

/* Error messages */
const ERROR = {
  NOVALIDPROTOCOL: (id) => `${id}__connection_1_Failed to connect. No valid protocol.`,
  CLIENTID_INUSE: (id) => `${id}__connection_1_Failed to connect. Client id '${id}' already in use.`,
};

/* Handle a new WebSocket connection */
function handleConnection(ws, req) {

	const protocol = req.headers['sec-websocket-protocol'];
	const swp = protocol ? protocol.split(',') || [];

  if (swp.length === 0) {
    return handleConnectionError(ws, ERROR.NOVALIDPROTOCOL(id));
  }

	const id = swp.shift() || `c${nextClientId++}`;

	if (clients[id] ) {
		return handleConnectionError(ws, ERROR.CLIENTID_INUSE(id));
	}

	ws.id = id;
	ws.addEventListener('message', (msg) => handleSocketMessage(ws, msg));
	ws.addEventListener('close', () => handleSocketClose(ws.id));

	processProtocolSettings(ws, swp);

}

/* Handle connection error */
function handleConnectionError(ws, message) {
	ws.send(message);
	ws.close();
}

/* Handle the WebSocket connection close event of a specific client */
function handleSocketClose(id) {
	log(`Client '${id}' connection closed.`);
}

/* Process WebSocket protocol settings */
function processProtocolSettings(ws, settings) {

	const awaitingList = [];

	propertiesByType[ws.id] = ['id', 'type'];
	defaultsByType[ws.id] = [];

	settings.forEach((setting) => {
		const [type, ...params]  = setting.split('_');

		switch (type.trim()) {
			case 'dep':
				params.forEach((id) => !clients[id] && awaitingList.push(id));
				break;
			case 'prop':
				propertiesByType[ws.id].push(...setting);
				break;
			case 'def':
				defaultsByType[ws.id].push(...setting);
				break;
			case 'ent':
				listeners.push(ws.id);
				break;
		}
	});

	if (awaitingList.length) {
		clients[ws.id] = { ws };
		return ws.send(`${ws.id}__connection__${ws.id}`);
	}

	for (let id in awaiting) {
		const dependencies = awaiting[id];
		const index = dependencies.indexOf(ws.id);

		if (index > -1) {
			dependencies.splice(index, 1);
		}

		if (dependencies.length === 0) {
			delete awaiting[id];
			clients[id].ws.send(`${id}__connection__${id}`);
		}
	}

	awaiting[ws.id] = awaitingList;

}

/* Handle incoming WebSocket messages for a specific client */
function handleSocketMessage(ws, message) {
	log(`Received: '${message}'`);

	const messages = message.toString().split(';')

	messages.forEach((msg) => {
		const [id, callbackId, fn, ...args] = msg.split('_');

		if (id === 'Entity') {
			handleEntityMessage(ws, callbackId, fn, args);
		} else if (clients[id] === undefined) {
			clients[id].ws.send( `${ws.id}_${callbackId}_${fn}_${args
							? args.constructor === Array
								? '_' + args.join('_')
								: `_${args}`
							: '')
				);
			}
		});
}

/* Handle a message directed at Entity */
function handleEntityMessage(ws, callbackId, fn, args) {
	if (Entity[fn] === undefined ) {
		return log(`${fn} is not a Entity function`);
	}
	let rv = Entity[fn](args);
	if (callbackId) {
		rv = rv ? '_' + (Array.isArray(rv) ? rv.join('_') : `${returnValue}` : '';
		const response = `${ws.id}_${callbackId}${rv}`;
		return ws.send(response);
	}
	log(`${fn} is not a Entity function`);
}

/* Log messages to the console with a custom prefix and color */
function log(...args) {
	console.log('\x1b[33mserver:', ...args, '\x1b[0m');
}

/* Generate a message from the specified parameters */
function encodeMessage(callerId, fn, args = undefined, callback = undefined) {
	let callbackId = '';

	if (callback) {
		while (!callbackId || callbackId in callbacks) {
			callbackId = crypto.randomUUID().split('-')[0];
		}

		callbacks[callbackId] = callback;
	}

	return (
		callerId +
		'_' +
		callbackId +
		'_' +
		fn +
		(args
			? args.constructor === Array
				? '_' + args.join('_')
				: `_${args}`
			: '')
	);
}

const Entity = {
	create: (args) => {
		const type = args.shift();
		const id = 'e' + next_entity_id++;
		const typeDefaults = defaultsByType[type];
		const values = new Array(typeDefaults.length + 2);

		values[0] = id;
		values[1] = type;

		for (let i = 0; i < typeDefaults.length; i++) {
			values[i + 2] = i < args.length ? args[i] : typeDefaults[i];
		}

		valuesById[id] = values;
		dirtyById[id] = values.join('_');
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
	const _dirtyIds = dirtyIds;
	dirtyIds = {};
	let messages = '';

	for (let id in _dirtyIds) {
		messages +=
			(messages ? ';' : '') + messageString('Entity', 'entity', _dirtyIds[id]);
	}

	if (!messages) {
		return;
	}

	for (let id of listeners) {
		clients[id].ws.send(messages);
	}
}, 1000);
