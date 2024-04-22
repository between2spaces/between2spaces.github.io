//import './websocket.js';


export default function main(container) {
	UI.init();
	initiateWorld();
	setupKeydownListeners();
}


function E(parent = null, tag = 'div', classList = null, styleProperties = null, content = []) {
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


function setupKeydownListeners() {
	const selectPreviousItem = ['w', 'k', 'ArrowUp'];
	const selectNextItem = ['s', 'j', 'ArrowDown'];
	const selectParentLocation = ['a', 'h', 'ArrowLeft'];
	const selectItemLocation = ['d', 'l', 'ArrowRight'];

	window.addEventListener('keydown', (event) => {
		if (selectPreviousItem.indexOf(event.key) > -1) {
			UI.selectPrevious();
		} else if (selectNextItem.indexOf(event.key) > -1) {
			UI.selectNext();
		} else if (selectParentLocation.indexOf(event.key) > -1) {
			UI.selectOut();
		} else if (selectItemLocation.indexOf(event.key) > -1) {
			UI.selectIn();
		}
	});
};


const UI = {

	breadcrumb: null,
	parent: {
		dom: null,
		type: null,
		name: null
	},

	location: {
		dom: null,
		item: null,
		items: [],
		selectedIndex: 0
	},

	focus: {
		dom: null,
	},

	init: () => {

		E(document.head, 'style', null, null, [
			'.div {',
			'   border: 1px solid #aaa;',
			'}',
			''
		].join('\n'));

		UI.breadcrumb = E(document.body, 'div', null, {
			position: 'absolute',
			left: '1em',
			top: '1em',
			width: 'calc(40% - 0.5em)',
			height: '2em',
			paddingLeft: '0.5em',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			filter: 'grayscale(100%)',
			opacity: '50%',
			lineHeight: '2em',
		});
		UI.breadcrumb.addEventListener('click', () => { World.moveUp(); });

		UI.parent.dom = E(document.body, 'div', null, pos('1em', '3em', '20%', '2em'),
			E(null, 'div', null, UI.StyleNavItem, [
				UI.parent.type = E(null, 'div', 'NavItemType'),
				UI.parent.name = E(null, 'div', 'NavItemName')
			])
		);
		UI.parent.dom.addEventListener('click', () => { World.moveUp(); });

		UI.location.dom = E(document.body, 'div', null, {
			position: 'absolute',
			left: 'calc(20% + 1em)',
			top: '3em',
			right: '40%',
			bottom: '1em',
		});

		UI.focus.dom = E(document.body, 'div', null, {
			position: 'absolute',
			left: 'calc(20% + 1em)',
			top: '3em',
			right: '40%',
			bottom: '1em',
		});

		UI.setLocation(O.byId[0]);
	},

	setLocation(item) {
		if (!item) return;
		if (!item.volume) return this.setLocation(item.parent);

		UI.breadcrumb.textContent = '';
		UI.parent.type.textContent = '';
		UI.parent.name.textContent = '';
		UI.location.dom.innerHTML = '';

		UI.location.item = item;
		const hierarchy = [];
		for (let location = item; location !== null; location = location.parent) {
			hierarchy.unshift(location);
		}
		UI.breadcrumb.innerHTML = '';
		for (let location of hierarchy) {
			UI.breadcrumb.textContent += `/ ${location.type} ${location.name} `;
		}
		UI.parent.type.textContent = item.type;
		UI.parent.name.textContent = item.name;

		UI.location.items = [];
		UI.location.selectedIndex = 0;
		for (let child of item.contents) {
			UI.add(child);
		}
	},

	add(item) {
		const el = E(UI.location.dom, 'div', 'NavItem', null, [
			E(null, 'div', 'NavItemType', null, item.type),
			E(null, 'div', 'NavItemName', null, item.name)
		])
		const index = UI.location.dom.childElementCount - 1;
		el.id = `item-${index}`;
		UI.location.items.push(item);
		el.addEventListener('click', () => { UI.location.selectedIndex === index && item.contents.length > 0 ? World.setLocation(item) : UI.select(index); });
		el.addEventListener('dblclick', () => { if (item.contents.length > 0) World.setLocation(item); });
		if (UI.location.selectedIndex === index) this.select(index);
	},

	select(num) {
		const el = document.getElementById(`item-${num}`);
		if (!el) return;
		const prev = document.getElementById(`item-${UI.location.selectedIndex}`);
		if (prev) {
			prev.style.background = 'none';
		}
		el.style.background = '#eee';
		UI.location.selectedIndex = num;
	},

	selectPrevious() {
		this.select(UI.location.selectedIndex - 1);
	},

	selectNext() {
		this.select(UI.location.selectedIndex + 1);
	},

	selectOut() {
		this.setLocation(UI.location.item.parent);
	},

	selectIn() {
		this.setLocation(UI.location.items[UI.location.selectedIndex]);
	},
}




const Focus = {
	dom: null,
	typeEl: null,

	init: function () {
		Focus.dom = E(document.body, 'div', 'focus', pos('50%', '0', '50%', '100%'));
		Focus.typeEl = E(Focus.dom, 'div', 'focus-type');
	},

	set: function (item) {
		Focus.typeEl.innerHTML = item.type;
	}
};


const Equip = {
	dom: null,

	init: function () {

		E(document.head, 'style', null, null, [
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
			''
		].join('\n'));

		Equip.dom = E(document.body, 'div', null, pos('0', '0', '10%', '100%'));

		E(Equip, 'div', 'equip-slot', pos('0%', '0', null, null, { lineHeight: '105%' }), '🗡');
		E(Equip, 'div', 'equip-slot', pos('0', '16.67%', null, null, { lineHeight: '105%' }), E(null, 'div', null, { fontSize: '14vh', opacity: '50%' }, '✋'));
		E(Equip, 'div', 'equip-slot', pos('0', '33.33%', null, null, { fontSize: '19vh', lineHeight: '90%' }), '🗣');
		E(Equip, 'div', 'equip-slot', pos('0', '50%', null, null, { lineHeight: '105%' }), E(null, 'div', null, { fontSize: '14vh', marginLeft: '-15%', opacity: '50%' }, '👚'));
		E(Equip, 'div', 'equip-slot', pos('0', '66.67%', null, null, { lineHeight: '105%' }), E(null, 'div', null, { fontSize: '14vh', opacity: '50%' }, '👖'));
		E(Equip, 'div', 'equip-slot', pos('0', '83.33%', null, null, { lineHeight: '100%' }), E(null, 'div', null, { fontSize: '13vh', marginLeft: '-10%', opacity: '50%' }, '👞'));
	}
};




function O(properties) {
	const object = Object.assign({
		parent: null,
		type: '?',
		name: properties.type ? O.types[properties.type] : 'Undefined',
		contents: [],
		volume: 0,
	}, properties);

	O.byId[object.id = O.nextId++] = object;

	object.contents = [];

	if (properties.contents) {
		for (let child_properties of properties.contents) {
			console.log(child_properties);
			child_properties.parent = object;
			object.contents.push(O(child_properties));
		}
	}

	if (object.id > 0) {
		if (!object.parent) object.parent = O.byId[0];
		O.add(object.parent, object);
	}

	return object;
}

O.add = function (parent, object) {
	if (object.parent) {
		const i = object.parent.contents.indexOf(object);
		if (i > -1); object.parent.contents.splice(i, 1);
	}
	object.parent = parent;
	parent.contents.push(object);
	if (UI.location.item === parent) UI.add(object);
}

O.types = {
	'?': 'Undefined',
	'🌎': 'World',
	'🔥': 'Campfire',
	'👖': 'Pants',
	'👞': 'Boots',
	'🗡': 'Weapon',
	'⌂': 'Tent',
	'/': 'Log',
	'💧': 'Water',
	'🏺': 'Jar',
};

O.byId = {};
O.nextId = 0;
O({ type: '🌎', volume: 99999999 });





function initiateWorld() {
	O({
		type: '🔥', volume: 9, contents: [
			{ type: '/' },
		]
	});

	O({ type: '👞' });
	O({ type: '🗡' });

	O({
		type: '⌂', volume: 99, contents: [
			{ type: '👖' },
			{
				type: '🏺', volume: 99, contents: [
					{ type: '💧' },
				]
			},
		]
	});
}