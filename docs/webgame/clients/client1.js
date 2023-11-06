import { WebSocket } from 'ws';

const ws = new WebSocket(`ws://localhost:${process.env.PORT}`);

ws.on('open', () => handleOpen());
ws.on('close', () => handleClose());
ws.on('message', (data) => handleMessage(data.data));
ws.on('error', (error) => handleError(error));

function handleOpen() {
	log('socket open');
	ws.send('hello');
}

function handleClose() {
	log('socket close');
}

function handleMessage(data) {
	log(data);
}

function handleError(error) {
	log(error);
}

function log(...args) {
	console.log('\x1b[25mclient:', ...args, '\x1b[0m');
}

