import { WebSocketServer } from 'ws';
import fs from 'fs';

const wss = new WebSocketServer({
	port: process.env.PORT,
	verifyClient: (info) =>
		[undefined, 'http://localhost:8000'].includes(info.req.headers.origin),
});

wss.on('connection', (ws, req) => {
	log('client connected');
	ws.on('message', (data) => handleMessage(ws, data));
	ws.on('close', () => handleClose(ws));
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

	files.forEach((file)=>{
		file.endsWith('.js') && import(`./clients/${file}`);
	});
});

setInterval(() => {
	log('server update');
}, 1000);
