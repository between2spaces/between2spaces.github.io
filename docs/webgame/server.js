import { WebSocketServer } from "ws";
import fs from "fs";

/**
 * Array to store WebSocket connections.
 * @type {WebSocket[]}
 */
const sockets = [];

/**
 * Cached map layers representations.
 * @type {String[]}
 */
const map = {};

/**
 * Size of the map.
 * @type {number}
 */
const mapsize = 5;

/**
 * Half size of the map.
 * @type {number}
 */
const halfsize = Math.floor(mapsize * 0.5);

/**
 * 3D array representing objects on the map.
 * @type {Object[][][]}
 */
const objects = new Array(mapsize);

/**
 * Array to store dirty objects
 * @type {Array}
 */
const dirty = [];

generateMap();

/**
 * WebSocket server instance.
 * @type {WebSocketServer}
 */
const wss = new WebSocketServer({
	port: process.env.PORT,
	verifyClient: (info) =>
		[undefined, "http://localhost:8000"].includes(info.req.headers.origin),
});

/**
 * Handles WebSocket connections.
 * @param {WebSocket} ws - The WebSocket connection.
 * @param {IncomingMessage} req - The incoming message.
 */
wss.on("connection", (ws, req) => {
	log("client connected");
	ws.on("message", (data) => handleMessage(ws, data));
	ws.on("close", () => handleClose(ws));
	ws.char = "@";
	drop(ws, halfsize, halfsize);
	sockets.push(ws);
	sendMap(ws);
});

/**
 * Handles WebSocket close events.
 * @param {WebSocket} ws - The WebSocket connection.
 */
function handleClose(ws) {
	log(`Client '${ws.id}' connection closed.`);
}

/**
 * Handles WebSocket message events.
 * @param {WebSocket} ws - The WebSocket connection.
 * @param {string} data - The received data.
 */
function handleMessage(ws, data) {
	log(`Received: '${data}'`);
}

/**
 * Logs messages to the console with a distinctive color.
 * @param {...any} args - The messages to be logged.
 */
function log(...args) {
	console.log("\x1b[33mserver:", ...args, "\x1b[0m");
}

/**
 * Load server clients from the specified directory.
 * @param {Error} err - The error object.
 * @param {string[]} files - The list of files in the directory.
 */
fs.readdir("./clients/", (err, files = []) => {
	if (err) {
		return log(err.message);
	}

	files.forEach((file) => {
		file.endsWith(".js") && import(`./clients/${file}`);
	});
});

/**
 * Generate the initial map.
 */
function generateMap() {
	for (let x = 0; x < mapsize; x++) {
		objects[x] = new Array(mapsize);

		for (let y = 0; y < mapsize; y++) {
			objects[x][y] = new Array(mapsize);

			for (let z = 0; z < mapsize; z++) {
				objects[x][y][z] = {
					hasFloor: false,
					contents: [],
				};
			}
		}
	}

	for (let x = 0; x < mapsize; x++) {
		for (let y = 0; y < mapsize; y++) {
			for (let z = 0; z < halfsize; z++) {
				drop({ char: "%", isFloor: true }, x, y);
			}

			drop({ char: ",", isFloor: false }, x, y);
		}
	}

	//	for (let z = mapsize - 1; z > -1; z--) {
	//		for (let x = 0; x < mapsize; x++) {
	//			console.log(objects[x][0][z].contents);
	//		}
	//	}
}

/**
 * Drops an object onto the map at the specified position.
 * @param {Object} object - The object to be dropped.
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 * @param {number} [z=mapsize-1] - The z-coordinate.
 */
function drop(object, x, y, z = mapsize - 1) {
	object.x = x;
	object.y = y;

	const column = objects[x][y];

	for (; z > -1; z--) {
		if (column[z].hasFloor) {
			if (object.isFloor) {
				z++;
				column[z].contents.unshift(object);
				column[z].hasFloor = true;
				return;
			}

			column[z].contents.push(object);
			object.z = z;
			return;
		}
	}

	if (object.isFloor) {
		column[0].contents.unshift(object);
		column[0].hasFloor = true;
		object.z = 0;
	} else {
		column[0].contents.push(object);
		object.z = 0;
	}
}

/**
 * Sends the map to a WebSocket connection.
 * @param {WebSocket} ws - The WebSocket connection.
 */
function sendMap(ws) {
	const z = ws.z;

	if (map[z] === undefined) {
		let zLayer = "";

		for (let y = 0; y < mapsize; y++) {
			let pattern = {
				chars: "",
				count: 0,
			};

			for (let x = 0; x < mapsize; x++) {
				let currentcell = "";
				const contents = objects[x][y][z].contents;

				for (let i = 0; i < contents.length; i++) {
					currentcell += contents[i].char;
				}

				if (pattern.chars === "") {
					pattern.chars = currentcell;
					pattern.count++;
				} else if (pattern.chars === currentcell) {
					pattern.count++;
				} else {
					zLayer += `${pattern.count}${pattern.chars}`;
					pattern.chars = currentcell;
					pattern.count = 1;
				}
			}

			if (pattern.count > 0) {
				zLayer += `${pattern.count}${pattern.chars}`;
			}

			zLayer += "\n";
		}

		map[z] = zLayer;
	}

	ws.send(map[z]);
}

/**
 * Periodically processes dirty columns.
 */
setInterval(() => {
	while (dirty.length) {
		let column = dirty.shift();
		//console.log(column);
	}
}, 1000);
