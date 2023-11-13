import { WebSocketServer } from 'ws';
import fs from 'fs';

const sockets = [];
const mapsize = 5;
const halfsize = Math.floor(mapsize * 0.5);
const objects = new Array(mapsize);
const dirty = [];

generateMap();

const wss = new WebSocketServer({
	port: process.env.PORT,
	verifyClient: (info) =>
		[undefined, 'http://localhost:8000'].includes(info.req.headers.origin),
});

wss.on('connection', (ws, req) => {
	log('client connected');
	ws.on('message', (data) => handleMessage(ws, data));
	ws.on('close', () => handleClose(ws));
	ws.char = '@';
	drop(ws, halfsize, halfsize);
	sockets.push(ws);
	sendMap(ws);
});

function handleClose(ws) {
	log(`Client '${ws.id}' connection closed.`);
}

function handleMessage(ws, data) {
	log(`Received: '${data}'`);
}

function log(...args) {
	console.log('\x1b[33mserver:', ...args, '\x1b[0m');
}

fs.readdir('./clients/', (err, files = []) => {
	if (err) {
		return log(err.message);
	}

	files.forEach((file) => {
		file.endsWith('.js') && import(`./clients/${file}`);
	});
});

function generateMap() {
	for (let x = 0; x < mapsize; x++) {
		objects[x] = new Array(mapsize);

		for (let y = 0; y < mapsize; y++) {
			objects[x][y] = new Array(mapsize);

			for (let z = 0; z < mapsize; z++) {
				objects[x][y][z] = {
					hasFloor: false,
					contents: []
				};
			}
		}
	}

	for (let x = 0; x < mapsize; x++) {
		for (let y = 0; y < mapsize; y++) {
			for (let z = 0; z < halfsize; z++) {
				drop({char: '%', isFloor: true}, x, y);
			}
			drop({char: ',', isFloor: false}, x, y);
		}
	}

//	for (let z = mapsize - 1; z > -1; z--) {
//		for (let x = 0; x < mapsize; x++) {
//			console.log(objects[x][0][z].contents);
//		}
//	}
}

function drop(object, x, y, z = mapsize - 1) {
	object.x = x;
	object.y = y;

	const column = objects[x][y];

	for (; z > -1; z--) {
		if (column[z].hasFloor) {
			if(object.isFloor) {
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

	if(object.isFloor) {
		column[0].contents.unshift(object);
		column[0].hasFloor = true;
		object.z = 0;
	} else {
		column[0].contents.push(object);
		object.z = 0;
	}
}

const map = {};

function sendMap(ws) {
	const z = ws.z;
	if (map[z] === undefined ) {
		let zLayer = '';
		for (let y = 0; y < mapsize; y++) {
			let pattern = {
				chars: '',
				count: 0
			};
			for (let x = 0; x < mapsize; x++) {
				let currentcell = '';
				const contents = objects[x][y][z].contents;
				for (let i = 0; i < contents.length; i++ ) {
					currentcell += contents[i].char;
				}
				if (pattern.chars === '') {
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
			zLayer += '\n';
		}
		map[z] = zLayer;
	}
	ws.send(map[z]);
}

setInterval(() => {
	while (dirty.length) {
		let column = dirty.shift();
		//console.log(column);
	}
}, 1000);
