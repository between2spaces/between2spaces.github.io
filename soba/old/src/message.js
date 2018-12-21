import dom from './dom';


var message = message || function () {};


(function (internal) {
	
	message = function (msg) {
	
		var now = new Date();
	
		now = ('00' + now.getHours()).slice(-2) + ':' + ('00' + now.getMinutes()).slice(-2) + ':' + ('00' + now.getSeconds()).slice(-2);
	
		var row = dom.element('tr', [
			dom.element('td', { color: message.TIMESTAMP_COLOUR, verticalAlign: 'top' }, now),
			dom.element('td', { color: message.MESSAGE_COLOUR }, msg)
		]);
	
		if (internal.rows.childNodes.length === message.MAX_MESSAGES) {
	
			internal.rows.removeChild(internal.rows.firstChild);
	
		}
	
		internal.rows.appendChild(row);
	
	};
	
	message.MAX_MESSAGES = 30;
	message.MESSAGE_COLOUR = '#000';
	message.TIMESTAMP_COLOUR = '#777';
	message.FONT_SIZE = '80%';
	
	internal.dom = internal.dom || dom.element(document.body, 'div', {
		position: 'absolute',
		left: '10px',
		bottom: '10px',
		background: 'rgba(0, 0, 0, 0.2)',
		minWidth: '300px',
		maxWidth: '300px',
		minHeight: '150px',
		maxHeight: '150px',
		overflowY: 'scroll',
		opacity: '0.5',
		fontSize: message.FONT_SIZE
	}, dom.element('table', internal.rows = dom.element('tbody')));
	
	
	message.internal = internal;
	
	
} (message.internal || {}));


export default message;