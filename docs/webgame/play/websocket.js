const ws = new WebSocket(`ws://localhost:6500`);

ws.addEventListener('open', () => handleOpen());
ws.addEventListener('close', () => handleClose());
ws.addEventListener('message', (message) => handleMessage(message.data));
ws.addEventListener('error', (error) => handleError(error));

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

