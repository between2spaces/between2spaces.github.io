import { WebSocket } from 'ws';

function connect(config, url = `ws://localhost:${process.env.PORT}`) {
	return new Promise((resolve, reject) =>
		createConnection(config, url, resolve, reject)
	);
}

function createConnection(config, url, resolve, reject) {
	const connection = createCallback();
	connection.config = config;
	connection.call = (targetId, fn, args = '') => call(config.id, targetId, fn, args);
	connection.properties = (typeId) => properties(config.id, typeId);
	connection.log = (...args) => log(config.id, args);
	callbacks[connection.id].connection = {
		resolve: (id) => handleConnectionResolve(connection, id, resolve),
		reject: (err) => handleConnectionReject(connection, err, reject),
	};
	connection.ws = new WebSocket(url, buildSWPArray(connection));
	setupSocketCallbacks(connection);
	return connection;
}

function buildSWPArray(connection) {
	const swp = [connection.config.id || '$'];
	['dependencies', 'properties', 'defaults'].forEach((property) => {
		const arr = connection.config[property];

		if (arr && arr.length) {
			swp.push(property + arr.join('_').replace(' ', ''));
		}
	});

	if (connection.config.listen) {
		swp.push('listen');
	}

	return swp;
}

function setupSocketCallbacks(connection) {
	const ws = connection.ws;
	ws.addEventListener('open', () => handleOpen(connection));
	ws.addEventListener('close', () => handleClose(connection));
	ws.addEventListener('message', (msg) => handleMessage(connection, msg.data));
	ws.addEventListener('error', (err) => handleError(connection, err));
}

function handleConnectionResolve(connection, id, resolve) {
	log('client', `connection... client assigned id '${id}'`);
	const config = connection.config;
	sockets[(config.id = id)] = connection.ws;

	if (config.update && intervals[config.id] === undefined) {
		config.interval ??= 10000;
		intervals[config.id] = setInterval(
			() => config.update(connection),
			config.interval
		);
	}

	resolve(connection);
}

function handleConnectionReject(connection, error, reject) {
	log('client', `connection... client rejected error: ${error}`);
	reject(connection, error);
}

function handleOpen(connection) {
	const id = connection.config.id;

	if (cache[id] !== undefined) {
		sockets[id].send(cache[id]);
		delete cache[id];
	}
}

function handleClose(connection) {}

function handleMessage(connection, messages) {
	messages.split(';').forEach((msg) => {
		const [callerId, cid, fn, ...args] = msg.toString().split('_');

		if (callbacks[fn]) {
			const callback = callbacks[fn];
			(args.shift() ? callback.reject : callback.resolve)(connection, args);
			releaseCallback(callback);
			return;
		} else if (callbacks[connection.id] && callbacks[connection.id][fn]) {
			(args.shift()
				? callbacks[connection.id][fn].reject
				: callbacks[connection.id][fn].resolve)(connection, args);
			return;
		}

		if (connection.config[fn]) {
			connection.config[fn](connection, args);
			return;
		}

		connection.config.debug &&
			console.error(`Warn: ${connection.config.id}.${fn} not found`);
	});
}

function createCallback(resolve, reject) {
	let id =
		callbacks.released?.length > 0
			? callbacks.released.shift()
			: Object.keys(callbacks).length;
	return (callbacks[id] = { id, resolve, reject });
}

function releaseCallback(callback) {
	delete callbacks[callback.id];
	callbacks.released === undefined
		? (callbacks.released = [callback.id])
		: callbacks.released.push(callback.id);
}

function call(clientId, targetId, fn, args = '') {
	return new Promise((resolve, reject) => {
		send(clientId, targetId, fn, args, '', createCallback(resolve, reject));
	});
}

function send(
	clientId,
	targetId,
	fn,
	args = '',
	status = '',
	callback = undefined
) {
	args = args ? (Array.isArray(args) ? '_' + args.join('_') : `_${args}`) : '';

	const msg = `${targetId}_${
		callback ? callback.id : ''
	}_${fn}_${status}${args}`;

	const socket = sockets[clientId];

	if (socket.readyState) {
		socket.send(msg);
	} else {
		cache[clientId] = clientId in cache ? `${cache[clientId]};` : '';
		cache[clientId] += msg;
	}
}

function properties(clientId, typeid) {
	return new Promise((resolve, reject) => {
		typeid in properties_cache ? resolve() : reject();
	}).then(
		() => properties_cache[typeid],
		() =>
			call(clientId, 'Entity', 'properties', typeid).then(
				(properties) => handlePropertiesResolve(properties)
			)
	);
	function handlePropertiesResolve(properties) {
		properties = Array.isArray(properties) ? properties : [properties];
		const map = (properties_cache[typeid] = {});

		for (let index in properties) {
			map[properties[index]] = parseInt(index);
		}

		return map;
	}
}

function handleError(clientId, err) {}

function log(id, ...args) {
	console.log(`\x1b[96m'${id}':`, ...args, '\x1b[0m');
}

function error(err) {}

const sockets = {};
const callbacks = {
	released: [],
};
const intervals = {};
const cache = {};
const properties_cache = {};

export { connect, log, call, properties };
