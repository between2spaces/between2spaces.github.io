import { WebSocket } from 'ws';

/* Function for connecting to the server */
function connect(client, url = `ws://localhost:${process.env.PORT}`) {
	const swp = buildSWPArray(client);

	const socket = createWebSocket(client, url, swp);

	setupSocketCallbacks(client, socket);
}

/* Build the swp array for WebSocket connection */
function buildSWPArray(client) {
	const swp = [];

	swp.push(client.id || '?');

	['dependencies', 'properties', 'defaults'].forEach((property) => {
		const arr = client[property];

		if (arr && arr.length) {
			swp.push(property + arr.join('_').replace(' ', ''));
		}
	});

	if (client.listen) {
		swp.push('listen');
	}

	return swp;
}

/* Create a WebSocket instance */
function createWebSocket(client, url, swp) {
	const socket = new WebSocket(url, swp);

	callbacks[(client.id = next_callback_id())] = {
		connection: {
			resolve: (id) => {
				handleConnectionResolve(client, id, socket);
			},
			reject: (error) => {
				handleConnectionReject(client, error);
			},
		},
	};

	return socket;
}

/* Handle the connection resolve */
function handleConnectionResolve(client, id, socket) {
	log('client', `connection... client assigned id '${id}'`);

	delete callbacks[client.id];

	sockets[(client.id = id)] = socket;

	if (client.update && intervals[client.id] === undefined) {
		client.interval ??= 10000;
		intervals[client.id] = setInterval(
			() => client.update(client),
			client.interval
		);
	}

	if (client.resolve) {
		client.resolve();
	}
}

/* Handle the connection reject */
function handleConnectionReject(client, error) {
	log('client', `connection... client rejected error: ${error}`);

	delete callbacks[client.id];

	if (client.reject) {
		client.reject(error);
	}
}

/* Set up WebSocket event callbacks */
function setupSocketCallbacks(client, socket) {
	socket.addEventListener('open', () => handleSocketOpen(client));
	socket.addEventListener('close', () => handleSocketClose(client));
	socket.addEventListener('message', (msg) => handleMessage(client, msg.data));
	socket.addEventListener('error', (err) => handleSocketError(client, err));
}

/* Handle the WebSocket open event */
function handleSocketOpen(client) {
	if (cache[client.id] !== undefined) {
		sockets[client.id].send(cache[client.id]);
		delete cache[client.id];
	}
}

/* Handle the WebSocket close event */
function handleSocketClose(client) {}

/* Handle incoming messages */
function handleMessage(client, messages) {
	messages.split(';').forEach((msg) => {
		const [callerId, cid, fn, ...args] = msg.toString().split('_');
		const callback = callbacks[client.id];

		if (callback && callback[fn] !== undefined) {
			(args.shift() ? callback[fn].reject : callback[fn].resolve)(...args);
			delete callback[fn];
		}

		if (client[fn] !== undefined) {
			client[fn](args);
		} else {
			client.debug && console.error(`Warn: client.${fn} not found`);
		}
	});
}

/* Return the next available callback ID */
function next_callback_id() {
	let id = 0;

	while (callbacks[id] !== undefined) {
		id++;
	}

	return id;
}

/* Send a message to the server */
function call(client, targetId, fn, args = '') {
	let callbackId;
	const callback = (callbacks[(callbackId = next_callback_id())] = {});

	return new Promise((resolve, reject) => {
		callback.resolve = resolve;
		callback.reject = reject;
		send(client, targetId, fn, args, '', callbackId);
	});
}

/* Sends a message to the WebSocket with the specified parameters */
function send(client, targetId, fn, args = '', status = '', callbackId = '') {
	args = args ? (Array.isArray(args) ? '_' + args.join('_') : `_${args}`) : '';

	const msg = `${targetId}_${callbackId ?? ''}_${fn}_${status}${args}`;

	console.log(msg);

	const socket = sockets[client.id];

	if (socket.readyState) {
		socket.send(msg);
	} else {
		cache[client.id] = client.id in cache ? `${cache[client.id]};` : '';
		cache[client.id] += msg;
	}
}

/* Retrieve and cache property mappings for a specific client ID */
function properties(client_id) {
	return new Promise((resolve, reject) => {
		client_id in properties_cache ? resolve() : reject();
	}).then(
		() => properties_cache[client_id],
		() => call('Entity', 'properties', client_id).then(mapProperties)
	);

	function mapProperties(properties) {
		const map = (properties_cache[client_id] = {});

		for (let index in properties) {
			map[properties[index]] = parseInt(index);
		}

		return map;
	}
}

/* Handle errors (if needed) */
function handleSocketError(client, err) {
	/* Implementation for handling WebSocket errors */
}

/* Log function with color formatting */
function log(id, ...args) {
	console.log(`\x1b[96m'${id}':`, ...args, '\x1b[0m');
}

/* Handle errors (if needed) */
function error(err) {
	/* Implementation for handling errors */
}

const sockets = {};
const callbacks = {};
const intervals = {};
const cache = {};
const properties_cache = {};

export { connect, log, call, properties };
