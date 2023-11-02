import { WebSocket } from 'ws';

/* Function for connecting to the server */
function connect(client, url = `ws://localhost:${process.env.PORT}`) {
	const callback = createCallback();
	const swp = buildSWPArray(client, callback);
	const socket = new WebSocket(url, swp);
	setupSocketCallbacks(client, socket, callback);
}

/* Build the swp array for WebSocket connection */
function buildSWPArray(client, callback) {
	const swp = [client.id || '$', callback.id.toString()];
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
function setupSocketCallbacks(client, socket, callback) {
	socket.addEventListener('open', () => handleSocketOpen(client));
	socket.addEventListener('close', () => handleSocketClose(client));
	socket.addEventListener('message', (msg) => handleSocketMessage(client, msg.data));
	socket.addEventListener('error', (err) => handleSocketError(client, err));

	callback.resolve = id => handleConnectionResolve(client, id, socket);
	callback.reject = error => handleConnectionReject(client, error);
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
function handleSocketMessage(client, messages) {
	messages.split(';').forEach((msg) => {
		const [callerId, cid, fn, ...args] = msg.toString().split('_');
		const callback = callbacks[cid];

		if (callback) {
			(args.shift() ? callback.reject : callback.resolve)(...args);
			delete callback[cid];
		}

		if (client[fn] !== undefined) {
			client[fn](args);
		} else {
			client.debug && console.error(`Warn: client.${fn} not found`);
		}
	});
}

/* Return the next available callback ID */
function createCallback(resolve, reject) {
	let id = 0;

	while (callbacks['c'+id] !== undefined) {
		id++;
	}

	id = 'c' + id;

	return (callbacks[id] = { id, resolve, reject });
}

/* Send a message to the server */
function call(client, targetId, fn, args = '') {
	return new Promise((resolve, reject) => {
		send(client, targetId, fn, args, '', createCallback(resolve, reject));
	});
}

/* Sends a message to the WebSocket with the specified parameters */
function send(client, targetId, fn, args = '', status = '', callbackId = undefined) {
	args = args ? (Array.isArray(args) ? '_' + args.join('_') : `_${args}`) : '';

	const msg = `${targetId}_${callbackId ? callbackId : ''}_${fn}_${status}${args}`;

	log('client', msg);

	const socket = sockets[client.id];

	if (socket.readyState) {
		socket.send(msg);
	} else {
		cache[client.id] = client.id in cache ? `${cache[client.id]};` : '';
		cache[client.id] += msg;
	}
}

/* Retrieve and cache property mappings for a specific client ID */
function properties(client, typeid) {
	return new Promise((resolve, reject) => {
		typeid in properties_cache ? resolve() : reject();
	}).then(
		() => properties_cache[typeid],
		() => call(client, 'Entity', 'properties', typeid)
		.then(handlePropertiesResolve, handlePropertiesReject)
	);

	function handlePropertiesResolve(properties) {
		const map = (properties_cache[typeid] = {});

		for (let index in properties) {
			map[properties[index]] = parseInt(index);
		}

		return map;
	}

	function handlePropertiesReject(error) {
		log('client', 'handlePropertiesReject', error);
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
