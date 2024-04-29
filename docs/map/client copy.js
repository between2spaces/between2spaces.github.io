//import './websocket.js';


export default function main(container) {
	UI.init();
	initiateWorld();

	// Listen for Keydowns
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
}


function E(parent = null, tag = 'div', classList = null, styleProperties = null, content = null) {
	const div = document.createElement(tag);
	div.classList.add('div');
	if (classList === null) classList = [];
	if (classList.constructor !== Array) classList = [classList];
	for (let className of classList) div.classList.add(className);
	if (parent) parent.append(div);
	if (styleProperties) {
		for (let property of Object.keys(styleProperties)) {
			div.style[property] = styleProperties[property];
		}
	}
	if (content === null) content = [];
	if (content.constructor !== Array) content = [content];
	for (let child of content) {
		if (child instanceof Element) {
			div.append(child);
		} else {
			div.textContent += child;
		}
	}
	return div;
}


function pos(left = 0, top = 0, width = null, height = null, additionalProperties = null) {
	const style = { position: 'absolute', left, top };
	if (width) style.width = width;
	if (height) style.height = height;
	if (additionalProperties) Object.assign(style, additionalProperties);
	return style;
}


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
		selectedEl: null
	},

	focus: {
		dom: null,
	},

	init: () => {

		E(document.head, 'style', null, null, '.div { border: 1px solid #aaa; }');

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

		E(document.body, 'div', null, pos('1em', '3em', '20%', '2em'), [
			E(null, 'div', 'NavItem', null, [
				E(null, 'div', 'NavItemType'),
				E(null, 'div', 'NavItemName'),
				E(null, 'div', 'NavItemDmg', null, 'Dmg'),
				E(null, 'div', 'NavItemQlty', null, 'Qlty')
			]),
			UI.parent.dom = E(null, 'div', 'NavItem', null, [
				E(null, 'div', 'NavItemType', null, UI.Object()),
				E(null, 'div', 'NavItemName'),
				E(null, 'div', 'NavItemDmg'),
				E(null, 'div', 'NavItemQlty')
			])
		]);
		UI.parent.dom.addEventListener('click', () => { UI.selectOut(); });

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
		if (!item.volume) return;

		UI.breadcrumb.textContent = '';

		UI.parent.dom.querySelector('.NavItemType').textContent = '';
		UI.parent.dom.querySelector('.NavItemName').textContent = '';
		UI.parent.dom.querySelector('.NavItemDmg').textContent = '';
		UI.parent.dom.querySelector('.NavItemQlty').textContent = '';

		UI.location.dom.innerHTML = '';

		E(UI.location.dom, 'div', 'NavItem', null, [
			E(null, 'div', 'NavItemType'),
			E(null, 'div', 'NavItemName'),
			E(null, 'div', 'NavItemDmg', null, 'Dmg'),
			E(null, 'div', 'NavItemQlty', null, 'Qlty')
		]);

		UI.location.item = item;
		const hierarchy = [];
		for (let location = item; location !== null; location = location.parent) {
			hierarchy.unshift(location);
		}
		UI.breadcrumb.innerHTML = '';
		for (let location of hierarchy) {
			UI.breadcrumb.textContent += `/ ${location.type} ${location.name} `;
		}

		UI.update(item);

		UI.location.items = [];
		UI.location.selectedEl = null;
		UI.location.selectedEl = null;
		for (let child of item.contents) {
			UI.add(child);
		}
	},

	add(item) {
		const el = E(UI.location.dom, 'div', 'NavItem', null, [
			E(null, 'div', 'NavItemType'),
			E(null, 'div', 'NavItemName'),
			E(null, 'div', 'NavItemDmg'),
			E(null, 'div', 'NavItemQlty')
		])
		el.id = `item-${item.id}`;
		UI.location.items.push(item);
		el.addEventListener('click', () => { UI.location.selectedEl === el && item.contents.length > 0 ? World.setLocation(item) : UI.select(el); });
		el.addEventListener('dblclick', () => { if (item.contents.length > 0) World.setLocation(item); });
		if (UI.location.selectedEl === null) this.select(el);
		UI.update(item);
	},

	select(el) {
		if (!el) return;
		if (UI.location.selectedEl) UI.location.selectedEl.style.background = 'none';
		el.style.background = '#eee';
		UI.location.selectedEl = el;
	},

	selectPrevious() {
		this.select(UI.location.selectedEl.previousSibling);
	},

	selectNext() {
		this.select(UI.location.selectedEl.nextSibling);
	},

	selectOut() {
		this.setLocation(UI.location.item.parent);
	},

	selectIn() {
		this.setLocation(O.byId[UI.location.selectedEl.id.split('-')[1]]);
	},

	update(object) {
		if (object.parent === UI.location.item) {
			const navItem = document.getElementById(`item-${object.id}`);
			if (object.damage >= 1) {
				if (UI.location.selectedEl === navItem) {
					UI.location.selectedEl.previousSibling ? UI.selectPrevious() : UI.selectNext();
				}
				return navItem.remove();
			}
			navItem.querySelector('.NavItemType').textContent = object.type;
			navItem.querySelector('.NavItemName').textContent = object.name;
			navItem.querySelector('.NavItemDmg').textContent = (Math.round((object.damage + Number.EPSILON) * 100) / 100).toFixed(2);
			navItem.querySelector('.NavItemQlty').textContent = (Math.round((object.quality + Number.EPSILON) * 100) / 100).toFixed(2);
		} else if (object === UI.location.item) {
			if (object.damage >= 1) return UI.setLocation(object.parent);
			UI.parent.dom.querySelector('.NavItemType').textContent = object.type;
			UI.parent.dom.querySelector('.NavItemName').textContent = object.name;
			UI.parent.dom.querySelector('.NavItemDmg').textContent = (Math.round((object.damage + Number.EPSILON) * 100) / 100).toFixed(2);
			UI.parent.dom.querySelector('.NavItemQlty').textContent = (Math.round((object.quality + Number.EPSILON) * 100) / 100).toFixed(2);
		}
	}
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
		quality: 0.98 + Math.random() * 0.019,
		damage: 0,
	}, properties);

	O.byId[object.id = O.nextId++] = object;

	object.contents = [];

	if (object.id > 0) {
		if (!object.parent) object.parent = O.byId[0];
		O.add(object.parent, object);
	}

	if (properties.contents) {
		for (let child_properties of properties.contents) {
			child_properties.parent = object;
			O(child_properties);
		}
	}

	return object;
}

O.add = function (parent, object) {
	if (object.parent) {
		const i = object.parent.contents.indexOf(object);
		if (i > -1) object.parent.contents.splice(i, 1);
	}
	object.parent = parent;
	parent.contents.push(object);

	if (UI.location.item.id === parent.id) {
		UI.add(object);
	}
}

O.destroy = function (object) {
	if (object.parent) {
		const i = object.parent.contents.indexOf(object);
		object.parent.contents.splice(i, 1);
	}
	for (let child of object.contents) {
		if (object.parent) O.add(object.parent, child);
	}
	delete O.byId[object.id];
	UI.update(object);
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
	O({ type: '👞' });

	O({
		type: '🔥', volume: 9, quality: 0.9, contents: [
			{ type: '/' },
		]
	});

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

	const tick = 2000;
	setInterval(O.update, tick);

}

O.update = function (object = O.byId[0], decay = 1) {
	if (object.type === '🔥') decay *= 2;

	object.damage += (1 - object.quality) * decay;

	if (object.damage >= 1) return O.destroy(object);

	UI.update(object);

	for (let child of object.contents) {
		O.update(child, decay);
	}
}
