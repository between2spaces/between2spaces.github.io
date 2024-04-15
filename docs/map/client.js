//import './websocket.js';


export default function main(container) {

	function E(parent, tag = 'div', classList = null, styleProperties = null, content = []) {
		const div = document.createElement(tag);
		div.classList.add('div');
		if (classList === null) classList = [];
		if (classList.constructor !== Array) classList = [classList];
		for (let className of classList) {
			div.classList.add(className);
		}
		if (parent) parent.append(div);
		if (content.constructor !== Array) content = [content];
		for (let child of content) {
			console.log(child);
			if (child instanceof Element) {
				div.append(child);
			} else {
				div.textContent += child;
			}
		}
		if (styleProperties) style(div, styleProperties);
		return div;
	}

	function style(element, properties = {}) {
		for (let property of Object.keys(properties)) {
			console.log(property, properties[property]);
			element.style[property] = properties[property];
		}
	}

	function pos(left = 0, top = 0, width = null, height = null, additionalProperties = null) {
		const style = { position: 'absolute', left, top };
		if (width) style.width = width;
		if (height) style.height = height;
		if (additionalProperties) Object.assign(style, additionalProperties);
		return style;
	}

	E(document.head, 'style', null, null, [
		'.div {',
		'   border: 1px solid #333;',
		'}',
		'.equip-slot {',
		'   font-size: 16vh;',
		'   text-align: center;',
		'   line-height: 120%;',
		'   width: 100%;',
		'   height: 16.67%;',
		'   color: #aaa;',
		'   filter: grayscale(100%);',
		'   opacity: 50%;',
		'   overflow: hidden;',
		'}',
		'.loot {',
		'   color: #aaa;',
		'   overflow: hidden;',
		'   line-height: 100%;',
		'   padding: 0;',
		'}',
		'.loot-type {',
		'   filter: grayscale(100%);',
		'   opacity: 50%;',
		'   overflow: hidden;',
		'}',
		'.loot-name {',
		'   padding: 0.5em;',
		'}',
		''
	].join('\n'));

	const NorthWest = E(document.body, 'div', null, pos('0', '0', '33.33%', '33.33%'), 'NW');
	const North = E(document.body, 'div', null, pos('33.33%', '0', '33.33%', '33.33%'), 'N');
	const NorthEast = E(document.body, 'div', null, pos('66.66%', '0', '33.33%', '33.33%'), 'NE');
	const West = E(document.body, 'div', null, pos('0', '33.33%', '33.33%', '33.33%'), 'W');
	const Centre = E(document.body, 'div', null, pos('33.33%', '33.33%', '33.33%', '33.33%'), 'C');
	const East = E(document.body, 'div', null, pos('66.66%', '33.33%', '33.33%', '33.33%'), 'E');
	const SouthWest = E(document.body, 'div', null, pos('0', '66.66%', '33.33%', '33.33%'), 'SW');
	const South = E(document.body, 'div', null, pos('33.33%', '66.66%', '33.33%', '33.33%'), 'S');
	const SouthEast = E(document.body, 'div', null, pos('66.66%', '66.66%', '33.33%', '33.33%'), 'SE');


	const Equip = E(document.body, 'div', null, pos('0', '0', null, null, { height: '100%', width: '10%' }), '|');

	E(Equip, 'div', 'equip-slot', pos('0%', '0'), '🗡');
	E(Equip, 'div', 'equip-slot', pos('0', '16.67%', null, null, {}), '✋');
	E(Equip, 'div', 'equip-slot', pos('0', '33.33%', null, null, {}), '🗣');
	E(Equip, 'div', 'equip-slot', pos('0', '50%', null, null, { lineHeight: '100%' }), '👚');
	E(Equip, 'div', 'equip-slot', pos('0', '66.67%', null, null, {}), '👖');
	E(Equip, 'div', 'equip-slot', pos('0', '83.33%', null, null, { lineHeight: '60%' }), '👞');


	window.addEventListener('keydown', (event) => {
		let translateCols = 0;
		let translateRows = 0;
		if (event.key === 'k') translateRows = -1;
		else if (event.key === 'j') translateRows = 1;
	});

	window.drag = function (event) {
		event.dataTransfer.setData('text', event.target.id);
	}

	function loot(itemType, itemName) {
		const item = E(Centre, 'div', 'loot', pos(`${Math.random() * 80}%`, `${Math.random() * 80}%`), [
			E(null, 'span', 'loot-type', null, itemType),
			E(null, 'span', 'loot-name', null, itemName),
		]);
		item.id = `${Math.random()}`;
		item.draggable = "true";
		item.ondragstart = "drag(event)";
	}

	loot('👞', 'boots');
	loot('🗡', 'staff');

}
